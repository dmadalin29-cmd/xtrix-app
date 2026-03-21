import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Users, Eye, Heart, MessageCircle, X, Send, Gift, BadgeCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { liveAPI, giftsAPI } from '../services/api';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import Hls from 'hls.js';

const LivePage = () => {
  const { isAuthenticated, user } = useAuth();
  const [streams, setStreams] = useState([]);
  const [selectedStream, setSelectedStream] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveStreams();
    // Refresh every 10 seconds
    const interval = setInterval(fetchActiveStreams, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveStreams = async () => {
    try {
      const res = await liveAPI.getActiveStreams();
      setStreams(res.data || []);
    } catch (err) {
      console.error('Fetch streams error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight font-display">LIVE</h1>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white font-body" style={{ background: '#ff0050' }}>
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            {streams.length} Live Acum
          </span>
        </div>
        <p className="text-base sm:text-lg text-white/40 font-body">Urmărește live stream-uri de la creatorii tăi preferați</p>
      </motion.div>

      {/* Live Stream Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-10 h-10 mx-auto rounded-xl animate-spin" style={{ background: 'linear-gradient(135deg, #ff0050, #ff3366)', WebkitMaskImage: 'conic-gradient(transparent 30%, black)' }} />
        </div>
      ) : streams.length === 0 ? (
        <div className="text-center py-20">
          <Radio className="w-16 h-16 text-white/10 mx-auto mb-4" />
          <p className="text-white/40">Niciun stream live momentan</p>
          <p className="text-xs text-white/20 mt-2">Fii primul care merge LIVE!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {streams.map((stream, i) => (
            <motion.div
              key={stream.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ scale: 1.02, y: -4 }}
              onClick={() => setSelectedStream(stream)}
              className="group relative rounded-2xl overflow-hidden cursor-pointer"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="aspect-video relative bg-black">
                {/* Placeholder thumbnail */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-pink-900/30" />
                
                {/* LIVE badge */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold text-white" style={{ background: '#ff0050' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                  </span>
                  <span className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-white/80" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}>
                    <Eye className="w-3 h-3" /> {stream.viewers}
                  </span>
                </div>

                {/* User info */}
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Avatar className="w-8 h-8 ring-2 ring-[#ff0050]">
                      <AvatarImage src={stream.user.avatar} />
                      <AvatarFallback>{stream.user.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-white">{stream.user.username}</span>
                        {stream.user.verified && <BadgeCheck className="w-3.5 h-3.5 text-[#00f5d4]" />}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-white/80 font-medium">{stream.title}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Stream Viewer Modal */}
      {selectedStream && <StreamViewer stream={selectedStream} onClose={() => setSelectedStream(null)} />}
    </div>
  );
};

// Flying Gift Animation Component
const FlyingGift = ({ gift, onComplete }) => {
  const startX = Math.random() * 60 + 20; // 20-80% from left
  const startY = Math.random() * 40 + 30; // 30-70% from top
  
  return (
    <motion.div
      initial={{ 
        x: `${startX}vw`, 
        y: `${startY}vh`, 
        scale: 0, 
        opacity: 0,
        rotate: 0 
      }}
      animate={{ 
        x: [`${startX}vw`, `${startX + 20}vw`, `${startX - 10}vw`],
        y: [`${startY}vh`, `${startY - 40}vh`, `${startY - 60}vh`],
        scale: [0, 2.5, 3, 2],
        opacity: [0, 1, 1, 0],
        rotate: [0, 15, -10, 0]
      }}
      transition={{ 
        duration: 2.5,
        times: [0, 0.3, 0.7, 1],
        ease: "easeOut"
      }}
      onAnimationComplete={onComplete}
      className="fixed pointer-events-none z-[200]"
      style={{
        filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.8))',
      }}
    >
      <div className="relative">
        <div className="text-7xl">{gift.icon}</div>
        {/* Glow effect */}
        <div className="absolute inset-0 blur-2xl opacity-70" style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.6), transparent)' }} />
        {/* Sparkles */}
        <motion.div
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.8, 0.3, 0.8]
          }}
          transition={{ 
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-4 -right-4 text-3xl"
        >
          ✨
        </motion.div>
        <motion.div
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.8, 0.4, 0.8]
          }}
          transition={{ 
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3
          }}
          className="absolute -bottom-4 -left-4 text-2xl"
        >
          ✨
        </motion.div>
      </div>
      {/* Gift name and cost floating */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: [0, 1, 1, 0], y: [10, 0, -5, -10] }}
        transition={{ duration: 2.5 }}
        className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center whitespace-nowrap"
      >
        <p className="text-xl font-bold text-white drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]">
          {gift.name}
        </p>
        <p className="text-sm font-semibold text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.6)]">
          {gift.cost} coins
        </p>
      </motion.div>
    </motion.div>
  );
};

