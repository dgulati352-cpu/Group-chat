import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { auth, db } from './firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, collection, onSnapshot, query, orderBy, where, addDoc, deleteDoc } from 'firebase/firestore'
import Login from './components/Login'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import SettingsModal from './components/SettingsModal'
import AddUserModal from './components/AddUserModal'
import CallModal from './components/CallModal'
import { AnimatePresence, motion } from 'framer-motion'

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('chats');
  const [searchTerm, setSearchTerm] = useState('');

  const [chats, setChats] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [callHistory, setCallHistory] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Call State
  const [call, setCall] = useState(null); // { id, caller, receiver, status: 'calling'|'incoming'|'active', isVideo }
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const pc = useRef(null);
  const candidateQueue = useRef([]);
  const callUnsubs = useRef([]);

  const servers = {
    iceServers: [
      {
        urls: [
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
        ],
      },
    ],
    iceCandidatePoolSize: 10,
  };

  const getChatId = (uid1, uid2) => {
    return [uid1, uid2].sort().join('_');
  };

  useEffect(() => {
    let unsubContacts = null;
    let unsubChats = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        let userData = {
          uid: user.uid,
          name: user.displayName || 'Voyager',
          avatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
          email: user.email,
          online: true,
          lastSeen: serverTimestamp(),
          searchName: (user.displayName || user.email?.split('@')[0] || 'Voyager').toLowerCase(),
          searchEmail: (user.email || '').toLowerCase()
        };

        if (!userSnap.exists()) {
          await setDoc(userRef, userData);
        } else {
          // Merge existing data but update searchable fields and status
          const existing = userSnap.data();
          userData = { 
            ...existing, 
            uid: user.uid, 
            online: true,
            searchName: (existing.name || user.displayName || 'Voyager').toLowerCase(),
            searchEmail: (existing.email || user.email || '').toLowerCase()
          };
          await updateDoc(userRef, { 
            online: true, 
            lastSeen: serverTimestamp(),
            searchName: userData.searchName,
            searchEmail: userData.searchEmail
          });
        }
        
        setCurrentUser(userData);

        // Listen for chats where the user is a participant
        const chatsRef = collection(db, 'chats');
        const qChats = query(chatsRef, where('participants', 'array-contains', user.uid));
        
        if (unsubChats) unsubChats();
        unsubChats = onSnapshot(qChats, (snap) => {
          console.log(`Received ${snap.docs.length} chats for user ${user.uid}`);
          const chatsList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // Sort by time in frontend to avoid index requirement
          chatsList.sort((a, b) => (b.lastMessageTime?.seconds || 0) - (a.lastMessageTime?.seconds || 0));
          setChats(chatsList);
        }, (err) => {
          console.error("Error listening to chats:", err);
        });

        // Listen for contacts
        const contactsRef = collection(db, 'users', user.uid, 'contacts');
        if (unsubContacts) unsubContacts();
        unsubContacts = onSnapshot(contactsRef, (snap) => {
          console.log(`Received ${snap.docs.length} contacts for user ${user.uid}`);
          const contactsList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setContacts(contactsList);
        });

        // Listen for call history
        const historyRef = collection(db, 'callHistory');
        const qHistory = query(historyRef, where('participants', 'array-contains', user.uid));
        onSnapshot(qHistory, (snap) => {
          const historyList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          historyList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          setCallHistory(historyList);
        });
      } else {
        setCurrentUser(null);
        setContacts([]);
        setChats([]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubContacts) unsubContacts();
      if (unsubChats) unsubChats();
    };
  }, []);

  // Listen for incoming calls
  useEffect(() => {
    if (!currentUser) return;

    const callsRef = collection(db, 'calls');
    const q = query(callsRef, where('receiver.uid', '==', currentUser.uid), where('status', '==', 'calling'));

    const unsubIncoming = onSnapshot(q, (snap) => {
      if (!snap.empty && !call) {
        const callData = { id: snap.docs[0].id, ...snap.docs[0].data() };
        setCall({ ...callData, status: 'incoming' });
      }
    });

    return () => unsubIncoming();
  }, [currentUser, call]);

  const startCall = async (isVideo) => {
    if (!currentUser || !activeChat || activeChat.isGroup) {
      console.warn("Calls are only supported in 1-on-1 chats");
      return;
    }

    const callDoc = doc(collection(db, 'calls'));
    
    // Set initial connecting state immediately
    setCall({ 
      id: callDoc.id, 
      status: 'connecting',
      isVideo,
      receiver: {
        uid: activeChat.uid || activeChat.id,
        name: activeChat.name,
        avatar: activeChat.avatar
      },
      caller: {
        uid: currentUser.uid,
        name: currentUser.name,
        avatar: currentUser.avatar
      }
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: isVideo ? {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 24, max: 30 }
        } : false
      });

      const peerConnection = new RTCPeerConnection(servers);
      
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      peerConnection.ontrack = (event) => {
        console.log("Received remote stream");
        setRemoteStream(event.streams[0]);
      };

      setLocalStream(stream);
      pc.current = peerConnection;

      const offerCandidates = collection(callDoc, 'offerCandidates');
    const answerCandidates = collection(callDoc, 'answerCandidates');

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Generated local ICE candidate (offer)");
        addDoc(offerCandidates, event.candidate.toJSON());
      }
    };

    let offerDescription = await peerConnection.createOffer();
    if (isVideo) {
      offerDescription = new RTCSessionDescription({
        type: offerDescription.type,
        sdp: setVideoBitrate(offerDescription.sdp, 1000)
      });
    }
    await peerConnection.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    const callData = {
      caller: {
        uid: currentUser.uid,
        name: currentUser.name,
        avatar: currentUser.avatar
      },
      receiver: {
        uid: activeChat.uid || activeChat.id,
        name: activeChat.name,
        avatar: activeChat.avatar
      },
      status: 'calling',
      isVideo,
      offer,
      timestamp: serverTimestamp()
    };

    await setDoc(callDoc, callData);
    setCall(prev => ({ ...prev, ...callData, status: 'calling' }));

    // Listen for answer
    const unsubAnswer = onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (!pc.current?.currentRemoteDescription && data?.answer) {
        console.log("Received answer from receiver");
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.current.setRemoteDescription(answerDescription).then(() => {
          processQueuedCandidates();
        });
      }
      if (data?.status === 'ended') {
        console.log("Call ended by receiver");
        endCall();
      }
    });

    // Listen for ICE candidates from receiver
    const unsubIce = onSnapshot(answerCandidates, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const candidateData = change.doc.data();
          if (pc.current && pc.current.remoteDescription) {
            console.log("Adding remote ICE candidate (answer)");
            try {
              await pc.current.addIceCandidate(new RTCIceCandidate(candidateData));
            } catch (e) {
              console.error("Error adding remote ICE candidate:", e);
            }
          } else {
            console.log("Queueing remote ICE candidate (answer)");
            candidateQueue.current.push(candidateData);
          }
        }
      });
    });

    callUnsubs.current.push(unsubAnswer, unsubIce);
    } catch (err) {
      console.error("Failed to start call:", err);
      alert("Could not access camera or microphone. Please check permissions.");
      setCall(null);
      setLocalStream(null);
    }
  };

  const acceptCall = async () => {
    if (!call) return;
    setCall(prev => ({ ...prev, status: 'connecting' }));
    console.log("Accepting incoming call...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: call.isVideo ? {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 24, max: 30 }
        } : false
      });

      const peerConnection = new RTCPeerConnection(servers);

      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      peerConnection.ontrack = (event) => {
        console.log("Received remote stream (acceptor)");
        setRemoteStream(event.streams[0]);
      };

      setLocalStream(stream);
      pc.current = peerConnection;

    const callDoc = doc(db, 'calls', call.id);
    const offerCandidates = collection(callDoc, 'offerCandidates');
    const answerCandidates = collection(callDoc, 'answerCandidates');

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Generated local ICE candidate (answer)");
        addDoc(answerCandidates, event.candidate.toJSON());
      }
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(call.offer));
    processQueuedCandidates();

    let answerDescription = await peerConnection.createAnswer();
    if (call.isVideo) {
      answerDescription = new RTCSessionDescription({
        type: answerDescription.type,
        sdp: setVideoBitrate(answerDescription.sdp, 1000)
      });
    }
    await peerConnection.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };

    await updateDoc(callDoc, { answer, status: 'active' });
    setCall(prev => ({ ...prev, status: 'active' }));

    // Listen for ICE candidates from caller
    const unsubIce = onSnapshot(offerCandidates, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (pc.current && pc.current.remoteDescription) {
            console.log("Adding remote ICE candidate (offer)");
            try {
              await pc.current.addIceCandidate(new RTCIceCandidate(data));
            } catch (e) {
              console.error("Error adding remote ICE candidate:", e);
            }
          } else {
            console.log("Queueing remote ICE candidate (offer)");
            candidateQueue.current.push(data);
          }
        }
      });
    });

    // Listen for call end
    const unsubEnd = onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (data?.status === 'ended') {
        console.log("Call ended by caller");
        endCall();
      }
    });

    callUnsubs.current.push(unsubIce, unsubEnd);
    } catch (err) {
      console.error("Failed to accept call:", err);
      alert("Could not access camera or microphone. Please check permissions.");
      rejectCall();
    }
  };

  const rejectCall = async () => {
    if (!call) return;
    console.log("Rejecting call...");
    await updateDoc(doc(db, 'calls', call.id), { status: 'ended' });
    setCall(null);
  };

  const endCall = async () => {
    console.log("Ending call and cleaning up...");
    
    // Clear Firestore listeners
    callUnsubs.current.forEach(unsub => unsub());
    callUnsubs.current = [];

    if (pc.current) {
      pc.current.close();
      pc.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    
    candidateQueue.current = [];
    
    if (call) {
      const callId = call.id;
      const wasAccepted = !!remoteStream;
      setCall(null); // Clear local state first to avoid re-triggering
      try {
        await updateDoc(doc(db, 'calls', callId), { status: 'ended' });
        
        // Save to history
        await addDoc(collection(db, 'callHistory'), {
          from: call.caller.uid,
          to: call.receiver.uid,
          participants: [call.caller.uid, call.receiver.uid],
          status: wasAccepted ? 'completed' : 'missed',
          isVideo: call.isVideo,
          createdAt: serverTimestamp()
        });
      } catch (e) {
        console.warn("Could not update call doc to ended:", e);
      }
    }
  };

  const processQueuedCandidates = async () => {
    if (pc.current && pc.current.remoteDescription && candidateQueue.current.length > 0) {
      console.log(`Processing ${candidateQueue.current.length} queued ICE candidates`);
      for (const candidate of candidateQueue.current) {
        try {
          await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding queued ICE candidate:", e);
        }
      }
      candidateQueue.current = [];
    }
  };

  useEffect(() => {
    if (pc.current?.remoteDescription) {
      processQueuedCandidates();
    }
  }, [pc.current?.remoteDescription, call?.status]);

  useEffect(() => {
    if (!currentUser || !activeChat) {
      setMessages([]);
      return;
    }

    const otherId = activeChat.uid || activeChat.id;
    const chatId = activeChat.isGroup ? activeChat.id : getChatId(currentUser.uid, otherId);
    console.log(`Setting up message listener for chatId: ${chatId} (Other user: ${otherId})`);

    const msgsRef = collection(db, 'chats', chatId, 'messages');
    const q = query(msgsRef, orderBy('timestamp', 'asc'));

    const unsubMessages = onSnapshot(q, (snap) => {
      console.log(`Received ${snap.docs.length} messages for ${chatId}`);
      const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    }, (error) => {
      console.error("Error in message listener:", error);
    });

    return () => unsubMessages();
  }, [activeChat, currentUser]);

  const handleSendMessage = async (msgData) => {
    if (!currentUser || !activeChat) {
      console.warn("Cannot send message: currentUser or activeChat missing");
      return;
    }

    try {
      const otherId = activeChat.uid || activeChat.id;
      const chatId = activeChat.isGroup ? activeChat.id : getChatId(currentUser.uid, otherId);
      console.log(`Sending message to ${chatId}...`);

      const msgsRef = collection(db, 'chats', chatId, 'messages');

      const newMessage = {
        ...msgData,
        userUid: currentUser.uid,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        senderId: currentUser.uid, // Keep for backward compatibility if needed
        timestamp: serverTimestamp(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
        seenBy: [currentUser.uid]
      };

      await addDoc(msgsRef, newMessage);
      console.log("Message sent successfully!");

      const chatRef = doc(db, 'chats', chatId);
      await setDoc(chatRef, {
        lastMessage: msgData.text || (msgData.image ? 'Image' : (msgData.audio ? 'Voice' : 'File')),
        lastMessageTime: serverTimestamp(),
        participants: activeChat.isGroup ? activeChat.participants : [currentUser.uid, otherId]
      }, { merge: true });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const setVideoBitrate = (sdp, maxBitrate) => {
    let lines = sdp.split('\r\n');
    let mVideoLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].indexOf('m=video') === 0) {
        mVideoLineIndex = i;
        break;
      }
    }
    if (mVideoLineIndex === -1) return sdp;

    // Check if b=AS line already exists
    let bLineIndex = -1;
    for (let i = mVideoLineIndex + 1; i < lines.length; i++) {
      if (lines[i].indexOf('m=') === 0) break; // Next media section
      if (lines[i].indexOf('b=AS:') === 0) {
        bLineIndex = i;
        break;
      }
    }

    if (bLineIndex !== -1) {
      lines[bLineIndex] = `b=AS:${maxBitrate}`;
    } else {
      lines.splice(mVideoLineIndex + 1, 0, `b=AS:${maxBitrate}`);
    }
    return lines.join('\r\n');
  };

  const handleDeleteMessage = async (messageId, mode = 'me') => {
    if (!activeChat || !currentUser) return;
    const otherId = activeChat.uid || activeChat.id;
    const chatId = activeChat.isGroup ? activeChat.id : getChatId(currentUser.uid, otherId);
    const msgRef = doc(db, 'chats', chatId, 'messages', messageId);

    try {
      if (mode === 'everyone') {
        await updateDoc(msgRef, {
          deletedForEveryone: true,
          text: 'Transmission terminated',
          image: null,
          audio: null
        });
      } else {
        const msgSnap = await getDoc(msgRef);
        if (msgSnap.exists()) {
          const data = msgSnap.data();
          const deletedFor = data.deletedFor || [];
          if (!deletedFor.includes(currentUser.uid)) {
            await updateDoc(msgRef, {
              deletedFor: [...deletedFor, currentUser.uid]
            });
          }
        }
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleClearChat = async () => {
    if (!activeChat || !currentUser) return;
    if (!window.confirm("Are you sure you want to clear all transmissions? This cannot be undone.")) return;

    const otherId = activeChat.uid || activeChat.id;
    const chatId = activeChat.isGroup ? activeChat.id : getChatId(currentUser.uid, otherId);
    const msgsRef = collection(db, 'chats', chatId, 'messages');

    try {
      const snap = await getDocs(msgsRef);
      const deletePromises = snap.docs.map(doc => {
        const data = doc.data();
        const deletedFor = data.deletedFor || [];
        if (!deletedFor.includes(currentUser.uid)) {
          return updateDoc(doc.ref, {
            deletedFor: [...deletedFor, currentUser.uid]
          });
        }
        return Promise.resolve();
      });
      await Promise.all(deletePromises);
      console.log("Chat cleared for user");
    } catch (error) {
      console.error("Error clearing chat:", error);
    }
  };

  const handleLogout = async () => {
    if (currentUser) {
      await updateDoc(doc(db, 'users', currentUser.uid), { online: false, lastSeen: serverTimestamp() });
    }
    await signOut(auth);
  };

  const handleUpdateProfile = async (updates) => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, updates);
    setCurrentUser(prev => ({ ...prev, ...updates }));
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#020617', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, opacity: 0.4 }}>
          <motion.div 
            animate={{ 
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            style={{ position: 'absolute', width: '800px', height: '800px', background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)', filter: 'blur(100px)', top: '-200px', left: '-200px' }} 
          />
          <motion.div 
            animate={{ 
              opacity: [0.05, 0.15, 0.05],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            style={{ position: 'absolute', width: '700px', height: '700px', background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)', filter: 'blur(100px)', bottom: '-150px', right: '-150px' }} 
          />
        </div>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          <div className="loader" style={{ width: '60px', height: '60px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '0.1em', opacity: 0.8 }}>INITIALIZING NEBULA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <AnimatePresence mode="wait">
        {!currentUser ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ width: '100%' }}
          >
            <Login onLogin={setCurrentUser} />
          </motion.div>
        ) : (
          <motion.div
            key="main-app"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ display: 'flex', width: '100%', height: '100%' }}
          >
            <Sidebar 
              activeChat={activeChat}
              setActiveChat={setActiveChat}
              contacts={contacts}
              chats={chats}
              currentUser={currentUser}
              sidebarTab={sidebarTab}
              setSidebarTab={setSidebarTab}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onLogout={handleLogout}
              callHistory={callHistory}
              onAddUser={() => setIsAddUserOpen(true)}
              onOpenCreateGroup={() => {}}
            />
            
            <ChatWindow 
              activeChat={activeChat}
              messages={messages}
              currentUser={currentUser}
              onSendMessage={handleSendMessage}
              onDeleteMessage={handleDeleteMessage}
              onClearChat={handleClearChat}
              onBack={() => setActiveChat(null)}
              onVoiceCall={() => startCall(false)}
              onVideoCall={() => startCall(true)}
              isMobile={isMobile}
              onOpenGroupInfo={() => setIsGroupInfoOpen(true)}
              onAddMemberClick={() => setIsAddUserOpen(true)}
              allUsers={contacts}
              isAdmin={activeChat?.adminId === currentUser?.uid}
            />

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
              myContacts={contacts}
              onStartChat={(user) => {
                setActiveChat({
                  id: getChatId(currentUser.uid, user.uid),
                  uid: user.uid,
                  name: user.name,
                  avatar: user.avatar,
                  isGroup: false
                });
                setSidebarTab('chats');
              }}
            />

            {createPortal(
              <AnimatePresence>
                {call && (
                  <CallModal 
                    key={call.id}
                    isIncoming={call.status === 'incoming' || (call.status === 'calling' && call.receiver.uid === currentUser.uid)}
                    caller={call.caller.uid === currentUser.uid ? call.receiver : call.caller}
                    isVideo={call.isVideo}
                    localStream={localStream}
                    remoteStream={remoteStream}
                    onAccept={acceptCall}
                    onReject={rejectCall}
                    onEnd={endCall}
                    call={call}
                  />
                )}
              </AnimatePresence>,
              document.body
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
