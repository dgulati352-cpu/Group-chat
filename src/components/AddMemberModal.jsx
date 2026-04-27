import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, UserPlus, Check, User, Mail, Sparkles } from 'lucide-react';
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'absolute', inset: 0, background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(16px)' }}
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            className="glass-panel"
            style={{ 
              width: '100%', 
              maxWidth: '520px', 
              borderRadius: '32px', 
              position: 'relative', 
              overflow: 'hidden',
              boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
              background: 'rgba(15, 23, 42, 0.6)'
            }}
          >
            {/* Background Glow */}
            <div style={{ position: 'absolute', width: '200px', height: '200px', background: 'var(--primary)', filter: 'blur(100px)', opacity: 0.1, top: '-50px', right: '-50px', zIndex: 0 }} />

            <div style={{ padding: '32px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
              <div>
                <h2 className="text-gradient" style={{ fontSize: '24px', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>Expand the Crew</h2>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600', marginTop: '4px' }}>Invite voyagers to <span style={{ color: 'var(--accent)' }}>{group?.name}</span></p>
              </div>
              <motion.button 
                whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.05)' }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose} 
                style={{ padding: '10px', borderRadius: '14px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </motion.button>
            </div>

            <div style={{ padding: '32px', position: 'relative', zIndex: 1 }}>
              <div style={{ position: 'relative', marginBottom: '32px' }}>
                <div style={{ position: 'relative', display: 'flex', gap: '12px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 2 }} />
                    <input 
                      type="text" 
                      placeholder="Identify user (name or email)..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      style={{ 
                        width: '100%', 
                        padding: '16px 16px 16px 48px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '18px',
                        color: 'white',
                        fontSize: '15px',
                        fontWeight: '500',
                        outline: 'none',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSearch}
                    className="btn-primary"
                    style={{ 
                      padding: '0 24px', 
                      borderRadius: '18px', 
                      fontWeight: '800',
                      letterSpacing: '0.02em',
                      fontSize: '14px'
                    }}
                  >
                    SCAN
                  </motion.button>
                </div>
              </div>

              <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }} className="custom-scrollbar">
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      style={{ width: '40px', height: '40px', border: '3px solid rgba(139, 92, 246, 0.2)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 16px' }}
                    />
                    <p style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: '600' }}>Scanning the nebula...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h4 style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: '800', marginBottom: '4px' }}>
                      {searchTerm ? 'Scan Results' : 'Suggested Voyagers'}
                    </h4>
                    {searchResults.map(user => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={user.uid} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '16px', 
                          padding: '14px', 
                          borderRadius: '20px', 
                          background: 'rgba(255,255,255,0.02)', 
                          border: '1px solid rgba(255,255,255,0.05)',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <div style={{ position: 'relative' }}>
                          <img src={user.avatar} alt={user.name} style={{ width: '48px', height: '48px', borderRadius: '16px', objectFit: 'cover' }} />
                          {user.online && <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '12px', height: '12px', background: 'var(--accent)', borderRadius: '50%', border: '2px solid #0f172a' }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: '700', fontSize: '16px', color: 'white', margin: 0 }}>{user.name}</p>
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500', margin: 0 }}>{user.email}</p>
                        </div>
                        <motion.button 
                          whileHover={{ scale: 1.1, background: 'var(--primary)' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => addMember(user)}
                          style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '12px', 
                            background: 'rgba(139, 92, 246, 0.1)',
                            color: 'var(--primary)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <UserPlus size={18} />
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                ) : searchTerm && !loading ? (
                  <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                      <Search size={28} color="var(--text-muted)" opacity={0.5} />
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '16px' }}>Voyager not located in this sector.</p>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '24px', background: 'rgba(139, 92, 246, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                      <Sparkles size={28} color="var(--primary)" opacity={0.5} />
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '16px' }}>Begin a search or select from crew candidates.</p>
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

