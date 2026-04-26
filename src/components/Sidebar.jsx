import React from 'react';
import { Search, MessageSquare, Users, Settings, LogOut, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = ({ activeChat, setActiveChat, contacts, currentUser, unreadCounts, onOpenSettings, onAddUser, onLogout, className }) => {
  return (
    <div className={`sidebar glass ${className}`} style={{ width: 'var(--sidebar-width)', flexShrink: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Sidebar Header */}
      <div style={{ padding: 'var(--side-padding, 24px)', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', background: 'linear-gradient(to right, #8b5cf6, #2dd4bf)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Nebula</h1>
          <button onClick={onOpenSettings} className="glass-hover" style={{ padding: '8px', borderRadius: '10px', color: 'var(--text-muted)' }}>
            <Settings size={20} />
          </button>
        </div>
        
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search conversations..." 
            style={{ width: '100%', paddingLeft: '40px' }}
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', padding: '12px var(--side-padding, 24px)' }}>
        <button className="glass" style={{ flex: 1, padding: '10px', borderRadius: '10px', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}>
          <MessageSquare size={16} /> All
        </button>
        <button className="glass-hover" style={{ flex: 1, padding: '10px', borderRadius: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px' }}>
          <Users size={16} /> Groups
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }} className="custom-scrollbar">
        {contacts.map((contact) => (
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
        ))}
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


      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={onAddUser}
        style={{
          position: 'absolute',
          bottom: '100px',
          right: 'var(--side-padding, 24px)',
          width: '56px',
          height: '56px',
          borderRadius: '18px',
          backgroundColor: 'var(--primary)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
          zIndex: 10
        }}
      >
        <Plus size={28} />
      </motion.button>
    </div>
  );
};

export default Sidebar;
