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
      background: 'radial-gradient(circle at top right, #1e1b4b, #020617, #000000)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative Orbs */}
      <div style={{ position: 'absolute', top: '10%', right: '10%', width: '300px', height: '300px', background: 'rgba(139, 92, 246, 0.15)', borderRadius: '50%', filter: 'blur(80px)' }} />
      <div style={{ position: 'absolute', bottom: '10%', left: '10%', width: '400px', height: '400px', background: 'rgba(45, 212, 191, 0.1)', borderRadius: '50%', filter: 'blur(100px)' }} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass"
        style={{ 
          padding: '48px', 
          borderRadius: '32px', 
          width: '90%', 
          maxWidth: '440px', 
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 10
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 4 }}
          style={{ 
            width: '80px', 
            height: '80px', 
            background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', 
            borderRadius: '24px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 24px',
            boxShadow: '0 10px 20px rgba(139, 92, 246, 0.3)'
          }}
        >
          <LogIn size={40} color="white" />
        </motion.div>

        <h1 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '12px', letterSpacing: '-0.02em', background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Nebula
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '40px', fontSize: '16px' }}>
          The next generation of cloud communication.
        </p>

        <motion.button
          whileHover={{ scale: 1.02, translateY: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGoogleLogin}
          style={{ 
            backgroundColor: 'white', 
            color: '#0f172a', 
            padding: '16px 24px', 
            borderRadius: '16px', 
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            width: '100%',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '20px' }} />
          Continue with Google
        </motion.button>
        
        <p style={{ marginTop: '32px', fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: '400' }}>
          Secure • Encrypted • Premium
        </p>
      </motion.div>
    </div>
  );
};

export default Login;

