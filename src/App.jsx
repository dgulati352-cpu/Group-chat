import { useState, useEffect } from 'react'
import { auth, db } from './firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import Login from './components/Login'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import SettingsModal from './components/SettingsModal'
import AddUserModal from './components/AddUserModal'
import { AnimatePresence, motion } from 'framer-motion'

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('chats');
  const [searchTerm, setSearchTerm] = useState('');

  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [callHistory, setCallHistory] = useState([]);

  const getChatId = (uid1, uid2) => {
    return [uid1, uid2].sort().join('_');
  };

  useEffect(() => {
    let unsubContacts = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // ... previous logic ...
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        let userData = {
          uid: user.uid,
          name: user.displayName || 'Voyager',
          avatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
          email: user.email,
          online: true,
          lastSeen: serverTimestamp(),
          searchName: (user.displayName || 'Voyager').toLowerCase(),
          searchEmail: (user.email || '').toLowerCase()
        };

        if (!userSnap.exists()) {
          await setDoc(userRef, userData);
        } else {
          userData = { ...userSnap.data(), uid: user.uid, online: true };
          await updateDoc(userRef, { online: true, lastSeen: serverTimestamp() });
        }
        
        setCurrentUser(userData);

        if (unsubContacts) unsubContacts();
        const contactsRef = collection(db, 'users', user.uid, 'contacts');
        unsubContacts = onSnapshot(contactsRef, (snap) => {
          console.log(`Received ${snap.docs.length} contacts for user ${user.uid}`);
          const contactsList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setContacts(contactsList);
        });
      } else {
        setCurrentUser(null);
        setContacts([]);
        if (unsubContacts) {
          unsubContacts();
          unsubContacts = null;
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubContacts) unsubContacts();
    };
  }, []);

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
        senderId: currentUser.uid,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        timestamp: serverTimestamp()
      };

      await setDoc(doc(msgsRef), newMessage);
      console.log("Message sent successfully!");

      const chatRef = doc(db, 'chats', chatId);
      await setDoc(chatRef, {
        lastMessage: msgData.text || (msgData.image ? 'Image' : 'File'),
        lastMessageTime: serverTimestamp(),
        participants: activeChat.isGroup ? activeChat.participants : [currentUser.uid, otherId]
      }, { merge: true });
    } catch (error) {
      console.error("Error sending message:", error);
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
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}
        />
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
              onBack={() => setActiveChat(null)}
              onOpenSettings={() => setIsSettingsOpen(true)}
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
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
