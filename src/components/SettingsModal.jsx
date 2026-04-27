import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Save, User, RefreshCw } from 'lucide-react';

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
            backgroundColor: 'rgba(2, 6, 23, 0.85)',
            backdropFilter: 'blur(12px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '440px',
              padding: '40px',
              borderRadius: '32px',
              position: 'relative',
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
              marginBottom: '40px', 
              textAlign: 'center',
              letterSpacing: '-0.02em'
            }}>
              Profile Settings
            </h2>

            <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto 16px' }}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                style={{ position: 'relative' }}
              >
                <img 
                  src={avatar} 
                  alt="Avatar" 
                  style={{ 
                    width: '140px', 
                    height: '140px', 
                    borderRadius: '45px', 
                    border: '4px solid var(--primary)', 
                    padding: '6px', 
                    objectFit: 'cover',
                    background: 'rgba(255,255,255,0.05)'
                  }} 
                />
                <label 
                  style={{ 
                    position: 'absolute', 
                    bottom: '5px', 
                    right: '5px', 
                    backgroundColor: 'var(--primary)', 
                    color: 'white', 
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '16px',
                    boxShadow: '0 8px 20px rgba(139, 92, 246, 0.4)',
                    cursor: 'pointer',
                    border: '3px solid #1e1b4b'
                  }}
                >
                  <Camera size={22} />
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
              </motion.div>
            </div>
            
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <motion.button 
                whileHover={{ scale: 1.05, color: 'white' }}
                whileTap={{ scale: 0.95 }}
                onClick={refreshAvatar}
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid var(--glass-border)', 
                  color: 'var(--text-muted)', 
                  fontSize: '13px', 
                  cursor: 'pointer', 
                  fontWeight: '600',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  margin: '0 auto'
                }}
              >
                <RefreshCw size={14} /> Shuffle Avatar
              </motion.button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', marginLeft: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Display Name
                </label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
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

              <motion.button 
                whileHover={{ scale: 1.02, translateY: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUpdate}
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
                  cursor: 'pointer',
                  fontSize: '16px',
                  boxShadow: '0 15px 30px rgba(139, 92, 246, 0.3)'
                }}
              >
                <Save size={20} /> Save Changes
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;

