import React from 'react';
import { motion } from 'framer-motion';
import { LogIn, Shield, Zap, Globe } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

const Login = ({ onLogin }) => {
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      onLogin({
        uid: user.uid,
        name: user.displayName,
        avatar: user.photoURL,
        email: user.email
      });
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  return (
    <div className="app-container" style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Orbs */}
      <motion.div 
        animate={{ 
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ 
          position: 'absolute', 
          top: '10%', 
          right: '10%', 
          width: '400px', 
          height: '400px', 
          background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)', 
          borderRadius: '50%', 
          filter: 'blur(60px)',
          opacity: 0.4
        }} 
      />
      <motion.div 
        animate={{ 
          x: [0, -80, 0],
          y: [0, 100, 0],
          scale: [1, 1.3, 1]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        style={{ 
          position: 'absolute', 
          bottom: '10%', 
          left: '5%', 
          width: '500px', 
          height: '500px', 
          background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)', 
          borderRadius: '50%', 
          filter: 'blur(80px)',
          opacity: 0.3
        }} 
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel"
        style={{ 
          padding: '60px 40px', 
          width: '90%', 
          maxWidth: '480px', 
          textAlign: 'center',
          position: 'relative',
          zIndex: 10,
          borderRadius: '40px'
        }}
      >
        <motion.div
          initial={{ rotate: -10, scale: 0.5, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          style={{ 
            width: '90px', 
            height: '90px', 
            background: 'linear-gradient(135deg, var(--primary), var(--accent))', 
            borderRadius: '28px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 32px',
            boxShadow: '0 20px 40px rgba(139, 92, 246, 0.3)',
            position: 'relative'
          }}
        >
          <div style={{ position: 'absolute', inset: 0, borderRadius: '28px', background: 'inherit', filter: 'blur(15px)', opacity: 0.5, zIndex: -1 }} />
          <LogIn size={44} color="white" strokeWidth={2.5} />
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gradient"
          style={{ 
            fontSize: '48px', 
            fontWeight: '900', 
            marginBottom: '16px', 
            letterSpacing: '-0.04em',
          }}
        >
          Nebula
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{ 
            color: 'var(--text-muted)', 
            marginBottom: '48px', 
            fontSize: '18px',
            lineHeight: '1.6',
            fontWeight: '400'
          }}
        >
          Experience the next frontier of <br />
          seamless cloud communication.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <motion.button
            whileHover={{ scale: 1.02, translateY: -2, backgroundColor: '#f8fafc' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            style={{ 
              backgroundColor: 'white', 
              color: '#020617', 
              padding: '20px 32px', 
              borderRadius: '20px', 
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '17px',
              transition: 'all 0.2s ease'
            }}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '22px' }} />
            Continue with Google
          </motion.button>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr', 
            gap: '12px', 
            marginTop: '32px',
            padding: '20px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '24px',
            border: '1px solid var(--glass-border)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Shield size={20} color="var(--primary)" />
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Secure</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Zap size={20} color="var(--accent)" />
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fast</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Globe size={20} color="#3b82f6" />
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Global</span>
            </div>
          </div>
        </motion.div>
        
        <p style={{ 
          marginTop: '40px', 
          fontSize: '13px', 
          color: 'rgba(255,255,255,0.3)', 
          fontWeight: '500',
          letterSpacing: '0.01em'
        }}>
          Powered by Advanced Agentic Intelligence
        </p>
      </motion.div>
    </div>
  );
};

export default Login;


