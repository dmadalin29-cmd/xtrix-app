import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, Heart, MessageCircle, Gift, Loader2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { liveAPI, giftsAPI } from '../services/api';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import Hls from 'hls.js';

// Flying Gift Animation Component
const FlyingGift = ({ gift, onComplete }) => {
  const startX = Math.random() * 60 + 20;
  const startY = Math.random() * 40 + 30;
  
  return (
    <motion.div
      initial={{ x: `${startX}vw`, y: `${startY}vh`, scale: 0, opacity: 0, rotate: 0 }}
      animate={{ 
        x: [`${startX}vw`, `${startX + 20}vw`, `${startX - 10}vw`],
        y: [`${startY}vh`, `${startY - 40}vh`, `${startY - 60}vh`],
        scale: [0, 2.5, 3, 2],
        opacity: [0, 1, 1, 0],
        rotate: [0, 15, -10, 0]
      }}
      transition={{ duration: 2.5, times: [0, 0.3, 0.7, 1], ease: "easeOut" }}
      onAnimationComplete={onComplete}
      className="fixed pointer-events-none z-[200]"
      style={{ filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.8))' }}
    >
      <div className="relative">
        <div className="text-7xl">{gift.icon}</div>
        <div className="absolute inset-0 blur-2xl opacity-70" style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.6), transparent)' }} />
        <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0.3, 0.8] }} transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-4 -right-4 text-3xl">✨</motion.div>
        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0.4, 0.8] }} transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.3 }} className="absolute -bottom-4 -left-4 text-2xl">✨</motion.div>
      </div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: [0, 1, 1, 0], y: [10, 0, -5, -10] }} transition={{ duration: 2.5 }} className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
        <p className="text-xl font-bold text-white drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]">{gift.name}</p>
        <p className="text-sm font-semibold text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.6)]">{gift.cost} coins</p>
      </motion.div>
    </motion.div>
  );
};

