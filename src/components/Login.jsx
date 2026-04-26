import React from 'react';
import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';
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
      alert("Failed to sign in with Google. Please try again.");
    }
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'radial-gradient(circle at top right, #1e1b4b, #020617)'
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass"
        style={{ padding: '40px var(--side-padding, 40px)', borderRadius: '24px', width: '90%', maxWidth: '400px', textAlign: 'center' }}
      >
        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', background: 'linear-gradient(to right, #8b5cf6, #2dd4bf)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Nebula Chat
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Experience premium cloud messaging</p>

        <div style={{ marginBottom: '32px', fontSize: '64px' }}>🌌</div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleGoogleLogin}
          style={{ 
            backgroundColor: 'white', 
            color: '#1f2937', 
            padding: '14px 24px', 
            borderRadius: '12px', 
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            width: '100%',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '18px' }} />
          Sign in with Google
        </motion.button>
        
        <p style={{ marginTop: '24px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
          By joining, you agree to our Terms of Service.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;

