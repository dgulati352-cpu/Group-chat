import React from 'react';
import { Search, MessageSquare, Users, Settings, LogOut, Plus, Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = ({ 
  activeChat, 
  setActiveChat, 
  contacts, 
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
  return (
    <div className={`sidebar glass ${className}`} style={{ width: 'var(--sidebar-width)', flexShrink: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Sidebar Header */}
      <div style={{ padding: 'var(--side-padding, 24px)', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', background: 'linear-gradient(to right, #8b5cf6, #2dd4bf)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Nebula</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onOpenCreateGroup} title="Create Group" className="glass-hover" style={{ padding: '8px', borderRadius: '10px', color: 'var(--text-muted)' }}>
              <Users size={20} />
            </button>
            <button onClick={onAddUser} title="Add Contact" className="glass-hover" style={{ padding: '8px', borderRadius: '10px', color: 'var(--text-muted)' }}>
              <Plus size={20} />
            </button>
            <button onClick={onOpenSettings} className="glass-hover" style={{ padding: '8px', borderRadius: '10px', color: 'var(--text-muted)' }}>
              <Settings size={20} />
            </button>
          </div>
        </div>
        
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search conversations..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '40px' }}
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', padding: '12px var(--side-padding, 24px)' }}>
        <button 
          onClick={() => setSidebarTab('chats')}
          className={sidebarTab === 'chats' ? "glass" : "glass-hover"} 
          style={{ flex: 1, padding: '10px', borderRadius: '10px', color: sidebarTab === 'chats' ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}
        >
          <MessageSquare size={16} /> Chats
        </button>
        <button 
          onClick={() => setSidebarTab('calls')}
          className={sidebarTab === 'calls' ? "glass" : "glass-hover"} 
          style={{ flex: 1, padding: '10px', borderRadius: '10px', color: sidebarTab === 'calls' ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}
        >
          <Phone size={16} /> Calls
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }} className="custom-scrollbar">
        {sidebarTab === 'chats' ? (
          contacts.map((contact) => (
            <motion.div
              key={contact.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setActiveChat(contact)}
              className={`glass-hover ${activeChat?.id === contact.id ? 'active-chat' : ''}`}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '12px', 
                borderRadius: '12px', 
                cursor: 'pointer',
                marginBottom: '4px',
                background: activeChat?.id === contact.id ? 'var(--glass-hover)' : 'transparent',
                border: activeChat?.id === contact.id ? '1px solid var(--glass-border)' : '1px solid transparent'
              }}
            >
              <div style={{ position: 'relative' }}>
                <img 
                  src={contact.avatar} 
                  alt={contact.name} 
                  style={{ width: '48px', height: '48px', borderRadius: '14px', objectFit: 'cover' }} 
                />
                {contact.online && (
                  <div style={{ 
                    position: 'absolute', 
                    bottom: '-2px', 
                    right: '-2px', 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    backgroundColor: 'var(--accent)', 
                    border: '2px solid var(--bg-darker)' 
                  }} />
                )}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span style={{ fontWeight: '600', fontSize: '15px' }}>{contact.name}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{contact.time}</span>
                    {unreadCounts?.[contact.id] > 0 && (
                      <div style={{ backgroundColor: 'var(--primary)', color: 'white', fontSize: '10px', fontWeight: 'bold', minWidth: '18px', height: '18px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                        {unreadCounts[contact.id]}
                      </div>
                    )}
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {contact.lastMessage}
                </p>
              </div>
            </motion.div>
          ))
        ) : (
          callHistory.map((call) => {
            const isOutgoing = call.from === currentUser.uid;
            const otherUserUid = isOutgoing ? call.to : call.from;
            const statusColor = call.status === 'accepted' ? 'var(--accent)' : call.status === 'rejected' || call.status === 'missed' ? '#ef4444' : 'var(--text-muted)';
            
            return (
              <motion.div
                key={call.id}
                whileHover={{ scale: 1.01 }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '12px', 
                  borderRadius: '12px', 
                  marginBottom: '4px',
                  background: 'transparent',
                  border: '1px solid transparent'
                }}
              >
                <img 
                  src={getParticipantAvatar(otherUserUid)} 
                  alt="User" 
                  style={{ width: '44px', height: '44px', borderRadius: '12px', objectFit: 'cover' }} 
                />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600', fontSize: '15px' }}>{getParticipantName(otherUserUid)}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatTime(call.createdAt)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    {isOutgoing ? (
                      <PhoneOutgoing size={12} style={{ color: 'var(--text-muted)' }} />
                    ) : call.status === 'rejected' || call.status === 'missed' ? (
                      <PhoneMissed size={12} style={{ color: '#ef4444' }} />
                    ) : (
                      <PhoneIncoming size={12} style={{ color: 'var(--text-muted)' }} />
                    )}
                    <span style={{ fontSize: '13px', color: statusColor, textTransform: 'capitalize' }}>
                      {call.isVideo ? 'Video Call' : 'Voice Call'} • {call.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* User Profile */}
      <div style={{ padding: '16px var(--side-padding, 20px)', borderTop: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.2)' }}>
        <img 
          src={currentUser?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} 
          alt="My Profile" 
          style={{ width: '42px', height: '42px', borderRadius: '12px', border: '1px solid var(--glass-border)', flexShrink: 0 }} 
        />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <p style={{ fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)' }}>{currentUser?.name || 'Anonymous'}</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser?.email}</p>
        </div>
        <button onClick={onLogout} className="glass-hover" style={{ padding: '10px', borderRadius: '10px', color: '#ef4444', flexShrink: 0 }}>
          <LogOut size={18} />
        </button>
      </div>



    </div>
  );
};

export default Sidebar;
