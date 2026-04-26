import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Maximize2 } from 'lucide-react';

const CallModal = ({ isIncoming, caller, onAccept, onReject, onEnd, localStream, remoteStream, isVideo }) => {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(!isVideo);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => (track.enabled = !track.enabled));
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => (track.enabled = !track.enabled));
      setIsCameraOff(!isCameraOff);
    }
  };

  return (
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
        backgroundColor: 'rgba(2, 6, 23, 0.95)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(20px)'
      }}
    >
      {/* Background Glow */}
      <div style={{ position: 'absolute', width: '600px', height: '600px', background: 'var(--primary)', filter: 'blur(150px)', opacity: 0.1, zIndex: 0 }} />

      <div style={{ position: 'relative', width: '90%', maxWidth: '1000px', height: '80%', display: 'flex', flexDirection: 'column', gap: '24px', zIndex: 1 }}>
        
        {/* Video Area */}
        <div className="glass" style={{ flex: 1, borderRadius: '32px', overflow: 'hidden', position: 'relative', background: '#000' }}>
          {/* Always keep the video element in the DOM to maintain the stream connection */}
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              display: (remoteStream && remoteStream.getVideoTracks().length > 0) ? 'block' : 'none'
            }} 
          />

          {!(remoteStream && remoteStream.getVideoTracks().length > 0) && (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <motion.img 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                src={caller?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Call'} 
                style={{ width: '150px', height: '150px', borderRadius: '50%', border: '4px solid var(--primary)', padding: '8px' }} 
              />
              <h2 style={{ marginTop: '24px', fontSize: '24px', fontWeight: '700' }}>
                {remoteStream ? 'Voice Call Connected' : (isIncoming ? `Incoming Call from ${caller?.name}` : `Calling ${caller?.name}...`)}
              </h2>
              {!remoteStream && !isIncoming && (
                <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Waiting for response...</p>
              )}
              {!remoteStream && isIncoming && (
                <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Connecting...</p>
              )}
            </div>
          )}

          {/* Local Preview */}
          <div className="glass" style={{ position: 'absolute', bottom: '24px', right: '24px', width: '200px', height: '150px', borderRadius: '20px', overflow: 'hidden', border: '2px solid var(--glass-border)' }}>
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
            />
            {isCameraOff && (
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <VideoOff size={32} color="var(--text-muted)" />
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', paddingBottom: '20px' }}>
          {isIncoming && !remoteStream ? (
            <>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onAccept}
                style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Phone size={28} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onReject}
                style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'var(--danger)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <PhoneOff size={28} />
              </motion.button>
            </>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleMute}
                className="glass-hover"
                style={{ width: '60px', height: '60px', borderRadius: '50%', color: isMuted ? 'var(--danger)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleCamera}
                className="glass-hover"
                style={{ width: '60px', height: '60px', borderRadius: '50%', color: isCameraOff ? 'var(--danger)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {isCameraOff ? <VideoOff size={24} /> : <Video size={24} />}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1, rotate: 135 }}
                whileTap={{ scale: 0.9 }}
                onClick={onEnd}
                style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--danger)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <PhoneOff size={24} />
              </motion.button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CallModal;
