import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, UserPlus, Check } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, getDocs, where, doc, updateDoc, arrayUnion } from 'firebase/firestore';

const AddMemberModal = ({ isOpen, onClose, group, currentUser, contacts = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const emailQuery = query(
        collection(db, 'users'),
        where('searchEmail', '>=', searchTerm.toLowerCase()),
        where('searchEmail', '<=', searchTerm.toLowerCase() + '\uf8ff')
      );
      const nameQuery = query(
        collection(db, 'users'),
        where('searchName', '>=', searchTerm.toLowerCase()),
        where('searchName', '<=', searchTerm.toLowerCase() + '\uf8ff')
      );

      const [emailSnap, nameSnap] = await Promise.all([
        getDocs(emailQuery),
        getDocs(nameQuery)
      ]);

      const emailResults = emailSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const nameResults = nameSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const combined = [...emailResults, ...nameResults];
      const unique = Array.from(new Map(combined.map(u => [u.uid, u])).values())
        .filter(user => user.uid !== currentUser?.uid && !group?.members?.includes(user.uid));
      
      setSearchResults(unique);
    } catch (error) {
      console.error("Error searching users:", error);
    }
    setLoading(false);
  };

  const addMember = async (user) => {
    try {
      const groupRef = doc(db, 'groups', group.id);
      await updateDoc(groupRef, {
        members: arrayUnion(user.uid)
      });
      // Update UI: remove from search results
      setSearchResults(prev => prev.filter(u => u.uid !== user.uid));
    } catch (error) {
      console.error("Error adding member:", error);
      alert("Failed to add member");
    }
  };

  useEffect(() => {
    if (!searchTerm) {
      // Show contacts who are not already in the group
      const availableContacts = (contacts || []).filter(u => !group?.members?.includes(u.uid));
      setSearchResults(availableContacts.slice(0, 10));
    }
  }, [searchTerm, contacts, group]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'absolute', inset: 0, background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(8px)' }}
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="glass"
            style={{ width: '95%', maxWidth: '500px', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Add to {group?.name || 'Group'}</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Select members to add to the group</p>
              </div>
              <button onClick={onClose} className="glass-hover" style={{ padding: '8px', borderRadius: '10px' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ position: 'relative', marginBottom: '24px', display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="Search people..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    style={{ width: '100%', paddingLeft: '40px' }}
                  />
                </div>
                <button 
                  onClick={handleSearch}
                  className="primary-button"
                  style={{ 
                    padding: '0 20px', 
                    borderRadius: '12px', 
                    background: 'var(--primary)', 
                    color: 'white', 
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Search
                </button>
              </div>

              <div style={{ maxHeight: '350px', overflowY: 'auto' }} className="custom-scrollbar">
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Searching...</div>
                ) : searchResults.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {searchResults.map(user => (
                      <div key={user.uid} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
                        <img src={user.avatar} alt={user.name} style={{ width: '44px', height: '44px', borderRadius: '12px', objectFit: 'cover' }} />
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: '600', fontSize: '15px' }}>{user.name}</p>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user.email}</p>
                        </div>
                        <button 
                          onClick={() => addMember(user)}
                          style={{ 
                            padding: '10px', 
                            borderRadius: '12px', 
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
                          }}
                        >
                          <UserPlus size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : searchTerm && !loading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <Search size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
                    <p>No new users found</p>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <p>Select from your contacts or search above</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddMemberModal;
