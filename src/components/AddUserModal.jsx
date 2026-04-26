import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, UserPlus, Check } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, getDocs, where, doc, setDoc, deleteDoc } from 'firebase/firestore';

const AddUserModal = ({ isOpen, onClose, currentUser, myContacts = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'users'),
        where('email', '>=', searchTerm),
        where('email', '<=', searchTerm + '\uf8ff')
      );
      const snapshot = await getDocs(q);
      const results = snapshot.docs
        .map(doc => doc.data())
        .filter(user => user.uid !== currentUser.uid);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching users:", error);
    }
    setLoading(false);
  };

  const toggleContact = async (user) => {
    const isContact = myContacts.includes(user.uid);
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

  useEffect(() => {
    if (!searchTerm) setSearchResults([]);
  }, [searchTerm]);

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
            style={{ width: '100%', maxWidth: '500px', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Add New Contact</h2>
              <button onClick={onClose} className="glass-hover" style={{ padding: '8px', borderRadius: '10px' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ position: 'relative', marginBottom: '24px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search by email..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  style={{ width: '100%', paddingLeft: '40px' }}
                />
              </div>

              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Searching...</div>
                ) : searchResults.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {searchResults.map(user => (
                      <div key={user.uid} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}>
                        <img src={user.avatar} alt={user.name} style={{ width: '40px', height: '40px', borderRadius: '10px' }} />
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: '600', fontSize: '14px' }}>{user.name}</p>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user.email}</p>
                        </div>
                        <button 
                          onClick={() => toggleContact(user)}
                          style={{ 
                            padding: '8px', 
                            borderRadius: '10px', 
                            background: myContacts.includes(user.uid) ? 'var(--accent)' : 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          {myContacts.includes(user.uid) ? <Check size={18} /> : <UserPlus size={18} />}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : searchTerm && !loading ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No users found</div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Enter an email to start searching</div>
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
