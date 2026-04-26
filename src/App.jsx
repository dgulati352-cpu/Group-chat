import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import Login from './components/Login';
import CallModal from './components/CallModal';
import SettingsModal from './components/SettingsModal';
import { io } from 'socket.io-client';
import { AnimatePresence } from 'framer-motion';
import { db, auth } from './firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const socket = io('http://localhost:3001', { autoConnect: false });

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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userData = {
          uid: user.uid,
          name: user.displayName,
          avatar: user.photoURL,
          email: user.email
        };
        setCurrentUser(userData);
        socket.connect();
        socket.emit('join', userData);
      } else {
        setCurrentUser(null);
        socket.disconnect();
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

  // Socket for presence and signaling
  useEffect(() => {
    if (currentUser) {
      socket.on('users', (onlineUsers) => {
        setUsers(onlineUsers.filter(u => u.uid !== currentUser.uid));
      });

      socket.on('call-made', async (data) => {
        setCallState({
          active: true,
          incoming: true,
          caller: data.user,
          isVideo: data.isVideo,
          socketId: data.socket,
          offer: data.offer
        });
      });

      socket.on('answer-made', async (data) => {
        if (pc.current) {
          await pc.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
      });

      socket.on('ice-candidate', async (data) => {
        if (pc.current) {
          await pc.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      });

      socket.on('call-rejected', () => {
        endCall();
        alert('Call rejected by user');
      });

      socket.on('call-ended', () => {
        endCall();
      });

      return () => {
        socket.off('users');
        socket.off('call-made');
        socket.off('answer-made');
        socket.off('ice-candidate');
        socket.off('call-rejected');
        socket.off('call-ended');
      };
    }
  }, [currentUser]);

  // Call States
  const [callState, setCallState] = useState({
    active: false,
    incoming: false,
    caller: null,
    isVideo: false
  });
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const pc = useRef(null);

  const initPeerConnection = (targetSocketId) => {
    pc.current = new RTCPeerConnection(iceServers);
    pc.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          to: targetSocketId
        });
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
      return {
        id: u.uid, // Use UID as the stable ID for activeChat
        socketId: u.id, // Store current socket ID
        uid: u.uid,
        name: u.name,
        avatar: u.avatar,
        lastMessage: lastMsg?.image ? '📷 Photo' : (lastMsg?.audio ? '🎤 Voice' : (lastMsg?.text || 'No messages yet')),
        time: lastMsg?.time || 'Now',
        online: true
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
      if (!targetUser) {
        alert('User is no longer online');
        return;
      }

      initPeerConnection(targetUser.id);
      stream.getTracks().forEach(track => pc.current.addTrack(track, stream));
      
      const offer = await pc.current.createOffer();
      await pc.current.setLocalDescription(offer);
      
      setCallState({ 
        active: true, 
        incoming: false, 
        caller: targetUser, 
        isVideo, 
        socketId: targetUser.id 
      });

      socket.emit('call-user', { 
        offer, 
        to: targetUser.id, 
        user: currentUser,
        isVideo 
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
      initPeerConnection(callState.socketId);
      stream.getTracks().forEach(track => pc.current.addTrack(track, stream));
      await pc.current.setRemoteDescription(new RTCSessionDescription(callState.offer));
      const answer = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answer);
      socket.emit('make-answer', { answer, to: callState.socketId });
      setCallState(prev => ({ ...prev, incoming: false }));
    } catch (err) {
      console.error('Accept call failed:', err);
      rejectCall();
    }
  };

  const rejectCall = () => {
    socket.emit('reject-call', { from: callState.socketId });
    endCall();
  };

  const endCall = () => {
    if (pc.current) {
      pc.current.getSenders().forEach(sender => pc.current.removeTrack(sender));
      pc.current.close();
      pc.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (callState.socketId) {
      socket.emit('end-call', { to: callState.socketId });
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallState({ active: false, incoming: false, caller: null, isVideo: false, socketId: null });
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
          activeChat={activeChat} 
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

