import React from 'react';
import { Search, MessageSquare, Users, Settings, LogOut, Plus, Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ 
  activeChat, 
  setActiveChat, 
  contacts, 
  chats,
  currentUser, 
  unreadCounts, 
  callHistory,
  sidebarTab,
  setSidebarTab,
  onOpenSettings, 
  onAddUser, 
  onOpenCreateGroup,
  onLogout, 
  className,
  searchTerm,
  setSearchTerm
}) => {
  const getParticipantName = (uid) => {
    const contact = contacts.find(c => c.id === uid);
    return contact ? contact.name : 'Unknown User';
  };

  const getParticipantAvatar = (uid) => {
    const contact = contacts.find(c => c.id === uid);
    return contact ? contact.avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <div className={`sidebar glass-panel ${className}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', zIndex: 10 }}>
      {/* Sidebar Header */}
      <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 className="text-gradient" style={{ fontSize: '28px', fontWeight: '800' }}>Nebula</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onOpenCreateGroup} 
              title="Create Group" 
              className="glass-card" 
              style={{ width: '40px', height: '40px', color: 'var(--text-muted)' }}
            >
              <Users size={20} />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onAddUser} 
              title="Add Contact" 
              className="glass-card" 
              style={{ width: '40px', height: '40px', color: 'var(--text-muted)' }}
            >
              <Plus size={20} />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onOpenSettings} 
              className="glass-card" 
              style={{ width: '40px', height: '40px', color: 'var(--text-muted)' }}
            >
              <Settings size={20} />
            </motion.button>
          </div>
        </div>
        
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input 
            type="text" 
            placeholder="Search conversations..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '48px', height: '52px' }}
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', padding: '16px 24px', flexWrap: 'nowrap' }}>
        <button 
          onClick={() => setSidebarTab('chats')}
          className={sidebarTab === 'chats' ? "btn-primary" : "glass-card"} 
          style={{ flex: 1, height: '40px', gap: '6px', fontSize: '13px', padding: '0 8px' }}
        >
          <MessageSquare size={14} /> Chats
        </button>
        <button 
          onClick={() => setSidebarTab('contacts')}
          className={sidebarTab === 'contacts' ? "btn-primary" : "glass-card"} 
          style={{ flex: 1, height: '40px', gap: '6px', fontSize: '13px', padding: '0 8px' }}
        >
          <Users size={14} /> People
        </button>
        <button 
          onClick={() => setSidebarTab('calls')}
          className={sidebarTab === 'calls' ? "btn-primary" : "glass-card"} 
          style={{ flex: 1, height: '40px', gap: '6px', fontSize: '13px', padding: '0 8px' }}
        >
          <Phone size={14} /> Calls
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
        <AnimatePresence mode="wait">
          {sidebarTab === 'chats' ? (
            <motion.div
              key="chats-list"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
            >
              {chats.map((chat) => {
                const otherId = chat.participants?.find(uid => uid !== currentUser.uid);
                const contact = contacts.find(c => c.id === otherId);
                const name = contact ? contact.name : (chat.isGroup ? chat.name : 'Unknown User');
                const avatar = contact ? contact.avatar : (chat.isGroup ? chat.avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherId}`);
                const isOnline = contact?.online;
                const lastMessage = chat.lastMessage || 'No messages yet';
                const time = formatTime(chat.lastMessageTime);

                return (
                  <motion.div
                    key={chat.id}
                    variants={itemVariants}
                    whileHover={{ x: 4 }}
                    onClick={() => setActiveChat({ ...chat, uid: otherId, name, avatar })}
                    className="glass-card"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '16px', 
                      padding: '12px 16px', 
                      cursor: 'pointer',
                      background: activeChat?.id === chat.id ? 'var(--glass-hover)' : '',
                      borderColor: activeChat?.id === chat.id ? 'var(--primary)' : ''
                    }}
                  >
                    <div className="avatar-container" style={{ width: '54px', height: '54px' }}>
                      <img 
                        src={avatar} 
                        alt={name} 
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                      />
                      {isOnline && <div className="online-indicator" />}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-main)' }}>{name}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{time}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                          {lastMessage}
                        </p>
                        {unreadCounts?.[chat.id] > 0 && (
                          <div style={{ 
                            background: 'var(--primary)', 
                            color: 'white', 
                            fontSize: '11px', 
                            fontWeight: 'bold', 
                            minWidth: '20px', 
                            height: '20px', 
                            borderRadius: '10px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            padding: '0 6px',
                            marginLeft: '8px',
                            boxShadow: '0 0 10px var(--primary-glow)'
                          }}>
                            {unreadCounts[chat.id]}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : sidebarTab === 'contacts' ? (
            <motion.div
              key="contacts-list"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
            >
              {contacts.length > 0 ? contacts.map((contact) => (
                <motion.div
                  key={contact.id}
                  variants={itemVariants}
                  whileHover={{ x: 4 }}
                  onClick={() => setActiveChat({ 
                    id: [currentUser.uid, contact.uid || contact.id].sort().join('_'),
                    uid: contact.uid || contact.id, 
                    name: contact.name, 
                    avatar: contact.avatar,
                    isGroup: false 
                  })}
                  className="glass-card"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px', 
                    padding: '12px 16px', 
                    cursor: 'pointer',
                    background: (activeChat?.uid === (contact.uid || contact.id)) ? 'var(--glass-hover)' : '',
                    borderColor: (activeChat?.uid === (contact.uid || contact.id)) ? 'var(--primary)' : ''
                  }}
                >
                  <div className="avatar-container" style={{ width: '48px', height: '48px' }}>
                    <img 
                      src={contact.avatar} 
                      alt={contact.name} 
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                    />
                    {contact.online && <div className="online-indicator" />}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-main)' }}>{contact.name}</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{contact.email}</p>
                  </div>
                </motion.div>
              )) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                  <Users size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                  <p>Your nebula is empty.</p>
                  <p style={{ fontSize: '12px' }}>Add people to start chatting.</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="calls-list"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
            >
              {callHistory.length > 0 ? callHistory.map((call) => {
                const isOutgoing = call.from === currentUser.uid;
                const otherUserUid = isOutgoing ? call.to : call.from;
                const isMissed = !isOutgoing && (call.status === 'rejected' || call.status === 'missed');
                
                return (
                  <motion.div
                    key={call.id}
                    variants={itemVariants}
                    whileHover={{ x: 4 }}
                    className="glass-card"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '16px', 
                      padding: '12px 16px'
                    }}
                  >
                    <img 
                      src={getParticipantAvatar(otherUserUid)} 
                      alt="User" 
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--glass-border)' }} 
                    />
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '700', fontSize: '16px' }}>{getParticipantName(otherUserUid)}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{formatTime(call.createdAt)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <div style={{ color: isMissed ? 'var(--danger)' : 'var(--text-dim)' }}>
                          {isOutgoing ? <PhoneOutgoing size={14} /> : isMissed ? <PhoneMissed size={14} /> : <PhoneIncoming size={14} />}
                        </div>
                        <span style={{ fontSize: '13px', color: isMissed ? 'var(--danger)' : 'var(--text-muted)', textTransform: 'capitalize' }}>
                          {call.isVideo ? 'Video' : 'Voice'} Call • {call.status}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User Profile */}
      <div style={{ padding: '20px 24px', borderTop: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(2, 6, 23, 0.4)' }}>
        <div className="avatar-container" style={{ width: '46px', height: '46px' }}>
          <img 
            src={currentUser?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} 
            alt="My Profile" 
            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
          />
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <p style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser?.name || 'Anonymous'}</p>
          <p style={{ fontSize: '12px', color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser?.email}</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
          whileTap={{ scale: 0.9 }}
          onClick={onLogout} 
          style={{ width: '40px', height: '40px', borderRadius: '12px', color: 'var(--danger)', background: 'transparent' }}
        >
          <LogOut size={20} />
        </motion.button>
      </div>
    </div>
  );
};

export default Sidebar;
