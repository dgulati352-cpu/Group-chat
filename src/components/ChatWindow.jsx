import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, MoreVertical, Phone, Video, Info, Mic, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ChatWindow = ({ activeChat, messages, onSendMessage, onVideoCall, onVoiceCall }) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage({ text: inputValue });
      setInputValue('');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        onSendMessage({ image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        audioChunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          onSendMessage({ audio: reader.result });
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  if (!activeChat) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.1)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{ width: '120px', height: '120px', borderRadius: '40px', background: 'var(--glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid var(--glass-border)' }}>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Smile size={48} color="var(--primary)" />
            </motion.div>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Your Sanctuary for Connection</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '300px', margin: '0 auto' }}>Select a conversation to start messaging your friends and colleagues.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      position: 'relative',
      backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")',
      backgroundColor: 'rgba(2, 6, 23, 0.5)',
      backgroundBlendMode: 'overlay'
    }}>
      {/* Chat Header */}
      <div className="glass" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', zIndex: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img 
            src={activeChat.avatar} 
            alt={activeChat.name} 
            style={{ width: '44px', height: '44px', borderRadius: '12px', objectFit: 'cover' }} 
          />
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{activeChat.name}</h3>
            <p style={{ fontSize: '13px', color: activeChat.online ? 'var(--accent)' : 'var(--text-muted)' }}>
              {activeChat.online ? 'Active Now' : 'Last seen 2h ago'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={onVoiceCall}
            className="glass-hover" 
            style={{ padding: '10px', borderRadius: '10px', color: 'var(--text-muted)' }}
          >
            <Phone size={20} />
          </button>
          <button 
            onClick={onVideoCall}
            className="glass-hover" 
            style={{ padding: '10px', borderRadius: '10px', color: 'var(--text-muted)' }}
          >
            <Video size={20} />
          </button>
          <button className="glass-hover" style={{ padding: '10px', borderRadius: '10px', color: 'var(--text-muted)' }}><Info size={20} /></button>
        </div>
      </div>

      {/* Messages Feed */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <AnimatePresence initial={false}>
          {Array.isArray(messages) && messages.map((msg, index) => (
            <motion.div
              key={msg.id || index}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              style={{ 
                alignSelf: msg?.sender === 'me' ? 'flex-end' : 'flex-start',
                maxWidth: '70%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg?.sender === 'me' ? 'flex-end' : 'flex-start'
              }}
            >
              <div 
                className="glass"
                style={{ 
                  padding: '12px 18px', 
                  borderRadius: msg?.sender === 'me' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  background: msg?.sender === 'me' ? 'var(--primary)' : 'var(--glass)',
                  color: msg?.sender === 'me' ? 'white' : 'var(--text-main)',
                  boxShadow: msg?.sender === 'me' ? '0 4px 15px rgba(139, 92, 246, 0.2)' : 'none',
                  border: msg?.sender === 'me' ? 'none' : '1px solid var(--glass-border)'
                }}
              >
                {msg?.image ? (
                  <img src={msg.image} alt="Sent" style={{ maxWidth: '100%', borderRadius: '12px', marginBottom: '4px' }} />
                ) : msg?.audio ? (
                  <audio controls src={msg.audio} style={{ maxWidth: '240px', height: '40px' }} />
                ) : (
                  <p style={{ fontSize: '15px' }}>{msg?.text || ''}</p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '2px' }}>
                  <span style={{ fontSize: '10px', opacity: 0.7 }}>{msg?.time || ''}</span>
                  {msg?.sender === 'me' && <span style={{ fontSize: '10px', color: 'var(--accent)' }}>✓✓</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Area */}
      <div style={{ padding: '20px 24px', background: 'transparent' }}>
        <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderRadius: '16px' }}>
          <label className="glass-hover" style={{ padding: '10px', borderRadius: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <Paperclip size={20} />
            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          </label>
          <input 
            type="text" 
            placeholder="Type your message..." 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            style={{ flex: 1, background: 'transparent', border: 'none', padding: '10px 4px' }}
          />
          <button 
            className="glass-hover" 
            style={{ padding: '10px', borderRadius: '12px', color: isRecording ? 'var(--danger)' : 'var(--text-muted)' }}
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? <Square size={20} /> : <Mic size={20} />}
          </button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            style={{ 
              backgroundColor: 'var(--primary)', 
              color: 'white', 
              width: '44px', 
              height: '44px', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <Send size={18} />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
