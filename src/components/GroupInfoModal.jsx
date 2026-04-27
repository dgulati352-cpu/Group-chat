import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, UserMinus, ShieldAlert, ShieldCheck, MoreVertical, LogOut, Shield } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

const GroupInfoModal = ({ isOpen, onClose, group, currentUser, allUsers = [], onAddMemberClick }) => {
  const [openedMemberMenuId, setOpenedMemberMenuId] = useState(null);

  if (!group || !group.isGroup) return null;

  const isAdmin = group.admins?.includes(currentUser?.uid) || group.createdBy === currentUser?.uid;
  const members = allUsers.filter(u => group.members?.includes(u.uid));

  const handleUpdateRole = async (memberUid, makeAdmin) => {
    try {
      const groupRef = doc(db, 'groups', group.id);
      if (makeAdmin) {
        await updateDoc(groupRef, {
          admins: arrayUnion(memberUid)
        });
      } else {
        await updateDoc(groupRef, {
          admins: arrayRemove(memberUid)
        });
      }
      setOpenedMemberMenuId(null);
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const handleTransferAdmin = async (memberUid) => {
    if (!window.confirm("Are you sure you want to transfer admin rights to this member? You will no longer be an admin.")) return;
    try {
      const groupRef = doc(db, 'groups', group.id);
      await updateDoc(groupRef, {
        admins: arrayUnion(memberUid),
        createdBy: memberUid
      });
      await updateDoc(groupRef, {
        admins: arrayRemove(currentUser.uid)
      });
      setOpenedMemberMenuId(null);
    } catch (error) {
      console.error("Error transferring admin:", error);
    }
  };

  const handleRemoveMember = async (memberUid) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
      const groupRef = doc(db, 'groups', group.id);
      await updateDoc(groupRef, {
        members: arrayRemove(memberUid),
        admins: arrayRemove(memberUid)
      });
      setOpenedMemberMenuId(null);
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm("Are you sure you want to leave this group?")) return;
    try {
      const groupRef = doc(db, 'groups', group.id);
      await updateDoc(groupRef, {
        members: arrayRemove(currentUser.uid),
        admins: arrayRemove(currentUser.uid)
      });
      onClose();
    } catch (error) {
      console.error("Error leaving group:", error);
    }
  };

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
              borderRadius: '32px', 
              position: 'relative', 
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Header / Group Profile */}
            <div style={{ padding: '48px 32px 32px', textAlign: 'center', position: 'relative', background: 'rgba(255,255,255,0.02)' }}>
              <motion.button 
                whileHover={{ rotate: 90, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose} 
                style={{ 
                  position: 'absolute', 
                  top: '24px', 
                  right: '24px', 
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
              
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
                <motion.img 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  src={group.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${group.id}`} 
                  alt={group.name} 
                  style={{ 
                    width: '120px', 
                    height: '120px', 
                    borderRadius: '40px', 
                    objectFit: 'cover', 
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    border: '4px solid rgba(255,255,255,0.05)'
                  }} 
                />
              </div>
              <h2 className="text-gradient" style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em' }}>
                {group.name}
              </h2>
              <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-muted)', fontWeight: '500' }}>
                {group.members?.length || 0} cosmic voyagers
              </p>
            </div>

            {/* Actions */}
            <div style={{ padding: '0 32px 32px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
              {isAdmin && (
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onAddMemberClick}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    padding: '12px 24px', 
                    borderRadius: '16px', 
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid var(--primary)', 
                    color: 'var(--primary)', 
                    fontWeight: '700', 
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  <UserPlus size={18} /> Add Voyager
                </motion.button>
              )}
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLeaveGroup}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '12px 24px', 
                  borderRadius: '16px', 
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.5)', 
                  color: '#ef4444', 
                  fontWeight: '700', 
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                <LogOut size={18} /> Leave Nebula
              </motion.button>
            </div>

            {/* Members List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 32px 40px' }} className="custom-scrollbar">
              <h3 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', marginLeft: '4px' }}>
                The Crew
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {members.map((user, idx) => {
                  const isMemberAdmin = group.admins?.includes(user.uid) || group.createdBy === user.uid;
                  const isMe = user.uid === currentUser?.uid;

                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={user.uid} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '14px', 
                        padding: '12px', 
                        borderRadius: '20px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.03)',
                        position: 'relative'
                      }}
                    >
                      <img 
                        src={user.avatar} 
                        alt={user.name} 
                        style={{ 
                          width: '44px', 
                          height: '44px', 
                          borderRadius: '14px', 
                          objectFit: 'cover',
                          background: 'rgba(255,255,255,0.05)'
                        }} 
                      />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 2px', fontWeight: '700', fontSize: '15px', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {user.name} {isMe && <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500', opacity: 0.7 }}>(You)</span>}
                        </p>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>{user.email}</p>
                      </div>
                      
                      {isMemberAdmin && (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '4px', 
                          background: 'rgba(139, 92, 246, 0.1)', 
                          padding: '4px 10px', 
                          borderRadius: '8px', 
                          border: '1px solid rgba(139, 92, 246, 0.3)' 
                        }}>
                          <Shield size={12} color="var(--primary)" strokeWidth={3} />
                          <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '700' }}>ADMIN</span>
                        </div>
                      )}

                      {isAdmin && !isMe && (
                        <div style={{ position: 'relative' }}>
                          <motion.button 
                            whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.05)' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setOpenedMemberMenuId(openedMemberMenuId === user.uid ? null : user.uid)}
                            style={{ 
                              padding: '8px', 
                              borderRadius: '10px', 
                              border: 'none', 
                              background: 'transparent', 
                              color: 'var(--text-muted)', 
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <MoreVertical size={18} />
                          </motion.button>

                          <AnimatePresence>
                            {openedMemberMenuId === user.uid && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                style={{ 
                                  position: 'absolute', 
                                  right: 0, 
                                  top: '100%', 
                                  zIndex: 100, 
                                  minWidth: '220px', 
                                  padding: '8px', 
                                  borderRadius: '20px',
                                  background: 'rgba(15, 23, 42, 0.95)',
                                  backdropFilter: 'blur(20px)',
                                  boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                                  marginTop: '8px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '4px',
                                  border: '1px solid var(--glass-border)'
                                }}
                              >
                                {isMemberAdmin ? (
                                  <button 
                                    onClick={() => handleUpdateRole(user.uid, false)}
                                    className="glass-hover"
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600' }}
                                  >
                                    <ShieldAlert size={16} /> Dismiss admin
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => handleUpdateRole(user.uid, true)}
                                    className="glass-hover"
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600' }}
                                  >
                                    <ShieldCheck size={16} /> Make admin
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleTransferAdmin(user.uid)}
                                  className="glass-hover"
                                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600' }}
                                >
                                  <ShieldCheck size={16} /> Transfer Ownership
                                </button>
                                <div style={{ height: '1px', background: 'var(--glass-border)', margin: '4px 0' }} />
                                <button 
                                  onClick={() => handleRemoveMember(user.uid)}
                                  className="glass-hover"
                                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600' }}
                                >
                                  <UserMinus size={16} /> Remove from group
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GroupInfoModal;

