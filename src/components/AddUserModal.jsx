import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, UserPlus, Check, Loader2, MessageSquare } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, getDocs, where, doc, setDoc, deleteDoc, limit } from 'firebase/firestore';

const AddUserModal = ({ isOpen, onClose, currentUser, myContacts = [], onStartChat }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const lowerQuery = searchTerm.toLowerCase().trim();
      const usersRef = collection(db, 'users');
      
      const emailQuery = query(
        usersRef,
        where('searchEmail', '>=', lowerQuery),
        where('searchEmail', '<=', lowerQuery + '\uf8ff'),
        limit(10)
      );
      const nameQuery = query(
        usersRef,
        where('searchName', '>=', lowerQuery),
        where('searchName', '<=', lowerQuery + '\uf8ff'),
        limit(10)
      );
      // Fallback for full email match (case-insensitive check)
      const exactEmailQuery = query(
        usersRef,
        where('email', '==', searchTerm.trim()),
        limit(1)
      );
      const exactEmailQueryLower = query(
        usersRef,
        where('email', '==', searchTerm.trim().toLowerCase()),
        limit(1)
      );

      // Fallback for name match (case-insensitive check)
      const exactNameQuery = query(
        usersRef,
        where('name', '==', searchTerm.trim()),
        limit(5)
      );
      const exactNameQueryLower = query(
        usersRef,
        where('name', '==', searchTerm.trim().toLowerCase()),
        limit(5)
      );

      console.log(`Searching for "${searchTerm}"...`);
      const [emailSnap, nameSnap, exactSnap, exactSnapLower, exactNameSnap, exactNameSnapLower] = await Promise.all([
        getDocs(emailQuery),
        getDocs(nameQuery),
        getDocs(exactEmailQuery),
        getDocs(exactEmailQueryLower),
        getDocs(exactNameQuery),
        getDocs(exactNameQueryLower)
      ]);

      const emailResults = emailSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      const nameResults = nameSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      const exactResults = [
        ...exactSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() })),
        ...exactSnapLower.docs.map(doc => ({ uid: doc.id, ...doc.data() }))
      ];
      const exactNameResults = [
        ...exactNameSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() })),
        ...exactNameSnapLower.docs.map(doc => ({ uid: doc.id, ...doc.data() }))
      ];
      
      console.log(`Found ${emailResults.length} by email prefix, ${nameResults.length} by name prefix, ${exactResults.length} by email exact, ${exactNameResults.length} by name exact`);
      
      // Merge and deduplicate
      const combined = [...emailResults, ...nameResults, ...exactResults, ...exactNameResults];
      const unique = Array.from(new Map(combined.map(u => [u.uid, u])).values())
        .filter(user => user.uid !== currentUser?.uid);
      
      console.log(`Unique results (excluding self): ${unique.length}`);
      setSearchResults(unique);
    } catch (error) {
      console.error("Error searching users:", error);
    }
    setLoading(false);
  };

  const toggleContact = async (user) => {
    const isContact = myContacts.some(c => c.uid === user.uid);
    const contactRef = doc(db, 'users', currentUser.uid, 'contacts', user.uid);
    
    try {
      if (isContact) {
        await deleteDoc(contactRef);
      } else {
        await setDoc(contactRef, {
          uid: user.uid,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          addedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error toggling contact:", error);
    }
  };

  const handleMessage = (user) => {
    if (onStartChat) {
      onStartChat(user);
      onClose();
    }
  };

  useEffect(() => {
    if (!searchTerm) setSearchResults([]);
  }, [searchTerm]);

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
              maxWidth: '500px', 
              borderRadius: '32px', 
              position: 'relative', 
              overflow: 'hidden',
              boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ 
              padding: '24px 32px', 
              borderBottom: '1px solid var(--glass-border)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <h2 className="text-gradient" style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.02em' }}>
                Add Contact
              </h2>
              <motion.button 
                whileHover={{ rotate: 90, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose} 
                style={{ 
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  borderRadius: '12px',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </motion.button>
            </div>

            <div style={{ padding: '32px' }}>
              <div style={{ position: 'relative', marginBottom: '24px', display: 'flex', gap: '12px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={18} style={{ 
                    position: 'absolute', 
                    left: '16px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: 'var(--text-muted)' 
                  }} />
                  <input 
                    type="text" 
                    placeholder="Name or email..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    style={{ 
                      width: '100%', 
                      paddingLeft: '48px',
                      paddingRight: '16px',
                      paddingTop: '14px',
                      paddingBottom: '14px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '16px',
                      color: 'white',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
                  />
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSearch}
                  style={{ 
                    padding: '0 24px', 
                    borderRadius: '16px', 
                    background: 'var(--primary)', 
                    color: 'white', 
                    fontWeight: '700',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 8px 16px rgba(139, 92, 246, 0.2)'
                  }}
                >
                  Search
                </motion.button>
              </div>

              <div style={{ maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }} className="custom-scrollbar">
                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '12px' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                      <Loader2 size={32} color="var(--primary)" />
                    </motion.div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>Finding users...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {searchResults.map((user, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={user.uid} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '14px', 
                          padding: '14px', 
                          borderRadius: '18px', 
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          style={{ 
                            width: '44px', 
                            height: '44px', 
                            borderRadius: '14px',
                            background: 'rgba(255,255,255,0.1)'
                          }} 
                        />
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: '700', fontSize: '15px', color: 'white', marginBottom: '2px' }}>{user.name}</p>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>{user.email}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleMessage(user)}
                            title="Send Message"
                            style={{ 
                              width: '38px',
                              height: '38px',
                              borderRadius: '12px', 
                              background: 'rgba(255,255,255,0.05)',
                              color: 'white',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <MessageSquare size={18} strokeWidth={2.5} />
                          </motion.button>
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toggleContact(user)}
                            title={myContacts.some(c => c.uid === user.uid) ? "Remove Contact" : "Add Contact"}
                            style={{ 
                              width: '38px',
                              height: '38px',
                              borderRadius: '12px', 
                              background: myContacts.some(c => c.uid === user.uid) ? 'var(--accent)' : 'var(--primary)',
                              color: 'white',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }}
                          >
                            {myContacts.some(c => c.uid === user.uid) ? <Check size={20} strokeWidth={3} /> : <UserPlus size={20} strokeWidth={2.5} />}
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : searchTerm && !loading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '15px', fontWeight: '500' }}>No cosmic travelers found</p>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px' }}>
                      <Search size={32} color="var(--glass-border)" />
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500', lineHeight: '1.5' }}>
                      Enter a name or email address <br />
                       to search the Nebula network
                    </p>
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

export default AddUserModal;

