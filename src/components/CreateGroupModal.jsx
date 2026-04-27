import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Check, Search, Loader2 } from 'lucide-react';

const CreateGroupModal = ({ isOpen, onClose, contacts, onCreateGroup, currentUser }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      const q = query(
        collection(db, 'users'),
        where('searchName', '>=', term.toLowerCase()),
        where('searchName', '<=', term.toLowerCase() + '\uf8ff')
      );
      const snap = await getDocs(q);
      const results = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(u => u.id !== currentUser?.uid);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
    }
    setLoading(false);
  };

  const toggleUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const handleCreate = () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    onCreateGroup({
      name: groupName,
      members: selectedUsers,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${groupName}`
    });
    setGroupName('');
    setSelectedUsers([]);
    onClose();
  };

  const displayedUsers = searchTerm ? searchResults : (contacts || []).filter(c => c.id !== 'global');

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          zIndex: 2000, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '20px' 
        }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ 
              position: 'absolute', 
              inset: 0, 
              background: 'rgba(2, 6, 23, 0.85)', 
              backdropFilter: 'blur(12px)' 
            }}
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '480px',
              maxHeight: '85vh',
              padding: '40px',
              borderRadius: '32px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <motion.button 
              whileHover={{ rotate: 90, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              style={{ 
                position: 'absolute', 
                top: '24px', 
                right: '24px', 
                color: 'var(--text-muted)',
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                borderRadius: '12px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </motion.button>

            <h2 className="text-gradient" style={{ 
              fontSize: '28px', 
              fontWeight: '800', 
              marginBottom: '32px', 
              textAlign: 'center',
              letterSpacing: '-0.02em'
            }}>
              Create Group
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, overflow: 'hidden' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', marginLeft: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Group Name
                </label>
                <input 
                  type="text" 
                  value={groupName} 
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="The Cosmos Council..."
                  style={{ 
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '16px',
                    padding: '16px',
                    color: 'white',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', marginLeft: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Members ({selectedUsers.length})
                  </label>
                  <div style={{ position: 'relative', width: '180px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Search..."
                      style={{ 
                        padding: '10px 12px 10px 36px', 
                        fontSize: '13px', 
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--glass-border)',
                        color: 'white',
                        width: '100%',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
                    />
                  </div>
                </div>

                <div className="custom-scrollbar" style={{ 
                  flex: 1, 
                  overflowY: 'auto', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px',
                  paddingRight: '4px'
                }}>
                  {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                        <Loader2 size={24} color="var(--primary)" />
                      </motion.div>
                    </div>
                  ) : displayedUsers.map((contact, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      key={contact.id}
                      onClick={() => toggleUser(contact.id)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        padding: '12px', 
                        borderRadius: '16px', 
                        cursor: 'pointer',
                        background: selectedUsers.includes(contact.id) ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${selectedUsers.includes(contact.id) ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}`,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <img src={contact.avatar} alt="" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)' }} />
                      <span style={{ flex: 1, fontSize: '15px', fontWeight: '600', color: selectedUsers.includes(contact.id) ? 'white' : 'var(--text-muted)' }}>
                        {contact.name}
                      </span>
                      <div style={{ 
                        width: '22px', 
                        height: '22px', 
                        borderRadius: '6px', 
                        border: `2px solid ${selectedUsers.includes(contact.id) ? 'var(--primary)' : 'var(--glass-border)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: selectedUsers.includes(contact.id) ? 'var(--primary)' : 'transparent',
                        transition: 'all 0.2s ease'
                      }}>
                        {selectedUsers.includes(contact.id) && <Check size={14} color="white" strokeWidth={4} />}
                      </div>
                    </motion.div>
                  ))}
                  {!loading && displayedUsers.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>No cosmic travelers found</p>
                    </div>
                  )}
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: !groupName.trim() || selectedUsers.length === 0 ? 1 : 1.02, translateY: !groupName.trim() || selectedUsers.length === 0 ? 0 : -2 }}
                whileTap={{ scale: !groupName.trim() || selectedUsers.length === 0 ? 1 : 0.98 }}
                onClick={handleCreate}
                disabled={!groupName.trim() || selectedUsers.length === 0}
                style={{ 
                  background: 'linear-gradient(135deg, var(--primary), var(--accent))', 
                  color: 'white', 
                  padding: '18px', 
                  borderRadius: '20px', 
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  marginTop: '12px',
                  border: 'none',
                  opacity: (!groupName.trim() || selectedUsers.length === 0) ? 0.4 : 1,
                  cursor: (!groupName.trim() || selectedUsers.length === 0) ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  boxShadow: (!groupName.trim() || selectedUsers.length === 0) ? 'none' : '0 15px 30px rgba(139, 92, 246, 0.3)'
                }}
              >
                <Users size={20} /> Create Group
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateGroupModal;

