import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Maximize2, User, Volume2, Shield } from 'lucide-react';

const CallModal = ({ isIncoming, caller, onAccept, onReject, onEnd, localStream, remoteStream, isVideo, call }) => {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(!isVideo);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    console.log("CallModal Streams Update:", { 
      local: localStream?.id, 
      localTracks: localStream?.getTracks().length,
      remote: remoteStream?.id,
      remoteTracks: remoteStream?.getTracks().length,
      isVideo
    });
  }, [localStream, remoteStream, isVideo]);

  useEffect(() => {
    let interval;
    if (remoteStream) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [remoteStream]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  const hasRemoteVideo = remoteStream && remoteStream.getVideoTracks().some(t => t.enabled);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: '#020617',
          zIndex: 5000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        {/* Immersive Animated Background */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, -30, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            style={{ position: 'absolute', width: '800px', height: '800px', background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)', filter: 'blur(120px)', opacity: 0.15, top: '-200px', left: '-200px' }} 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              x: [0, -60, 0],
              y: [0, 40, 0]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            style={{ position: 'absolute', width: '700px', height: '700px', background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)', filter: 'blur(120px)', opacity: 0.1, bottom: '-150px', right: '-150px' }} 
          />
        </div>

        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '40px', zIndex: 1 }}>
          
          {/* Header Info */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="glass-panel" style={{ padding: '8px 16px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={14} color="var(--accent)" />
                <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent)', letterSpacing: '0.05em' }}>ENCRYPTED</span>
              </div>
              {remoteStream && (
                <div className="glass-panel" style={{ padding: '8px 16px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)' }} />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'white', fontVariantNumeric: 'tabular-nums' }}>{formatDuration(callDuration)}</span>
                </div>
              )}
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '2px' }}>NEBULA TRANSMISSION</p>
              <p className="text-gradient" style={{ fontSize: '18px', fontWeight: '800' }}>{isVideo ? 'VIDEO LINK' : 'VOICE FREQUENCY'}</p>
            </div>
          </motion.div>

          {/* Main Call Area */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            
            <div 
              className="glass-panel" 
              style={{ 
                width: '100%', 
                height: '100%', 
                borderRadius: '40px', 
                overflow: 'hidden', 
                position: 'relative', 
                background: 'rgba(15, 23, 42, 0.4)',
                boxShadow: '0 50px 100px rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {/* Remote Stream Video */}
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  display: hasRemoteVideo ? 'block' : 'none',
                  opacity: hasRemoteVideo ? 1 : 0,
                  transition: 'opacity 0.5s ease'
                }} 
              />

              {/* No Video Placeholder */}
              {!hasRemoteVideo && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      style={{ position: 'absolute', inset: '-30px', background: 'var(--primary)', borderRadius: '50%', filter: 'blur(40px)' }}
                    />
                    <motion.img 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      src={caller?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Call'} 
                      style={{ width: '180px', height: '180px', borderRadius: '60px', position: 'relative', zIndex: 1, boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '2px solid rgba(255,255,255,0.1)' }} 
                    />
                    {remoteStream && (
                       <motion.div
                        animate={{ height: [10, 30, 15], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        style={{ position: 'absolute', bottom: '-40px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px', alignItems: 'flex-end' }}
                       >
                         {[1,2,3,4,5].map(i => (
                           <motion.div 
                            key={i}
                            animate={{ height: [10, 20 + Math.random() * 20, 10] }}
                            transition={{ duration: 0.5 + Math.random(), repeat: Infinity }}
                            style={{ width: '4px', background: 'var(--accent)', borderRadius: '2px' }} 
                           />
                         ))}
                       </motion.div>
                    )}
                  </div>
                  
                  <motion.h2 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    style={{ marginTop: '60px', fontSize: '32px', fontWeight: '800', color: 'white', letterSpacing: '-0.03em' }}
                  >
                    {remoteStream ? caller?.name : (isIncoming ? `Incoming Call...` : `Initiating Link...`)}
                  </motion.h2>
                  
                  {!remoteStream && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '18px', fontWeight: '600', marginTop: '12px' }}>
                      {call?.status === 'connecting' 
                        ? 'Requesting Camera/Mic access...' 
                        : isIncoming ? `from ${caller?.name}` : `Searching for ${caller?.name}`}
                    </p>
                  )}
                </div>
              )}

              {/* Local Stream Preview */}
              <motion.div 
                layout
                className="glass-panel" 
                style={{ 
                  position: 'absolute', 
                  bottom: '32px', 
                  right: '32px', 
                  width: '240px', 
                  height: '180px', 
                  borderRadius: '24px', 
                  overflow: 'hidden', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                  background: '#000'
                }}
              >
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
                />
                {isCameraOff && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <VideoOff size={24} color="var(--text-muted)" />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>CAMERA OFF</span>
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Controls Bar */}
          <motion.div 
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}
          >
            <div 
              className="glass-panel" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '24px', 
                padding: '16px 32px', 
                borderRadius: '30px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              {isIncoming && !remoteStream ? (
                <div style={{ display: 'flex', gap: '24px' }}>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onAccept}
                    style={{ 
                      width: '72px', 
                      height: '72px', 
                      borderRadius: '50%', 
                      backgroundColor: 'var(--accent)', 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)'
                    }}
                  >
                    <Phone size={32} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onReject}
                    style={{ 
                      width: '72px', 
                      height: '72px', 
                      borderRadius: '50%', 
                      backgroundColor: 'var(--danger)', 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 0 30px rgba(239, 68, 68, 0.4)'
                    }}
                  >
                    <PhoneOff size={32} />
                  </motion.button>
                </div>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.1, background: isMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.1)' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleMute}
                    style={{ 
                      width: '60px', 
                      height: '60px', 
                      borderRadius: '20px', 
                      background: isMuted ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)',
                      color: isMuted ? 'var(--danger)' : 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1, background: isCameraOff ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.1)' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleCamera}
                    style={{ 
                      width: '60px', 
                      height: '60px', 
                      borderRadius: '20px', 
                      background: isCameraOff ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)',
                      color: isCameraOff ? 'var(--danger)' : 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {isCameraOff ? <VideoOff size={24} /> : <Video size={24} />}
                  </motion.button>

                  <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.1)' }} />

                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 135 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onEnd}
                    style={{ 
                      width: '64px', 
                      height: '64px', 
                      borderRadius: '50%', 
                      backgroundColor: 'var(--danger)', 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 0 30px rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    <PhoneOff size={24} />
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CallModal;