// Stream Viewer Component with HLS Player
const StreamViewer = ({ stream, onClose }) => {
  const { isAuthenticated, user, requireAuth } = useAuth();
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showGifts, setShowGifts] = useState(false);
  const [gifts, setGifts] = useState([]);
  const [currentViewers, setCurrentViewers] = useState(stream.viewers);
  const [flyingGifts, setFlyingGifts] = useState([]);

  useEffect(() => {
    // Join stream
    liveAPI.joinStream(stream.id).catch(console.error);

    // Load HLS stream
    if (Hls.isSupported() && videoRef.current) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;
      
      const streamUrl = `${process.env.REACT_APP_BACKEND_URL}/api/live/${stream.id}/stream.m3u8`;
      hls.loadSource(streamUrl);
      hls.attachMedia(videoRef.current);
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data);
      });
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      videoRef.current.src = `${process.env.REACT_APP_BACKEND_URL}/api/live/${stream.id}/stream.m3u8`;
    }

    // Fetch gifts
    giftsAPI.getAll().then(res => setGifts(res.data || [])).catch(console.error);

    // Poll chat
    const chatInterval = setInterval(async () => {
      try {
        const res = await liveAPI.getChat(stream.id);
        setChatMessages(res.data || []);
      } catch (err) {
        console.error('Chat poll error:', err);
      }
    }, 3000);

    return () => {
      // Leave stream
      liveAPI.leaveStream(stream.id).catch(console.error);
      
      // Cleanup HLS
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      
      clearInterval(chatInterval);
    };
  }, [stream.id]);

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    requireAuth(async () => {
      try {
        await liveAPI.sendChat(stream.id, chatInput);
        setChatInput('');
      } catch (err) {
        console.error('Send chat error:', err);
      }
    });
  };

  const sendGift = async (gift) => {
    requireAuth(async () => {
      try {
        await giftsAPI.send(stream.user.id, gift._id, stream.id);
        setShowGifts(false);
        
        // Trigger flying animation
        const giftId = Date.now() + Math.random();
        setFlyingGifts(prev => [...prev, { ...gift, animationId: giftId }]);
        
        // Remove after animation completes
        setTimeout(() => {
          setFlyingGifts(prev => prev.filter(g => g.animationId !== giftId));
        }, 2600);
      } catch (err) {
        alert(err.response?.data?.detail || 'Eroare la trimiterea cadoului');
      }
    });
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black">
      {/* Flying Gifts Animations */}
      <AnimatePresence>
        {flyingGifts.map((gift) => (
          <FlyingGift
            key={gift.animationId}
            gift={gift}
            onComplete={() => {}}
          />
        ))}
      </AnimatePresence>

      {/* Close Button - Top Right Corner */}
      <button 
        onClick={onClose} 
        className="absolute top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors z-[1000]"
        style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
      >
        <X className="w-6 h-6 text-white" />
      </button>
      
      {/* Main Content - Full Screen Split Layout */}
      <div className="w-full h-full flex">
        {/* Left: Video Player (70%) */}
        <div className="w-[70%] flex flex-col p-8 pr-4">
          {/* Video Container */}
          <div className="flex-1 rounded-3xl overflow-hidden relative" style={{ background: 'rgba(20,20,30,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <video ref={videoRef} autoPlay playsInline controls className="w-full h-full object-contain" />
            
            {/* Live Badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: '#ff0050' }}>
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> LIVE
              </span>
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-white/80" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }}>
                <Eye className="w-3.5 h-3.5" /> {currentViewers}
              </span>
            </div>
          </div>

          {/* Stream Info Bar */}
          <div className="mt-4 p-4 rounded-xl flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 ring-2 ring-[#ff0050]">
                <AvatarImage src={stream.user.avatar} />
                <AvatarFallback>{stream.user.displayName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-white">{stream.user.displayName}</p>
                  {stream.user.verified && <BadgeCheck className="w-4 h-4 text-[#00f5d4]" />}
                </div>
                <p className="text-xs text-white/40">{stream.title}</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-5 py-2 rounded-full text-sm font-bold text-white"
              style={{ background: '#ff0050' }}
            >
              Follow
            </motion.button>
          </div>
        </div>

        {/* Right Sidebar - Chat & Gifts */}
        <div className="w-[400px] flex flex-col flex-shrink-0">
          <div className="flex-1 flex flex-col rounded-2xl overflow-hidden" style={{ background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {/* Tabs */}
            <div className="flex border-b border-white/[0.06] flex-shrink-0">
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  console.log('Chat tab clicked, setting showGifts to false');
                  setShowGifts(false); 
                }}
                className={`flex-1 py-3 text-sm font-semibold transition-colors font-body ${!showGifts ? 'text-white border-b-2 border-[#ff0050]' : 'text-white/40'}`}
              >
                <MessageCircle className="w-4 h-4 inline mr-2" />
                Chat
              </button>
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  console.log('Cadouri tab clicked, setting showGifts to true, gifts count:', gifts.length);
                  setShowGifts(true); 
                }}
                className={`flex-1 py-3 text-sm font-semibold transition-colors font-body ${showGifts ? 'text-white border-b-2 border-[#ff0050]' : 'text-white/40'}`}
              >
                <Gift className="w-4 h-4 inline mr-2" />
                Cadouri
              </button>
            </div>

          <div className="flex-1 overflow-hidden">
          {console.log('Rendering panel, showGifts:', showGifts)}
          {!showGifts ? (
            <LiveChat streamId={stream.id} />
          ) : (
            <GiftPanel gifts={gifts} onSend={sendGift} />
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Live Chat Component
const LiveChat = ({ streamId }) => {
  const { isAuthenticated, requireAuth } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    const pollChat = setInterval(async () => {
      try {
        const res = await liveAPI.getChat(streamId);
        setMessages(res.data || []);
      } catch (err) {
        console.error('Chat error:', err);
      }
    }, 2000);

    return () => clearInterval(pollChat);
  }, [streamId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    requireAuth(async () => {
      try {
        await liveAPI.sendChat(streamId, input);
        setInput('');
      } catch (err) {
        console.error('Send error:', err);
      }
    });
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-xs text-white/30 text-center py-8">Fii primul care trimite un mesaj!</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-2">
              <Avatar className="w-6 h-6 flex-shrink-0">
                <AvatarImage src={msg.user.avatar} />
                <AvatarFallback>{msg.user.username[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-xs leading-relaxed">
                  <span className="font-semibold text-[#00f5d4]">{msg.user.username}</span>
                  <span className="text-white/60 ml-2">{msg.text}</span>
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t border-white/[0.06]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={isAuthenticated ? "Scrie un mesaj..." : "Autentifică-te pentru a chata"}
            disabled={!isAuthenticated}
            className="flex-1 px-3 py-2 rounded-xl text-xs text-white placeholder-white/30 outline-none disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={send}
            disabled={!isAuthenticated}
            className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #ff0050, #ff3366)' }}
          >
            <Send className="w-4 h-4 text-white" />
          </motion.button>
        </div>
      </div>
    </>
  );
};

// Gift Panel Component
const GiftPanel = ({ gifts, onSend }) => {
  const { isAuthenticated, user } = useAuth();
  const [selectedGift, setSelectedGift] = useState(null);

  console.log('GiftPanel rendered, gifts count:', gifts?.length || 0);

  const handleSend = (gift) => {
    if (!isAuthenticated) {
      alert('Autentifică-te pentru a trimite cadouri!');
      return;
    }
    if (user.walletBalance < gift.cost) {
      alert(`Insufficient balance! Ai nevoie de ${gift.cost} coins.`);
      return;
    }
    onSend(gift);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col">
      <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-xs text-white/50 mb-1 font-body">Soldul tău:</p>
        <p className="text-lg font-bold text-white font-display">{user?.walletBalance || 0} <span className="text-sm text-white/40 font-body">coins</span></p>
      </div>

      {gifts && gifts.length > 0 ? (
        <div className="grid grid-cols-3 gap-3 flex-1">
          {gifts.map((gift) => (
            <motion.button
              key={gift._id}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSend(gift)}
              className="p-3 rounded-xl text-center transition-colors"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="text-2xl mb-1">{gift.icon}</div>
              <p className="text-[10px] text-white/80 font-medium truncate font-body">{gift.name}</p>
              <p className="text-xs font-bold text-[#FFD700] mt-1 font-display">{gift.cost}</p>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-white/40 font-body">Se încarcă cadourile...</p>
        </div>
      )}

      <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(255,0,80,0.05)', border: '1px solid rgba(255,0,80,0.2)' }}>
        <p className="text-xs text-white/50 font-body">💡 Cadourile trimise susțin creatorii! Creatorii primesc 70% din valoare.</p>
      </div>
    </div>
  );
};

export default LivePage;
