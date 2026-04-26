import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Check, Search } from 'lucide-react';

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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass"
            style={{
              width: '100%',
              maxWidth: '450px',
              maxHeight: '80vh',
              padding: '32px',
              borderRadius: '24px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <button 
              onClick={onClose}
              style={{ position: 'absolute', top: '20px', right: '20px', color: 'var(--text-muted)' }}
            >
              <X size={24} />
            </button>

            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>Create New Group</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, overflow: 'hidden' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', color: 'var(--text-muted)', marginLeft: '4px' }}>Group Name</label>
                <input 
                  type="text" 
                  value={groupName} 
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '14px', color: 'var(--text-muted)', marginLeft: '4px' }}>Select Members ({selectedUsers.length})</label>
                  <div style={{ position: 'relative', width: '150px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Search people..."
                      style={{ padding: '6px 6px 6px 28px', fontSize: '12px', borderRadius: '8px' }}
                    />
                  </div>
                </div>

                <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {loading ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px', fontSize: '14px' }}>Searching...</p>
                  ) : displayedUsers.map(contact => (
                    <div 
                      key={contact.id}
                      onClick={() => toggleUser(contact.id)}
                      className="glass-hover"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        padding: '10px', 
                        borderRadius: '12px', 
                        cursor: 'pointer',
                        background: selectedUsers.includes(contact.id) ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                        border: `1px solid ${selectedUsers.includes(contact.id) ? 'var(--primary)' : 'transparent'}`
                      }}
                    >
                      <img src={contact.avatar} alt="" style={{ width: '36px', height: '36px', borderRadius: '10px' }} />
                      <span style={{ flex: 1, fontSize: '14px' }}>{contact.name}</span>
                      {selectedUsers.includes(contact.id) && (
                        <div style={{ backgroundColor: 'var(--primary)', color: 'white', borderRadius: '50%', padding: '2px' }}>
                          <Check size={14} />
                        </div>
                      )}
                    </div>
                  ))}
                  {!loading && displayedUsers.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px', fontSize: '14px' }}>No users found.</p>
                  )}
                </div>
              </div>

              <button 
                onClick={handleCreate}
                disabled={!groupName.trim() || selectedUsers.length === 0}
                style={{ 
                  backgroundColor: 'var(--primary)', 
                  color: 'white', 
                  padding: '14px', 
                  borderRadius: '12px', 
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '12px',
                  opacity: (!groupName.trim() || selectedUsers.length === 0) ? 0.5 : 1,
                  cursor: (!groupName.trim() || selectedUsers.length === 0) ? 'not-allowed' : 'pointer'
                }}
              >
                <Users size={20} /> Create Group
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateGroupModal;