// Live Chat Component
const LiveChat = ({ streamId }) => {
  const [messages, setMessages] = useState([
    { id: '1', user: { username: 'finaltest', avatar: '' }, text: 'Test message', timestamp: new Date() },
    { id: '2', user: { username: 'modalinofficial', avatar: '' }, text: 'pim', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      user: { username: 'You', avatar: '' },
      text: input,
      timestamp: new Date()
    }]);
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-2">
            <Avatar className="w-7 h-7 flex-shrink-0">
              <AvatarImage src={msg.user.avatar} />
              <AvatarFallback>{msg.user.username[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-white/90 font-semibold font-body">{msg.user.username}</p>
              <p className="text-sm text-white/70 font-body">{msg.text}</p>
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-white/30 font-body">Fii primul care trimite un mesaj!</p>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-white/[0.08]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Scrie un mesaj..."
            className="flex-1 bg-white/[0.05] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none border border-white/[0.08] focus:border-[#ff0050]/40 font-body"
          />
          <button onClick={sendMessage} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#ff0050' }}>
            <Heart className="w-5 h-5 text-white fill-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Gift Panel Component
const GiftPanel = ({ gifts, onSend }) => {
  const { user } = useAuth();

  return (
    <div className="flex-1 overflow-y-auto p-5 flex flex-col">
      <div className="mb-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <p className="text-xs text-white/50 mb-1 font-body">Soldul tău:</p>
        <p className="text-2xl font-bold text-white font-display">{user?.walletBalance || 0} <span className="text-sm text-white/40 font-body">coins</span></p>
      </div>

      {gifts && gifts.length > 0 ? (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {gifts.map((gift) => (
            <motion.button
              key={gift._id}
              whileHover={{ scale: 1.08, y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSend(gift)}
              className="p-4 rounded-xl text-center transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="text-3xl mb-2">{gift.icon}</div>
              <p className="text-xs text-white/90 font-medium mb-1 font-body">{gift.name}</p>
              <p className="text-sm font-bold text-[#FFD700] font-display">{gift.cost}</p>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
        </div>
      )}

      <div className="mt-auto p-4 rounded-xl" style={{ background: 'rgba(255,0,80,0.08)', border: '1px solid rgba(255,0,80,0.25)' }}>
        <p className="text-xs text-white/60 font-body text-center">💡 Cadourile trimise susțin creatorii! Creatorii primesc 70% din valoare.</p>
      </div>
    </div>
  );
};

// Main WatchStreamPage Component
const WatchStreamPage = () => {
  const { streamId } = useParams();
  const navigate = useNavigate();
  const { user, requireAuth } = useAuth();
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGifts, setShowGifts] = useState(false);
  const [gifts, setGifts] = useState([]);
  const [flyingGifts, setFlyingGifts] = useState([]);
  const [currentViewers, setCurrentViewers] = useState(0);

  useEffect(() => {
    fetchStreamData();
    fetchGifts();
  }, [streamId]);

  const fetchStreamData = async () => {
    try {
      const res = await liveAPI.getActiveStreams();
      const foundStream = res.data.find(s => s.id === streamId);
      if (foundStream) {
        setStream(foundStream);
        setCurrentViewers(foundStream.viewers);
        initializePlayer(foundStream.hlsUrl);
      } else {
        alert('Stream not found');
        navigate('/live');
      }
    } catch (err) {
      console.error('Failed to fetch stream:', err);
      navigate('/live');
    } finally {
      setLoading(false);
    }
  };

  const fetchGifts = async () => {
    try {
      const res = await giftsAPI.getAll();
      setGifts(res.data);
    } catch (err) {
      console.error('Failed to fetch gifts:', err);
    }
  };

  const initializePlayer = (hlsUrl) => {
    if (!videoRef.current) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(hlsUrl);
      hls.attachMedia(videoRef.current);
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current.play().catch(e => console.log('Autoplay blocked:', e));
      });
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = hlsUrl;
      videoRef.current.addEventListener('loadedmetadata', () => {
        videoRef.current.play().catch(e => console.log('Autoplay blocked:', e));
      });
    }
  };

  const sendGift = async (gift) => {
    requireAuth(async () => {
      if ((user?.walletBalance || 0) < gift.cost) {
        alert('Sold insuficient! Încarcă mai multe coins.');
        return;
      }
      try {
        await giftsAPI.send(stream.user.id, gift._id, stream.id);
        
        // Trigger animation
        const giftId = Date.now() + Math.random();
        setFlyingGifts(prev => [...prev, { ...gift, animationId: giftId }]);
        setTimeout(() => {
          setFlyingGifts(prev => prev.filter(g => g.animationId !== giftId));
        }, 2600);
      } catch (err) {
        alert(err.response?.data?.detail || 'Eroare la trimiterea cadoului');
      }
    });
  };

  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#ff0050] animate-spin" />
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <p className="text-white font-body">Stream not found</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Flying Gifts */}
      <AnimatePresence>
        {flyingGifts.map((gift) => (
          <FlyingGift key={gift.animationId} gift={gift} onComplete={() => {}} />
        ))}
      </AnimatePresence>

      {/* Close Button */}
      <button 
        onClick={() => navigate('/live')} 
        className="absolute top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors z-[100]"
        style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Main Layout: 70% Video + 30% Chat/Gifts */}
      <div className="w-full h-full flex">
        
        {/* LEFT: Video Player (70%) */}
        <div className="w-[70%] flex flex-col p-8 pr-4">
          {/* Video Container */}
          <div className="flex-1 rounded-3xl overflow-hidden relative" style={{ background: 'rgba(20,20,30,0.95)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <video ref={videoRef} autoPlay playsInline controls className="w-full h-full object-contain" />
            
            {/* Live Badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white font-body" style={{ background: '#ff0050' }}>
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> LIVE
              </span>
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-white/80 font-body" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }}>
                <Eye className="w-3.5 h-3.5" /> {currentViewers}
              </span>
            </div>
          </div>

          {/* Stream Info Bar */}
          <div className="mt-4 p-5 rounded-2xl flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 ring-2 ring-[#ff0050]/30">
                <AvatarImage src={stream.user?.avatar} />
                <AvatarFallback>{(stream.user?.username || 'U')[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-base font-bold text-white font-display">{stream.user?.username}</p>
                <p className="text-sm text-white/50 font-body">{stream.title}</p>
              </div>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2.5 rounded-full text-sm font-bold text-white font-body" 
              style={{ background: '#ff0050' }}
            >
              Follow
            </motion.button>
          </div>
        </div>

        {/* RIGHT: Chat & Gifts Sidebar (30%) */}
        <div className="w-[30%] flex flex-col p-8 pl-4">
          <div className="h-full flex flex-col rounded-3xl overflow-hidden" style={{ background: 'rgba(18,18,28,0.98)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 0 60px rgba(255,0,80,0.15)' }}>
            
            {/* TABS - LARGE AND CLEAR */}
            <div className="flex border-b border-white/[0.2] bg-black/40 flex-shrink-0">
              <button
                onClick={() => setShowGifts(false)}
                className={`flex-1 py-6 text-lg font-bold transition-all font-display flex items-center justify-center gap-3 ${!showGifts ? 'text-white bg-[#ff0050]/15 border-b-4 border-[#ff0050]' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'}`}
              >
                <MessageCircle className="w-6 h-6" />
                Chat
              </button>
              <button
                onClick={() => setShowGifts(true)}
                className={`flex-1 py-6 text-lg font-bold transition-all font-display flex items-center justify-center gap-3 ${showGifts ? 'text-white bg-[#ff0050]/15 border-b-4 border-[#ff0050]' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'}`}
              >
                <Gift className="w-6 h-6" />
                Cadouri
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {!showGifts ? (
                <LiveChat streamId={stream.id} />
              ) : (
                <GiftPanel gifts={gifts} onSend={sendGift} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchStreamPage;
