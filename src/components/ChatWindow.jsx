import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, MoreVertical, Phone, Video, Info, Mic, Square, ChevronLeft, Search, UserPlus, Download, Trash2, ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ChatWindow = ({ activeChat, messages, onSendMessage, onDeleteMessage, onClearChat, onVideoCall, onVoiceCall, currentUser, onBack, isMobile, onAddMemberClick, onOpenGroupInfo, allUsers = [], isAdmin }) => {
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const [openedMenuId, setOpenedMenuId] = useState(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const [showInfoMessageId, setShowInfoMessageId] = useState(null);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage({ text: inputValue });
      setInputValue('');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        onSendMessage({ image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        audioChunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          onSendMessage({ audio: reader.result });
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  if (!activeChat) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'transparent', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: '300px', height: '300px', background: 'var(--primary)', filter: 'blur(150px)', opacity: 0.1, top: '20%', left: '30%' }} />
        <div style={{ position: 'absolute', width: '250px', height: '250px', background: 'var(--accent)', filter: 'blur(150px)', opacity: 0.1, bottom: '20%', right: '30%' }} />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          style={{ textAlign: 'center', padding: '40px', zIndex: 1 }}
        >
          <div style={{ 
            width: '160px', 
            height: '160px', 
            borderRadius: '48px', 
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(20, 184, 166, 0.1))', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 40px', 
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            position: 'relative'
          }}>
            <motion.div
              animate={{ 
                rotate: [0, 5, -5, 0],
                y: [0, -10, 0]
              }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            >
              <Smile size={72} color="var(--primary)" strokeWidth={1.5} />
            </motion.div>
          </div>
          <h2 className="text-gradient" style={{ fontSize: '36px', fontWeight: '800', marginBottom: '16px', letterSpacing: '-0.03em' }}>Nebula Awaits</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '380px', margin: '0 auto', fontSize: '17px', lineHeight: '1.6', fontWeight: '500' }}>
            Select a voyage from the crew list and begin your cosmic journey through seamless communication.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="chat-window" style={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      position: 'relative',
      background: 'rgba(2, 6, 23, 0.1)',
      overflow: 'hidden'
    }}>
      {/* Chat Header */}
      <div className="glass-panel" style={{ 
        padding: '20px 32px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        zIndex: 50,
        borderRadius: '0 0 24px 24px',
        borderTop: 'none',
        margin: '0 12px'
      }}>
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '18px', cursor: activeChat.isGroup ? 'pointer' : 'default' }}
          onClick={() => activeChat.isGroup && onOpenGroupInfo()}
        >
          {isMobile && (
            <motion.button 
              whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.05)' }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onBack(); }} 
              style={{ width: '40px', height: '40px', color: 'var(--text-muted)', border: 'none', background: 'transparent', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ChevronLeft size={24} />
            </motion.button>
          )}
          <div style={{ position: 'relative' }}>
            <motion.img 
              layoutId={`avatar-${activeChat.id}`}
              src={activeChat.avatar} 
              alt={activeChat.name} 
              style={{ width: '52px', height: '52px', borderRadius: '18px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.05)' }} 
            />
            {!activeChat.isGroup && activeChat.online && (
              <div style={{ 
                position: 'absolute', 
                bottom: '-2px', 
                right: '-2px', 
                width: '14px', 
                height: '14px', 
                background: 'var(--accent)', 
                borderRadius: '50%', 
                border: '3px solid #020617',
                boxShadow: '0 0 10px var(--accent)'
              }} />
            )}
          </div>
          <div>
            <h3 style={{ fontSize: '19px', fontWeight: '800', color: 'white', margin: 0, letterSpacing: '-0.01em' }}>{activeChat.name}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {(activeChat.isGroup || activeChat.online) && (
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }} />
              )}
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', margin: 0 }}>
                {activeChat.isGroup ? (
                  `${activeChat.members?.length || 0} crew members`
                ) : activeChat.online ? (
                  'Online'
                ) : (
                  'Offline'
                )}
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <AnimatePresence>
              {isSearching && (
                <motion.input
                  initial={{ width: 0, opacity: 0, x: 20 }}
                  animate={{ width: isMobile ? '140px' : '220px', opacity: 1, x: 0 }}
                  exit={{ width: 0, opacity: 0, x: 20 }}
                  type="text"
                  placeholder="Find transmissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '10px 16px',
                    marginRight: '8px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '14px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              )}
            </AnimatePresence>
            <motion.button 
              whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.05)' }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setIsSearching(!isSearching);
                if (isSearching) setSearchQuery('');
              }}
              style={{ width: '44px', height: '44px', color: isSearching ? 'var(--primary)' : 'var(--text-muted)', border: 'none', background: 'transparent', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Search size={20} />
            </motion.button>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.05)' }}
            whileTap={{ scale: 0.9 }}
            onClick={onVoiceCall}
            style={{ width: '44px', height: '44px', color: 'var(--text-muted)', border: 'none', background: 'transparent', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Phone size={20} />
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.05)' }}
            whileTap={{ scale: 0.9 }}
            onClick={onVideoCall}
            style={{ width: '44px', height: '44px', color: 'var(--text-muted)', border: 'none', background: 'transparent', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Video size={20} />
          </motion.button>

          <div style={{ position: 'relative' }}>
            <motion.button 
              whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.05)' }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowHeaderMenu(!showHeaderMenu)}
              style={{ width: '44px', height: '44px', color: 'var(--text-muted)', border: 'none', background: 'transparent', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <MoreVertical size={20} />
            </motion.button>
            <AnimatePresence>
              {showHeaderMenu && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  style={{ 
                    position: 'absolute', 
                    top: '100%', 
                    right: 0, 
                    marginTop: '12px', 
                    padding: '8px', 
                    borderRadius: '20px', 
                    minWidth: '200px', 
                    zIndex: 100,
                    background: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid var(--glass-border)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <button 
                    className="glass-hover"
                    onClick={() => {
                      const chatContent = messages
                        .filter(msg => !msg.deletedForEveryone && !msg.deletedFor?.includes(currentUser.uid))
                        .map(msg => {
                          const sender = msg.userUid === currentUser.uid ? 'Me' : activeChat.name;
                          const time = msg.time || 'Unknown';
                          const text = msg.text || (msg.image ? '[Image]' : (msg.audio ? '[Audio]' : ''));
                          return `[${time}] ${sender}: ${text}`;
                        })
                        .join('\n');

                      const blob = new Blob([`Nebula Chat with ${activeChat.name}\nGenerated on ${new Date().toLocaleString()}\n\n${chatContent}`], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `nebula_chat_${activeChat.name.replace(/\s+/g, '_')}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                      setShowHeaderMenu(false);
                    }}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', textAlign: 'left', color: 'white', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600' }}
                  >
                    <Download size={16} /> Export History
                  </button>
                  {activeChat.isGroup && (
                    <>
                      <button 
                        className="glass-hover"
                        onClick={() => { 
                          onOpenGroupInfo();
                          setShowHeaderMenu(false); 
                        }}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', textAlign: 'left', color: 'white', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600' }}
                      >
                        <Info size={16} /> Nebula Info
                      </button>
                      {isAdmin && (
                        <button 
                          className="glass-hover"
                          onClick={() => { 
                            onAddMemberClick();
                            setShowHeaderMenu(false); 
                          }}
                          style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', textAlign: 'left', color: 'white', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600' }}
                        >
                          <UserPlus size={16} /> Invite Voyager
                        </button>
                      )}
                    </>
                  )}
                  <div style={{ height: '1px', background: 'var(--glass-border)', margin: '4px 8px' }} />
                  <button 
                    className="glass-hover"
                    onClick={() => { onClearChat(); setShowHeaderMenu(false); }}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', textAlign: 'left', color: '#ef4444', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600' }}
                  >
                    <Trash2 size={16} /> Clear Nebula
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Messages Feed */}
      <div 
        style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '16px' }} 
        className="custom-scrollbar"
      >
        <AnimatePresence initial={false}>
          {Array.isArray(messages) && messages
            .filter(msg => !msg.deletedFor?.includes(currentUser.uid))
            .filter(msg => {
              if (!searchQuery) return true;
              return msg.text?.toLowerCase().includes(searchQuery.toLowerCase());
            })
            .map((msg, index) => {
              const isMe = msg?.userUid === currentUser.uid;
              const prevMsg = messages[index - 1];
              const isFirstInGroup = !prevMsg || prevMsg.userUid !== msg.userUid;

              return (
                <motion.div
                  key={msg.id || index}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  style={{ 
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start',
                    position: 'relative'
                  }}
                >
                  {!isMe && isFirstInGroup && (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px', marginLeft: '12px' }}>
                      {msg.userName}
                    </span>
                  )}
                  
                  <div 
                    onClick={() => setOpenedMenuId(openedMenuId === msg.id ? null : msg.id)}
                    style={{ 
                      padding: msg?.image ? '6px' : '12px 18px', 
                      borderRadius: isMe 
                        ? (isFirstInGroup ? '20px 20px 4px 20px' : '20px 4px 4px 20px')
                        : (isFirstInGroup ? '20px 20px 20px 4px' : '4px 20px 20px 20px'),
                      background: isMe 
                        ? 'linear-gradient(135deg, var(--primary), #7c3aed)' 
                        : 'rgba(255,255,255,0.03)',
                      color: isMe ? 'white' : 'white',
                      boxShadow: isMe ? '0 8px 20px rgba(139, 92, 246, 0.2)' : 'none',
                      border: isMe ? 'none' : '1px solid rgba(255,255,255,0.05)',
                      cursor: 'pointer',
                      position: 'relative',
                      backdropFilter: isMe ? 'none' : 'blur(10px)'
                    }}
                  >
                    {msg?.deletedForEveryone ? (
                      <p style={{ fontSize: '14px', fontStyle: 'italic', opacity: 0.6, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Square size={14} /> Transmission terminated
                      </p>
                    ) : (
                      <>
                        {msg?.image ? (
                          <img src={msg.image} alt="Sent" style={{ maxWidth: '100%', borderRadius: '14px', display: 'block' }} />
                        ) : msg?.audio ? (
                          <div style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Mic size={16} />
                            </div>
                            <audio controls src={msg.audio} style={{ maxWidth: '200px', height: '32px' }} />
                          </div>
                        ) : (
                          <p style={{ fontSize: '15px', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>{msg?.text || ''}</p>
                        )}
                      </>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '4px' }}>
                      <span style={{ fontSize: '10px', opacity: 0.6, fontWeight: '700' }}>{msg?.time || ''}</span>
                      {isMe && (
                        <span style={{ fontSize: '11px', color: msg.read ? 'var(--accent)' : 'rgba(255,255,255,0.4)', fontWeight: '800' }}>
                          {msg.read ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>

                    {/* Message Menu */}
                    <AnimatePresence>
                      {openedMenuId === msg.id && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9, y: isMe ? -10 : 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: isMe ? -10 : 10 }}
                          style={{ 
                            position: 'absolute', 
                            bottom: 'calc(100% + 12px)', 
                            right: isMe ? 0 : 'auto',
                            left: isMe ? 'auto' : 0,
                            padding: '6px', 
                            borderRadius: '16px', 
                            zIndex: 100,
                            minWidth: '170px',
                            background: 'rgba(15, 23, 42, 0.95)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid var(--glass-border)',
                            boxShadow: '0 15px 40px rgba(0,0,0,0.4)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px'
                          }}
                        >
                          <button 
                            className="glass-hover"
                            onClick={(e) => { e.stopPropagation(); onDeleteMessage(msg.id, 'me'); setOpenedMenuId(null); }}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}
                          >
                            <Trash2 size={14} /> Delete for me
                          </button>
                          {isMe && (
                            <button 
                              className="glass-hover"
                              onClick={(e) => { e.stopPropagation(); onDeleteMessage(msg.id, 'everyone'); setOpenedMenuId(null); }}
                              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}
                            >
                              <ShieldCheck size={14} /> Recall message
                            </button>
                          )}
                          {(activeChat.isGroup || activeChat.id === 'global') && (
                            <button 
                              className="glass-hover"
                              onClick={(e) => { e.stopPropagation(); setShowInfoMessageId(msg.id); setOpenedMenuId(null); }}
                              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}
                            >
                              <Info size={14} /> Transmission Info
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
        </AnimatePresence>

        {/* Message Info Overlay */}
        <AnimatePresence>
          {showInfoMessageId && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ 
                position: 'fixed', 
                inset: 0, 
                zIndex: 3000, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '20px'
              }}
              onClick={() => setShowInfoMessageId(null)}
            >
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(12px)' }} />
              <motion.div 
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className="glass-panel"
                style={{ 
                  position: 'relative', 
                  width: '100%', 
                  maxWidth: '420px', 
                  padding: '32px', 
                  borderRadius: '32px',
                  boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
                  background: 'rgba(15, 23, 42, 0.7)'
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                  <h3 className="text-gradient" style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>Transmission Info</h3>
                  <motion.button 
                    whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.05)' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowInfoMessageId(null)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', borderRadius: '12px' }}
                  >
                    <X size={20} />
                  </motion.button>
                </div>

                <div>
                  <h4 style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: '800' }}>Received By</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '320px', overflowY: 'auto' }} className="custom-scrollbar">
                    {(() => {
                      const msg = messages.find(m => m.id === showInfoMessageId);
                      const seenBy = msg?.seenBy || [];
                      const readers = allUsers.filter(u => seenBy.includes(u.uid) && u.uid !== msg.userUid);
                      
                      if (readers.length === 0) {
                        return (
                          <div style={{ textAlign: 'center', padding: '40px 0' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                              <Search size={20} color="var(--text-muted)" />
                            </div>
                            <p style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: '500' }}>No crew members have received this yet.</p>
                          </div>
                        );
                      }

                      return readers.map(user => (
                        <div key={user.uid} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)' }}>
                          <img 
                            src={user.avatar} 
                            alt={user.name} 
                            style={{ width: '40px', height: '40px', borderRadius: '14px', objectFit: 'cover' }} 
                          />
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'white' }}>{user.name}</p>
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--accent)', fontWeight: '600' }}>Acknowledged</p>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Area */}
      <div style={{ padding: '24px 32px 32px', background: 'transparent' }}>
        <div className="glass-panel" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          padding: '10px 14px', 
          borderRadius: '24px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          background: 'rgba(15, 23, 42, 0.4)'
        }}>
          <motion.label 
            whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.05)' }}
            whileTap={{ scale: 0.9 }}
            style={{ width: '44px', height: '44px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '14px' }}
          >
            <Paperclip size={20} />
            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          </motion.label>
          
          <input 
            type="text" 
            placeholder="Secure transmission..." 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            style={{ 
              flex: 1, 
              background: 'transparent', 
              border: 'none', 
              padding: '12px 4px', 
              fontSize: '16px', 
              color: 'white',
              outline: 'none',
              fontWeight: '500'
            }}
          />
          
          <motion.button 
            whileHover={{ scale: 1.1, background: isRecording ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)' }}
            whileTap={{ scale: 0.9 }}
            style={{ 
              width: '44px', 
              height: '44px', 
              color: isRecording ? '#ef4444' : 'var(--text-muted)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              borderRadius: '14px',
              background: isRecording ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? <Square size={20} fill="#ef4444" /> : <Mic size={20} />}
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.05, filter: 'brightness(1.1)' }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            className="btn-primary"
            style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px var(--primary-glow)'
            }}
          >
            <Send size={20} fill="white" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;

