import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Save, User } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose, currentUser, onUpdateProfile }) => {
  const [name, setName] = useState(currentUser?.name || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');

  const handleUpdate = () => {
    onUpdateProfile({ name, avatar });
    onClose();
  };

  const refreshAvatar = () => {
    setAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`);
  };

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
              maxWidth: '400px',
              padding: '32px',
              borderRadius: '24px',
              position: 'relative'
            }}
          >
            <button 
              onClick={onClose}
              style={{ position: 'absolute', top: '20px', right: '20px', color: 'var(--text-muted)' }}
            >
              <X size={24} />
            </button>

            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '32px', textAlign: 'center' }}>Profile Settings</h2>

            <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 12px' }}>
              <img 
                src={avatar} 
                alt="Avatar" 
                style={{ width: '120px', height: '120px', borderRadius: '35px', border: '3px solid var(--primary)', padding: '4px', objectFit: 'cover' }} 
              />
              <label 
                style={{ 
                  position: 'absolute', 
                  bottom: '-5px', 
                  right: '-5px', 
                  backgroundColor: 'var(--primary)', 
                  color: 'white', 
                  padding: '10px', 
                  borderRadius: '12px',
                  boxShadow: '0 4px 10px rgba(139, 92, 246, 0.4)',
                  cursor: 'pointer'
                }}
              >
                <Camera size={20} />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => setAvatar(reader.result);
                      reader.readAsDataURL(file);
                    }
                  }} 
                  style={{ display: 'none' }} 
                />
              </label>
            </div>
            
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <button 
                onClick={refreshAvatar}
                style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}
              >
                Shuffle Avatar
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', color: 'var(--text-muted)', marginLeft: '4px' }}>Display Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  style={{ width: '100%' }}
                />
              </div>

              <button 
                onClick={handleUpdate}
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
                  marginTop: '12px'
                }}
              >
                <Save size={20} /> Save Changes
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;
