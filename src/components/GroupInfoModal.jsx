import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, UserMinus, ShieldAlert, ShieldCheck, MoreVertical, LogOut } from 'lucide-react';
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
      alert("Failed to update role");
    }
  };

  const handleTransferAdmin = async (memberUid) => {
    if (!window.confirm("Are you sure you want to transfer admin rights to this member? You will no longer be an admin.")) return;
    try {
      const groupRef = doc(db, 'groups', group.id);
      // Ensure the new person is an admin and transfer ownership in one call
      await updateDoc(groupRef, {
        admins: arrayUnion(memberUid),
        createdBy: memberUid
      });
      // Remove current user from admins in a separate call (as same field cannot be updated twice in one updateDoc)
      await updateDoc(groupRef, {
        admins: arrayRemove(currentUser.uid)
      });
      setOpenedMemberMenuId(null);
    } catch (error) {
      console.error("Error transferring admin:", error);
      alert("Failed to transfer admin rights");
    }
  };

  const handleRemoveMember = async (memberUid) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
      const groupRef = doc(db, 'groups', group.id);
      await updateDoc(groupRef, {
        members: arrayRemove(memberUid),
        admins: arrayRemove(memberUid) // Also remove from admins if they were one
      });
      setOpenedMemberMenuId(null);
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Failed to remove member");
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'absolute', inset: 0, background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(12px)' }}
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="glass"
            style={{ 
              width: '100%', 
              maxWidth: '450px', 
              maxHeight: '90vh',
              borderRadius: '28px', 
              position: 'relative', 
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header / Group Profile */}
            <div style={{ padding: '40px 24px 24px', textAlign: 'center', position: 'relative', background: 'rgba(255,255,255,0.02)' }}>
              <button 
                onClick={onClose} 
                style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', padding: '8px', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
              
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
                <img 
                  src={group.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${group.id}`} 
                  alt={group.name} 
                  style={{ width: '100px', height: '100px', borderRadius: '32px', objectFit: 'cover', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }} 
                />
              </div>
              <h2 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>{group.name}</h2>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>{group.members?.length || 0} members</p>
            </div>

            {/* Actions */}
            <div style={{ padding: '0 24px 24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
              {isAdmin && (
                <button 
                  onClick={onAddMemberClick}
                  className="glass-hover"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '14px', border: '1px solid var(--glass-border)', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }}
                >
                  <UserPlus size={18} /> Add Member
                </button>
              )}
              <button 
                onClick={handleLeaveGroup}
                className="glass-hover"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '14px', border: '1px solid var(--glass-border)', color: '#ef4444', fontWeight: '600', cursor: 'pointer' }}
              >
                <LogOut size={18} /> Leave
              </button>
            </div>

            {/* Members List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 80px' }} className="custom-scrollbar">
              <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Participants</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {members.map(user => {
                  const isMemberAdmin = group.admins?.includes(user.uid) || group.createdBy === user.uid;
                  const isMe = user.uid === currentUser?.uid;

                  return (
                    <div 
                      key={user.uid} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        padding: '12px', 
                        borderRadius: '16px',
                        position: 'relative'
                      }}
                    >
                      <img src={user.avatar} alt={user.name} style={{ width: '44px', height: '44px', borderRadius: '14px', objectFit: 'cover' }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: '600', fontSize: '15px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {user.name} {isMe && <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '400' }}>(You)</span>}
                        </p>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{user.email}</p>
                      </div>
                      
                      {isMemberAdmin && (
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--primary)', color: 'var(--primary)', fontWeight: '500' }}>Admin</span>
                      )}

                      {isAdmin && !isMe && (
                        <div style={{ position: 'relative' }}>
                          <button 
                            onClick={() => setOpenedMemberMenuId(openedMemberMenuId === user.uid ? null : user.uid)}
                            className="glass-hover" 
                            style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
                          >
                            <MoreVertical size={18} />
                          </button>

                          <AnimatePresence>
                            {openedMemberMenuId === user.uid && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                className="glass"
                                style={{ 
                                  position: 'absolute', 
                                  right: 0, 
                                  top: '100%', 
                                  zIndex: 100, 
                                  minWidth: '200px', 
                                  padding: '6px', 
                                  borderRadius: '18px',
                                  boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                                  marginTop: '8px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '2px',
                                  border: '1px solid var(--glass-border)'
                                }}
                              >
                                {isMemberAdmin ? (
                                  <button 
                                    onClick={() => handleUpdateRole(user.uid, false)}
                                    className="glass-hover"
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}
                                  >
                                    <ShieldAlert size={16} /> Dismiss as admin
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => handleUpdateRole(user.uid, true)}
                                    className="glass-hover"
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}
                                  >
                                    <ShieldCheck size={16} /> Make group admin
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleTransferAdmin(user.uid)}
                                  className="glass-hover"
                                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}
                                >
                                  <ShieldCheck size={16} /> Transfer Admin
                                </button>
                                <button 
                                  onClick={() => handleRemoveMember(user.uid)}
                                  className="glass-hover"
                                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}
                                >
                                  <UserMinus size={16} /> Remove from group
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
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
