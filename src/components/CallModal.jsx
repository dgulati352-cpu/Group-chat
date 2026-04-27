import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Shield, User } from 'lucide-react';

const CallModal = ({ isIncoming, caller, onAccept, onReject, onEnd, localStream, remoteStream, isVideo, call }) => {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(!isVideo);
  const [callDuration, setCallDuration] = useState(0);

  // Debugging logs
  useEffect(() => {
    console.log("CallModal State:", { isIncoming, callerName: caller?.displayName, hasRemote: !!remoteStream });
  }, [isIncoming, caller, remoteStream]);

  // Video stream effects
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

  // Duration timer
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

  const [isAccepting, setIsAccepting] = useState(false);

  const handleAccept = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (isAccepting) return;
    console.log("CallModal: handleAccept triggered");
    setIsAccepting(true);
    try {
      await onAccept();
    } catch (error) {
      console.error("Accept failed:", error);
      setIsAccepting(false);
    }
  };

  const handleReject = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log("CallModal: handleReject triggered");
    if (onReject) onReject();
  };

  const handleEnd = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log("CallModal: handleEnd triggered");
    if (onEnd) onEnd();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999, // Super high
        backgroundColor: '#020617',
        color: '#fff',
        fontFamily: "'Outfit', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        pointerEvents: 'auto'
      }}
    >
      {/* Immersive Animated Background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.5 }}>
        <motion.div 
          animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity }}
          style={{ position: 'absolute', width: '1000px', height: '1000px', background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', filter: 'blur(120px)', top: '-300px', left: '-300px' }} 
        />
        <motion.div 
          animate={{ opacity: [0.05, 0.2, 0.05], scale: [1, 1.2, 1] }}
          transition={{ duration: 15, repeat: Infinity }}
          style={{ position: 'absolute', width: '900px', height: '900px', background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)', filter: 'blur(120px)', bottom: '-250px', right: '-250px' }} 
        />
      </div>

      {/* Video Content Layer */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
        {remoteStream && (
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        )}

        {/* Local Stream PIP */}
        <motion.div
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          style={{
            position: 'absolute',
            top: '32px',
            right: '32px',
            width: '200px',
            height: '280px',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            border: '2px solid rgba(255,255,255,0.1)',
            zIndex: 50,
            backgroundColor: '#000',
            pointerEvents: 'auto'
          }}
        >
          {localStream && !isCameraOff ? (
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', gap: '12px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={30} color="rgba(255,255,255,0.5)" />
              </div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>CAMERA OFF</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* UI Interaction Layer */}
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        zIndex: 100, // Higher priority
        display: 'flex', 
        flexDirection: 'column',
        pointerEvents: 'none'
      }}>
        {/* Top Navigation / Status */}
        <div style={{ padding: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              padding: '8px 16px', 
              borderRadius: '12px', 
              background: 'rgba(255,255,255,0.06)', 
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Shield size={16} color="#a855f7" />
              <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '1px', color: '#a855f7' }}>SECURE LINK</span>
            </div>
            {remoteStream && (
              <div style={{ 
                padding: '8px 16px', 
                borderRadius: '12px', 
                background: 'rgba(255,255,255,0.06)', 
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '700',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {formatDuration(callDuration)}
              </div>
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '12px', fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: '2px', marginBottom: '4px' }}>TRANSMISSION</p>
            <p style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>{isVideo ? 'ULTRA-HD VIDEO' : 'VOICE FREQUENCY'}</p>
          </div>
        </div>

        {/* Center Content (Avatar/Info) */}
        {!remoteStream && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '32px', pointerEvents: 'auto' }}>
            <motion.div
              animate={{ boxShadow: ['0 0 0px rgba(99,102,241,0)', '0 0 60px rgba(99,102,241,0.3)', '0 0 0px rgba(99,102,241,0)'] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{
                width: '180px',
                height: '180px',
                borderRadius: '60px',
                padding: '6px',
                background: 'linear-gradient(45deg, #6366f1, #a855f7)',
                position: 'relative'
              }}
            >
              <img 
                src={caller?.photoURL || `https://ui-avatars.com/api/?name=${caller?.displayName}&size=200&background=6366f1&color=fff`}
                alt=""
                style={{ width: '100%', height: '100%', borderRadius: '54px', objectFit: 'cover', border: '4px solid #020617' }}
              />
              {isIncoming && (
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ position: 'absolute', inset: -20, borderRadius: '80px', border: '2px solid #6366f1' }}
                />
              )}
            </motion.div>
            
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: '48px', fontWeight: '800', color: '#fff', marginBottom: '8px', letterSpacing: '-1px' }}>
                {caller?.displayName}
              </h1>
              <p style={{ fontSize: '20px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px' }}>
                {isAccepting ? 'CONNECTING...' : (isIncoming ? 'INCOMING CALL' : 'INITIATING LINK...')}
              </p>
            </div>
          </div>
        )}

        {/* Bottom Controls Bar */}
        <div style={{
          position: 'absolute',
          bottom: '60px',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '40px',
          zIndex: 1000,
          pointerEvents: 'auto'
        }}>
          {isIncoming && !remoteStream ? (
            <>
              {/* Reject Button */}
              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.3)' }}
                whileTap={{ scale: 0.9 }}
                onClick={handleReject}
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 10px 30px rgba(239, 68, 68, 0.2)',
                  pointerEvents: 'auto'
                }}
              >
                <PhoneOff size={36} strokeWidth={2.5} />
              </motion.button>

              {/* Accept Button */}
              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(34, 197, 94, 0.3)' }}
                whileTap={{ scale: 0.9 }}
                onClick={handleAccept}
                disabled={isAccepting}
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: isAccepting ? 'rgba(34, 197, 94, 0.5)' : 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.5)',
                  color: '#22c55e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isAccepting ? 'wait' : 'pointer',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 10px 30px rgba(34, 197, 94, 0.2)',
                  opacity: isAccepting ? 0.7 : 1,
                  pointerEvents: 'auto'
                }}
              >
                {isAccepting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    {isVideo ? <Video size={36} /> : <Phone size={36} />}
                  </motion.div>
                ) : (
                  isVideo ? <Video size={36} strokeWidth={2.5} fill="#22c55e" /> : <Phone size={36} strokeWidth={2.5} fill="#22c55e" />
                )}
              </motion.button>
            </>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              padding: '16px 32px',
              borderRadius: '40px',
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}>
              {/* Mute Toggle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleMute}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '20px',
                  background: isMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
                  border: 'none',
                  color: isMuted ? '#ef4444' : '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </motion.button>

              {/* End Call Button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 135 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleEnd}
                style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 10px 30px rgba(239, 68, 68, 0.4)',
                  pointerEvents: 'auto'
                }}
              >
                <PhoneOff size={32} strokeWidth={2.5} />
              </motion.button>

              {/* Camera Toggle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleCamera}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '20px',
                  background: isCameraOff ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
                  border: 'none',
                  color: isCameraOff ? '#ef4444' : '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isCameraOff ? <VideoOff size={24} /> : <Video size={24} />}
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CallModal;
