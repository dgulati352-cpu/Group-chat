import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import Login from './components/Login';
import CallModal from './components/CallModal';
import SettingsModal from './components/SettingsModal';
import { AnimatePresence } from 'framer-motion';
import { auth, db, googleProvider, rtdb } from './firebase';
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
  const [loading, setLoading] = useState(true);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userData = {
          uid: user.uid,
          name: user.displayName,
          avatar: user.photoURL,
          email: user.email,
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
          
          // Increment unread count if it's a new message and not for the active chat
          if (data.userUid !== currentUser.uid && activeChat?.id !== chatId && activeChat?.id !== data.userUid) {
             // For private chats, the activeChat.id might be the socket ID or UID. 
             // This logic needs to be robust. For now, let's just update the messages state.
          }
        }
      });

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const chatId = data.chatId;
        if (!newMessages[chatId]) newMessages[chatId] = [];
        newMessages[chatId].push({ id: doc.id, ...data });
      });
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const [onlineUsers, setOnlineUsers] = useState([]);

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
        const statuses = snapshot.val() || {};
        const onlineList = Object.entries(statuses)
          .filter(([uid, data]) => data.state === 'online')
          .map(([uid, data]) => ({ uid, ...data }));
        setOnlineUsers(onlineList);
      });

      // 3. Firestore Call Signaling Listener
      const callsQuery = query(
        collection(db, 'calls'),
        where('to', '==', currentUser.uid),
        where('status', '==', 'pending')
      );

      const unsubscribeCalls = onSnapshot(callsQuery, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          const data = change.doc.data();
          if (change.type === 'added') {
            setCallState({
              active: true,
              incoming: true,
              caller: data.fromUser,
              isVideo: data.isVideo,
              callId: change.doc.id,
              offer: JSON.parse(data.offer)
            });
          } else if (change.type === 'modified' || change.type === 'removed') {
            if (data.status === 'ended' || data.status === 'rejected' || change.type === 'removed') {
              setCallState({ active: false, incoming: false, caller: null, isVideo: false, callId: null, offer: null });
            }
          }
        });
      });

      // 4. Firestore Discovery (Users List)
      const q = query(collection(db, 'users'));
      const unsubscribeUsers = onSnapshot(q, (snapshot) => {
        const allUsers = snapshot.docs.map(doc => doc.data());
        setUsers(allUsers.filter(u => u.uid !== currentUser.uid));
      });

      return () => {
        unsubscribeCalls();
        unsubscribeUsers();
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

  const initPeerConnection = (callId, type) => {
    pc.current = new RTCPeerConnection(iceServers);
    
    pc.current.onicecandidate = (event) => {
      if (event.candidate) {
        const candidatesCol = collection(db, 'calls', callId, type);
        addDoc(candidatesCol, event.candidate.toJSON());
      }
    };

    pc.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };
  };

  const contacts = [
    { 
      id: 'global', 
      name: 'Nebula Global', 
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Global', 
      lastMessage: messages['global']?.slice(-1)[0]?.image ? '📷 Photo' : (messages['global']?.slice(-1)[0]?.audio ? '🎤 Voice' : (messages['global']?.slice(-1)[0]?.text || 'Welcome!')), 
      time: messages['global']?.slice(-1)[0]?.time || 'Now', 
      online: true 
    },
    ...users.map(u => {
      const pChatId = [currentUser.uid, u.uid].sort().join('_');
      const lastMsg = messages[pChatId]?.slice(-1)[0];
      const onlineInfo = onlineUsers.find(ou => ou.uid === u.uid);
      
      return {
        id: u.uid,
        uid: u.uid,
        name: u.name,
        avatar: u.avatar,
        lastMessage: lastMsg?.image ? '📷 Photo' : (lastMsg?.audio ? '🎤 Voice' : (lastMsg?.text || 'No messages yet')),
        time: lastMsg?.time || 'Now',
        online: !!onlineInfo
      };
    })
  ];

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
      
      const offer = await pc.current.createOffer();
      await pc.current.setLocalDescription(offer);
      
      const callData = {
        from: currentUser.uid,
        fromUser: currentUser,
        to: targetUser.uid,
        status: 'pending',
        offer: JSON.stringify(offer),
        isVideo,
        createdAt: serverTimestamp()
      };

      await setDoc(callDoc, callData);

      setCallState({ 
        active: true, 
        incoming: false, 
        caller: targetUser, 
        isVideo, 
        callId
      });

      // Listen for answer
      onSnapshot(callDoc, async (snapshot) => {
        const data = snapshot.data();
        if (data?.answer && !pc.current.currentRemoteDescription) {
          const answer = new RTCSessionDescription(JSON.parse(data.answer));
          await pc.current.setRemoteDescription(answer);
        }
        if (data?.status === 'rejected' || data?.status === 'ended') {
          endCall();
        }
      });

      // Listen for candidates from the other side
      onSnapshot(collection(db, 'calls', callId, 'calleeCandidates'), (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            pc.current.addIceCandidate(candidate);
          }
        });
      });

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
      });

      // Listen for call end
      onSnapshot(callDoc, (snapshot) => {
        const data = snapshot.data();
        if (data?.status === 'ended') {
          endCall();
        }
      });

      setCallState(prev => ({ ...prev, incoming: false }));
    } catch (err) {
      console.error('Accept call failed:', err);
      rejectCall();
    }
  };

  const rejectCall = async () => {
    if (callState.callId) {
      await updateDoc(doc(db, 'calls', callState.callId), { status: 'rejected' });
    }
    endCall();
  };

  const endCall = async () => {
    if (pc.current) {
      pc.current.getSenders().forEach(sender => pc.current.removeTrack(sender));
      pc.current.close();
      pc.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (callState.callId) {
      await updateDoc(doc(db, 'calls', callState.callId), { status: 'ended' });
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallState({ active: false, incoming: false, caller: null, isVideo: false, callId: null, offer: null });
  };

  const selectChat = (chat) => {
    setActiveChat(chat);
    setUnreadCounts(prev => ({ ...prev, [chat.id]: 0 }));
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const handleSendMessage = async (content) => {
    if (!currentUser || !activeChat) return;

    let chatId = activeChat.id;
    if (chatId !== 'global') {
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
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } catch (e) {
      console.error("Error adding message: ", e);
    }
  };

  const currentChatId = activeChat?.id === 'global' ? 'global' : (activeChat ? [currentUser.uid, activeChat.id].sort().join('_') : null);
  const currentChatMessages = Array.isArray(messages[currentChatId]) 
    ? messages[currentChatId].map(msg => ({
        ...msg,
        sender: msg?.userUid === currentUser?.uid ? 'me' : 'them',
      }))
    : [];

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', color: 'white' }}>Loading Nebula...</div>;

  if (!currentUser) {
    return <Login onLogin={() => {}} />;
  }

  return (
    <div className="app-container" style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <Sidebar 
        activeChat={activeChat} 
        setActiveChat={selectChat} 
        contacts={contacts} 
        currentUser={currentUser}
        unreadCounts={unreadCounts}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
      />
      
      <main style={{ flex: 1, position: 'relative' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '400px', height: '400px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '50%', filter: 'blur(100px)', zIndex: 0 }} />
        
        <ChatWindow 
        activeChat={activeChat ? (contacts.find(c => c.id === activeChat.id) || activeChat) : null} 
        messages={currentChatMessages} 
          onSendMessage={handleSendMessage}
          onVideoCall={() => startCall(true)}
          onVoiceCall={() => startCall(false)}
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
          onUpdateProfile={() => {}} // Disabled for Google Auth for now
        />
      </main>
    </div>
  );
}

export default App;

