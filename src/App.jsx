import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import Login from './components/Login';
import CallModal from './components/CallModal';
import SettingsModal from './components/SettingsModal';
import AddUserModal from './components/AddUserModal';
import CreateGroupModal from './components/CreateGroupModal';
import AddMemberModal from './components/AddMemberModal';
import GroupInfoModal from './components/GroupInfoModal';
import { AnimatePresence } from 'framer-motion';
import { auth, db, googleProvider, rtdb, messaging } from './firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  setDoc,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { 
  ref, 
  onValue, 
  set, 
  onDisconnect, 
  serverTimestamp as rtdbTimestamp 
} from 'firebase/database';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState({});
  const [users, setUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [myContacts, setMyContacts] = useState([]);
  const [callHistory, setCallHistory] = useState([]);
  const [sidebarTab, setSidebarTab] = useState('chats'); // 'chats' or 'calls'
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [myGroups, setMyGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userData = {
          uid: user.uid,
          name: user.displayName,
          avatar: user.photoURL,
          email: user.email,
          searchEmail: user.email.toLowerCase(),
          searchName: user.displayName.toLowerCase(),
          lastSeen: serverTimestamp()
        };
        
        // Save user to Firestore
        try {
          const { setDoc, doc } = await import('firebase/firestore');
          await setDoc(doc(db, 'users', user.uid), userData, { merge: true });
        } catch (e) {
          console.error("Error saving user:", e);
        }

        setCurrentUser(userData);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Messaging / Notification Setup
  useEffect(() => {
    if (currentUser && messaging) {
      const setupNotifications = async () => {
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            // Register service worker explicitly for more reliability
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            
            const vapidKey = "BKe1M_m-XQO9K7Lw4B1e4n6V7k7_8_9_0_1_2_3_4_5_6_7_8_9_0";
            
            // Only attempt to get token if VAPID key doesn't look like our placeholder
            if (vapidKey && !vapidKey.includes("_")) {
              const token = await getToken(messaging, { 
                serviceWorkerRegistration: registration,
                vapidKey
              });

              if (token) {
                console.log("FCM Token:", token);
                await updateDoc(doc(db, 'users', currentUser.uid), { fcmToken: token });
              }
            } else {
              console.warn("FCM VAPID key is a placeholder, skipping token generation.");
            }
          }
        } catch (err) {
          console.error("FCM setup error:", err);
        }
      };

      setupNotifications();

      const unsubscribe = onMessage(messaging, (payload) => {
        console.log("Foreground message:", payload);
        // Browser notification if app is in foreground but tab is hidden
        if (document.hidden) {
          new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: payload.notification.image
          });
        }
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  const sendPushNotification = async (targetUid, title, body, data = {}) => {
    if (targetUid === 'global' || !currentUser) return;
    try {
      await addDoc(collection(db, 'notifications'), {
        to: targetUid,
        from: currentUser.uid,
        fromName: currentUser.name,
        title,
        body,
        data,
        createdAt: serverTimestamp(),
        status: 'pending'
      });
    } catch (e) {
      console.error("Error queueing notification:", e);
    }
  };

  // Set default active chat
  useEffect(() => {
    if (currentUser && !activeChat) {
      setActiveChat({ id: 'global', name: 'Nebula Global', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Global', online: true });
    }
  }, [currentUser, activeChat]);

  // Firestore Real-time Listener for Messages
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = {};
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          const chatId = data.chatId;
        }
      });

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const chatId = data.chatId;
        if (!newMessages[chatId]) newMessages[chatId] = [];
        newMessages[chatId].push({ id: doc.id, ...data });
      });
      setMessages(newMessages);
    }, (error) => {
      console.error("Messages snapshot error:", error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Call History Listener
  useEffect(() => {
    if (!currentUser) return;

    // Listen for calls involving the user
    const qFrom = query(collection(db, 'calls'), where('from', '==', currentUser.uid), orderBy('createdAt', 'desc'));
    const qTo = query(collection(db, 'calls'), where('to', '==', currentUser.uid), orderBy('createdAt', 'desc'));

    const updateCalls = (snapshot, type) => {
      setCallHistory(prev => {
        const otherType = type === 'from' ? 'to' : 'from';
        const otherCalls = prev.filter(c => c.type === otherType);
        const currentCalls = snapshot.docs.map(doc => ({ id: doc.id, type, ...doc.data() }));
        return [...otherCalls, ...currentCalls].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      });
    };

    const unsubFrom = onSnapshot(qFrom, (snap) => updateCalls(snap, 'from'), (err) => console.error("CallHistory from error:", err));
    const unsubTo = onSnapshot(qTo, (snap) => updateCalls(snap, 'to'), (err) => console.error("CallHistory to error:", err));

    return () => { unsubFrom(); unsubTo(); };
  }, [currentUser]);

  const [onlineUsers, setOnlineUsers] = useState([]);

  // Mark messages as read
  useEffect(() => {
    if (!currentUser || !activeChat || activeChat.id === 'global') return;

    let chatId = activeChat.id;
    if (!activeChat.isGroup) {
      chatId = [currentUser.uid, activeChat.id].sort().join('_');
    }

    const unreadMessages = (messages[chatId] || []).filter(
      msg => msg.userUid !== currentUser.uid && (!msg.seenBy || !msg.seenBy.includes(currentUser.uid))
    );

    if (unreadMessages.length > 0) {
      unreadMessages.forEach(async (msg) => {
        try {
          const seenBy = msg.seenBy || [];
          if (!seenBy.includes(currentUser.uid)) {
            await updateDoc(doc(db, 'messages', msg.id), { 
              read: true,
              seenBy: [...seenBy, currentUser.uid]
            });
          }
        } catch (e) {
          console.error("Error marking message as read:", e);
        }
      });
    }
  }, [activeChat, messages, currentUser]);

  // Calculate unread counts
  useEffect(() => {
    if (!currentUser || !messages) return;

    const counts = {};
    Object.keys(messages).forEach(chatId => {
      const unread = messages[chatId].filter(
        msg => msg.userUid !== currentUser.uid && (!msg.seenBy || !msg.seenBy.includes(currentUser.uid))
      ).length;

      if (unread > 0) {
        if (chatId === 'global') {
          counts['global'] = unread;
        } else if (chatId.includes('_')) {
          // Private chat: extract the other user's UID
          const [uid1, uid2] = chatId.split('_');
          const otherUid = uid1 === currentUser.uid ? uid2 : uid1;
          counts[otherUid] = unread;
        } else {
          // Group chat
          counts[chatId] = unread;
        }
      }
    });
    setUnreadCounts(counts);
  }, [messages, currentUser]);

  // Presence and User Discovery
  useEffect(() => {
    if (currentUser) {
      // 1. RTDB Presence Logic
      const statusRef = ref(rtdb, `/status/${currentUser.uid}`);
      const connectedRef = ref(rtdb, '.info/connected');

      onValue(connectedRef, (snapshot) => {
        if (snapshot.val() === true) {
          onDisconnect(statusRef).set({
            state: 'offline',
            last_changed: rtdbTimestamp()
          }).then(() => {
            set(statusRef, {
              state: 'online',
              last_changed: rtdbTimestamp()
            });
          });
        }
      });

      // 2. Listen to ALL users' presence
      const allStatusRef = ref(rtdb, '/status');
      onValue(allStatusRef, (snapshot) => {
        setOnlineUsers(snapshot.val() || {});
      });

      // 3. Groups Listener
      const groupsQuery = query(
        collection(db, 'groups'),
        where('members', 'array-contains', currentUser.uid)
      );

      const unsubscribeGroups = onSnapshot(groupsQuery, (snapshot) => {
        const groupsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          isGroup: true
        }));
        setMyGroups(groupsList);
      }, (err) => console.error("Groups snapshot error:", err));

      // 4. Firestore Call Signaling Listener
      const callsQuery = query(
        collection(db, 'calls'),
        where('to', '==', currentUser.uid)
      );

      const unsubscribeCalls = onSnapshot(callsQuery, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          const data = change.doc.data();
          if (change.type === 'added' && data.status === 'pending') {
            // Don't show incoming call if already in a call
            if (currentCallId.current) return;

            setCallState({
              active: true,
              incoming: true,
              caller: data.fromUser,
              isVideo: data.isVideo,
              callId: change.doc.id,
              offer: JSON.parse(data.offer)
            });
            currentCallId.current = change.doc.id;
          } else if (change.type === 'modified') {
            if (data.status === 'ended' || data.status === 'rejected') {
              if (currentCallId.current === change.doc.id) {
                endCall();
              }
            }
          } else if (change.type === 'removed') {
            if (currentCallId.current === change.doc.id) {
              endCall();
            }
          }
        });
      }, (err) => console.error("Incoming calls error:", err));

      // 4. Firestore Discovery (Users List)
      const q = query(collection(db, 'users'));
      const unsubscribeUsers = onSnapshot(q, (snapshot) => {
        const allUsers = snapshot.docs.map(doc => doc.data());
        setUsers(allUsers.filter(u => u.uid !== currentUser.uid));
      }, (err) => console.error("Users list error:", err));

      // 5. Fetch My Contacts
      const contactsRef = collection(db, 'users', currentUser.uid, 'contacts');
      const unsubscribeContacts = onSnapshot(contactsRef, (snapshot) => {
        setMyContacts(snapshot.docs.map(doc => doc.id));
      }, (err) => console.error("Contacts error:", err));

      return () => {
        unsubscribeCalls();
        unsubscribeGroups();
        unsubscribeUsers();
        unsubscribeContacts();
      };
    }
  }, [currentUser]);

  // Call States
  const [callState, setCallState] = useState({
    active: false,
    incoming: false,
    caller: null,
    isVideo: false,
    callId: null,
    offer: null
  });
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const pc = useRef(null);
  const currentCallId = useRef(null);

  const initPeerConnection = (callId, type) => {
    pc.current = new RTCPeerConnection(iceServers);
    
    pc.current.onicecandidate = (event) => {
      if (event.candidate) {
        const candidatesCol = collection(db, 'calls', callId, type);
        addDoc(candidatesCol, event.candidate.toJSON());
      }
    };

    pc.current.ontrack = (event) => {
      console.log('Got remote track:', event.track.kind);
      setRemoteStream(prev => {
        if (prev) {
          prev.addTrack(event.track);
          return prev;
        }
        return event.streams[0] || new MediaStream([event.track]);
      });
    };
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', color: 'white' }}>Loading Nebula...</div>;

  if (!currentUser) {
    return <Login onLogin={() => {}} />;
  }

  const allContacts = [
    { 
      id: 'global', 
      name: 'Nebula Global', 
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Global', 
      lastMessage: messages['global']?.slice(-1)[0]?.image ? '📷 Photo' : (messages['global']?.slice(-1)[0]?.audio ? '🎤 Voice' : (messages['global']?.slice(-1)[0]?.text || 'Welcome!')), 
      time: messages['global']?.slice(-1)[0]?.time || 'Now', 
      lastMessageTimestamp: messages['global']?.slice(-1)[0]?.timestamp?.seconds || 0,
      online: true 
    },
    ...users
      .filter(u => {
        // Show user if they are in my contacts
        if (myContacts.includes(u.uid)) return true;
        
        // OR if I have an existing chat with them
        const pChatId = [currentUser?.uid, u.uid].sort().join('_');
        return messages[pChatId] && messages[pChatId].length > 0;
      })
      .map(u => {
        const pChatId = [currentUser?.uid, u.uid].sort().join('_');
        const lastMsg = messages[pChatId]?.slice(-1)[0];
        const statusInfo = onlineUsers[u.uid];
        
        return {
          id: u.uid,
          uid: u.uid,
          name: u.name,
          email: u.email,
          avatar: u.avatar,
          lastMessage: lastMsg?.image ? '📷 Photo' : (lastMsg?.audio ? '🎤 Voice' : (lastMsg?.text || 'No messages yet')),
          time: lastMsg?.time || 'Now',
          lastMessageTimestamp: lastMsg?.timestamp?.seconds || 0,
          online: statusInfo?.state === 'online',
          lastSeen: statusInfo?.last_changed || u.lastSeen
        };
      }),
    ...myGroups.map(g => {
      const lastMsg = messages[g.id]?.slice(-1)[0];
      return {
        ...g,
        lastMessage: lastMsg?.image ? '📷 Photo' : (lastMsg?.audio ? '🎤 Voice' : (lastMsg?.text || 'No messages yet')),
        time: lastMsg?.time || 'Now',
        lastMessageTimestamp: lastMsg?.timestamp?.seconds || 0,
      };
    })
  ].sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));

  const filteredContacts = allContacts.filter(c => 
    (c.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (c.lastMessage?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const startCall = async (isVideo = true) => {
    if (!activeChat || activeChat.id === 'global') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: isVideo ? { width: 1280, height: 720 } : false, 
        audio: true 
      });
      setLocalStream(stream);
      
      const targetUser = users.find(u => u.uid === activeChat.id);
      if (!targetUser) return;

      const callDoc = doc(collection(db, 'calls'));
      const callId = callDoc.id;

      initPeerConnection(callId, 'callerCandidates');
      stream.getTracks().forEach(track => pc.current.addTrack(track, stream));

      await pc.current.setLocalDescription(await pc.current.createOffer());

      await setDoc(callDoc, {
        offer: JSON.stringify(pc.current.localDescription),
        from: currentUser.uid,
        fromUser: {
          uid: currentUser.uid,
          name: currentUser.name,
          avatar: currentUser.avatar
        },
        to: targetUser.uid,
        status: 'pending',
        isVideo,
        createdAt: serverTimestamp()
      });

      currentCallId.current = callId;
      setCallState({ 
        active: true, 
        incoming: false, 
        caller: targetUser, 
        isVideo, 
        callId
      });

      // Send Push Notification if recipient is not online or to ensure they see it
      sendPushNotification(
        targetUser.uid,
        `Incoming ${isVideo ? 'Video' : 'Voice'} Call`,
        `${currentUser.name} is calling you...`,
        { type: 'call', callId, isVideo: String(isVideo) }
      );

      // Listen for answer
      onSnapshot(callDoc, (snapshot) => {
        const data = snapshot.data();
        if (data?.answer && !pc.current.currentRemoteDescription) {
          const answer = new RTCSessionDescription(JSON.parse(data.answer));
          pc.current.setRemoteDescription(answer);
        }
        if (data?.status === 'ended' || data?.status === 'rejected') {
          endCall();
        }
      });

      // Listen for candidates from the callee
      onSnapshot(collection(db, 'calls', callId, 'calleeCandidates'), (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            pc.current.addIceCandidate(candidate);
          }
        });
      }, (err) => console.error("Callee candidates error:", err));

    } catch (err) {
      console.error('Call failed:', err);
      alert('Could not access camera/microphone');
    }
  };

  const acceptCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: callState.isVideo ? { width: 1280, height: 720 } : false, 
        audio: true 
      });
      setLocalStream(stream);
      
      currentCallId.current = callState.callId;
      initPeerConnection(callState.callId, 'calleeCandidates');
      stream.getTracks().forEach(track => pc.current.addTrack(track, stream));
      
      await pc.current.setRemoteDescription(new RTCSessionDescription(callState.offer));
      const answer = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answer);

      const callDoc = doc(db, 'calls', callState.callId);
      await updateDoc(callDoc, {
        answer: JSON.stringify(answer),
        status: 'accepted'
      });

      // Listen for candidates from the caller
      onSnapshot(collection(db, 'calls', callState.callId, 'callerCandidates'), (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            pc.current.addIceCandidate(candidate);
          }
        });
      }, (err) => console.error("Caller candidates error:", err));

      // Listen for call end
      onSnapshot(callDoc, (snapshot) => {
        const data = snapshot.data();
        if (data?.status === 'ended') {
          endCall();
        }
      }, (err) => console.error("Call status listener error:", err));

      setCallState(prev => ({ ...prev, incoming: false }));
    } catch (err) {
      console.error('Accept call failed:', err);
      rejectCall();
    }
  };

  const rejectCall = async () => {
    const callId = currentCallId.current;
    if (callId) {
      await updateDoc(doc(db, 'calls', callId), { status: 'rejected' });
    }
    endCall();
  };

  const endCall = async () => {
    if (pc.current) {
      try {
        pc.current.getSenders().forEach(sender => pc.current.removeTrack(sender));
      } catch (e) {}
      pc.current.close();
      pc.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    const callId = currentCallId.current;
    if (callId) {
      // Clear the ref first to prevent multiple endCall triggers
      currentCallId.current = null;
      try {
        await updateDoc(doc(db, 'calls', callId), { status: 'ended' });
      } catch (e) {
        console.error("Error ending call in Firestore:", e);
      }
    }
    
    setLocalStream(null);
    setRemoteStream(null);
    setCallState({ active: false, incoming: false, caller: null, isVideo: false, callId: null, offer: null });
  };

  const selectChat = (chat) => {
    setActiveChat(chat);
    setUnreadCounts(prev => ({ ...prev, [chat.id]: 0 }));
    if (isMobile) setShowChat(true);
  };

  const handleLogout = () => {
    setActiveChat(null);
    signOut(auth);
  };

  const handleUpdateProfile = async (data) => {
    if (!currentUser) return;
    try {
      const updateData = { ...data };
      if (data.name) updateData.searchName = data.name.toLowerCase();
      await updateDoc(doc(db, 'users', currentUser.uid), updateData);
      setCurrentUser(prev => ({ ...prev, ...updateData }));
    } catch (e) {
      console.error("Error updating profile:", e);
    }
  };

  const handleCreateGroup = async (groupData) => {
    if (!currentUser) return;
    try {
      const groupRef = await addDoc(collection(db, 'groups'), {
        ...groupData,
        members: [...groupData.members, currentUser.uid],
        admins: [currentUser.uid],
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        lastMessage: null,
        lastMessageTime: serverTimestamp()
      });
      
      setActiveChat({
        id: groupRef.id,
        ...groupData,
        isGroup: true
      });
      setIsCreateGroupOpen(false);
      setShowChat(true);
    } catch (e) {
      console.error("Error creating group:", e);
      alert("Failed to create group");
    }
  };

  const handleSendMessage = async (content) => {
    if (!currentUser || !activeChat) return;

    let chatId = activeChat.id;
    if (chatId !== 'global' && !activeChat.isGroup) {
      chatId = [currentUser.uid, activeChat.id].sort().join('_');
    }

    try {
      await addDoc(collection(db, 'messages'), {
        chatId,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        userUid: currentUser.uid,
        ...content,
        timestamp: serverTimestamp(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        deletedFor: [],
        deletedForEveryone: false,
        read: activeChat.id === 'global', // Global messages are considered read for the sender instantly
        seenBy: [currentUser.uid]
      });

      // Notify recipient for private messages
      if (activeChat.id !== 'global') {
        sendPushNotification(
          activeChat.id,
          `New message from ${currentUser.name}`,
          content.text || (content.image ? '📷 Sent a photo' : (content.audio ? '🎤 Sent a voice message' : '')),
          { type: 'chat', chatId }
        );
      }
    } catch (e) {
      console.error("Error adding message: ", e);
    }
  };

  const handleDeleteMessage = async (messageId, type) => {
    try {
      const msgRef = doc(db, 'messages', messageId);
      if (type === 'me') {
        // Soft delete for current user
        await updateDoc(msgRef, {
          deletedFor: [...(messages[currentChatId].find(m => m.id === messageId)?.deletedFor || []), currentUser.uid]
        });
      } else if (type === 'everyone') {
        // Delete for everyone (soft delete for UI, or hard delete)
        // Hard delete is simpler, but let's do soft delete to show "Message was deleted"
        await updateDoc(msgRef, {
          deletedForEveryone: true
        });
      }
    } catch (e) {
      console.error("Error deleting message: ", e);
    }
  };

  const handleClearChat = async () => {
    if (!activeChat) return;
    const chatId = (activeChat.id === 'global' || activeChat.isGroup) ? activeChat.id : [currentUser.uid, activeChat.id].sort().join('_');
    const chatMsgs = messages[chatId] || [];
    
    try {
      const promises = chatMsgs.map(msg => {
        const msgRef = doc(db, 'messages', msg.id);
        const newDeletedFor = Array.from(new Set([...(msg.deletedFor || []), currentUser.uid]));
        return updateDoc(msgRef, { deletedFor: newDeletedFor });
      });
      await Promise.all(promises);
    } catch (e) {
      console.error("Error clearing chat: ", e);
    }
  };

  const currentChatId = (activeChat?.id === 'global' || activeChat?.isGroup) ? activeChat?.id : (activeChat && currentUser ? [currentUser.uid, activeChat.id].sort().join('_') : null);
  const currentChatMessages = Array.isArray(messages[currentChatId]) 
    ? messages[currentChatId].map(msg => ({
        ...msg,
        sender: msg?.userUid === currentUser?.uid ? 'me' : 'them',
      }))
    : [];

  return (
    <div className="app-container">
      <Sidebar 
        activeChat={activeChat} 
        setActiveChat={selectChat} 
        contacts={filteredContacts} 
        currentUser={currentUser}
        unreadCounts={unreadCounts}
        callHistory={callHistory}
        sidebarTab={sidebarTab}
        setSidebarTab={setSidebarTab}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onAddUser={() => setIsAddUserOpen(true)}
        onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
        onLogout={handleLogout}
        className={isMobile && showChat ? 'mobile-hidden' : ''}
      />
      
      <main style={{ flex: 1, position: 'relative' }} className={isMobile && !showChat ? 'mobile-hidden' : ''}>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '400px', height: '400px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '50%', filter: 'blur(100px)', zIndex: 0 }} />
        
      <ChatWindow 
        activeChat={activeChat ? (allContacts.find(c => c.id === activeChat.id) || activeChat) : null} 
        messages={currentChatMessages} 
        onSendMessage={handleSendMessage}
        onDeleteMessage={handleDeleteMessage}
        onClearChat={handleClearChat}
        onVideoCall={() => startCall(true)}
        onVoiceCall={() => startCall(false)}
        currentUser={currentUser}
        onBack={() => setShowChat(false)}
        isMobile={isMobile}
        onAddMemberClick={() => setIsAddMemberOpen(true)}
        onOpenGroupInfo={() => setIsGroupInfoOpen(true)}
        allUsers={users}
        isAdmin={activeChat?.isGroup && (activeChat.admins?.includes(currentUser?.uid) || activeChat.createdBy === currentUser?.uid)}
      />

        <AddMemberModal 
          isOpen={isAddMemberOpen}
          onClose={() => setIsAddMemberOpen(false)}
          group={activeChat}
          currentUser={currentUser}
          contacts={users}
        />

        <GroupInfoModal 
          isOpen={isGroupInfoOpen}
          onClose={() => setIsGroupInfoOpen(false)}
          group={activeChat}
          currentUser={currentUser}
          allUsers={users}
          onAddMemberClick={() => {
            setIsGroupInfoOpen(false);
            setIsAddMemberOpen(true);
          }}
        />

        <AnimatePresence>
          {callState.active && (
            <CallModal 
              isIncoming={callState.incoming}
              caller={callState.caller}
              isVideo={callState.isVideo}
              localStream={localStream}
              remoteStream={remoteStream}
              onAccept={acceptCall}
              onReject={rejectCall}
              onEnd={endCall}
            />
          )}
        </AnimatePresence>

        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          currentUser={currentUser}
          onUpdateProfile={handleUpdateProfile}
        />

        <AddUserModal 
          isOpen={isAddUserOpen}
          onClose={() => setIsAddUserOpen(false)}
          currentUser={currentUser}
          myContacts={myContacts}
        />

        <CreateGroupModal
          isOpen={isCreateGroupOpen}
          onClose={() => setIsCreateGroupOpen(false)}
          currentUser={currentUser}
          contacts={users}
          onCreateGroup={handleCreateGroup}
        />
      </main>
    </div>
  );
}

export default App;

