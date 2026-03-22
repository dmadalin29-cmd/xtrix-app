import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, Heart, Share2, Gift, Send, ChevronDown, UserPlus, Coins } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
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
        <p className="text-xl font-bold text-white drop-shadow-[0_0_8px_rgba(255,215,0,0.8)] font-display">{gift.name}</p>
        <p className="text-sm font-semibold text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.6)] font-body">{gift.cost} coins</p>
      </motion.div>
    </motion.div>
  );
};

// Gift Drawer (Bottom Sheet)
const GiftDrawer = ({ isOpen, onClose, gifts, userBalance, onSend }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[150]"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 rounded-t-[32px] overflow-hidden z-[160]"
            style={{ 
              height: '65vh',
              background: 'rgba(15,15,25,0.98)', 
              backdropFilter: 'blur(40px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderBottom: 'none'
            }}
          >
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-white/[0.08]">
              <div>
                <h3 className="text-xl font-bold text-white font-display">Trimite Cadou</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <Coins className="w-4 h-4 text-[#FFD700]" />
                  <span className="text-sm font-semibold text-[#FFD700] font-body">{userBalance} coins</span>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Gifts Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-4 gap-3">
                {gifts.map((gift) => (
                  <motion.button
                    key={gift._id}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onSend(gift)}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/[0.06] hover:border-[#FFD700]/40 transition-all"
                    style={{ background: 'rgba(255,255,255,0.02)' }}
                    data-testid={`gift-button-${gift._id}`}
                  >
                    <div className="text-4xl">{gift.icon}</div>
                    <p className="text-xs font-medium text-white/80 text-center font-body truncate w-full">{gift.name}</p>
                    <div className="flex items-center gap-1">
                      <Coins className="w-3 h-3 text-[#FFD700]" />
                      <span className="text-xs font-bold text-[#FFD700] font-body">{gift.cost}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const WatchStreamPage = () => {
  const { streamId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, requireAuth } = useAuth();
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const chatEndRef = useRef(null);
  
  const [allStreams, setAllStreams] = useState([]);
  const [currentStreamIndex, setCurrentStreamIndex] = useState(0);
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentViewers, setCurrentViewers] = useState(0);
  const [gifts, setGifts] = useState([]);
  const [flyingGifts, setFlyingGifts] = useState([]);
  const [showGiftDrawer, setShowGiftDrawer] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);

  // Fetch all streams and sort intelligently
  useEffect(() => {
    const fetchAllStreams = async () => {
      try {
        const res = await liveAPI.getActiveStreams();
        let streams = res.data || [];
        
        // Sort by intelligent algorithm: (viewers × 0.5) + (likes × 0.3) + (recency × 0.2)
        streams = streams.map(s => {
          const now = new Date();
          const createdAt = new Date(s.createdAt);
          const minutesAgo = (now - createdAt) / (1000 * 60);
          const recencyScore = Math.max(0, 30 - minutesAgo); // Boost for streams < 30 min old
          
          const score = (s.currentViewers || 0) * 0.5 + (s.likes || 0) * 0.3 + recencyScore * 0.2;
          return { ...s, relevanceScore: score };
        }).sort((a, b) => b.relevanceScore - a.relevanceScore);
        
        setAllStreams(streams);
        
        // Find current stream index
        const index = streams.findIndex(s => s.id === streamId);
        if (index >= 0) {
          setCurrentStreamIndex(index);
          setStream(streams[index]);
          setCurrentViewers(streams[index].currentViewers || 0);
          if (streams[index].hlsUrl) {
            initializePlayer(streams[index].hlsUrl);
          }
        } else if (streams.length > 0) {
          // Stream not found, redirect to first relevant stream
          navigate(`/watch/${streams[0].id}`, { replace: true });
        }
      } catch (err) {
        console.error('Failed to fetch streams');
      } finally {
        setLoading(false);
      }
    };

    fetchAllStreams();

    const fetchGifts = async () => {
      try {
        const res = await giftsAPI.getAll();
        setGifts(res.data || []);
      } catch (err) {
        console.error('Failed to load gifts');
      }
    };

    fetchGifts();

    // Mock chat messages for demo
    setChatMessages([
      { id: '1', user: { username: 'viewer1', avatar: '' }, text: 'Super stream! 🔥', timestamp: new Date() },
      { id: '2', user: { username: 'fan_kdm', avatar: '' }, text: 'Salut! Cum merge?', timestamp: new Date() },
      { id: '3', user: { username: 'creator_bella', avatar: '' }, text: 'Mulțumesc pentru suport! ❤️', timestamp: new Date() }
    ]);
  }, [streamId, navigate]);

  useEffect(() => {
    if (chatEndRef.current && !isChatCollapsed) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatCollapsed]);

  const initializePlayer = (hlsUrl) => {
    if (!videoRef.current) return;
    
    if (!hlsUrl) {
      console.log('No HLS URL yet');
      return;
    }

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
        
        // Close drawer
        setShowGiftDrawer(false);
      } catch (err) {
        alert(err.response?.data?.detail || 'Eroare la trimiterea cadoului');
      }
    });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !isAuthenticated) return;
    
    const newMsg = {
      id: Date.now().toString(),
      user: { username: user?.username || 'You', avatar: user?.avatar },
      text: chatInput,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');
  };

  // Swipe handlers for next/prev live stream
  const goToNextStream = () => {
    if (allStreams.length === 0) return;
    const nextIndex = (currentStreamIndex + 1) % allStreams.length; // Circular
    const nextStream = allStreams[nextIndex];
    navigate(`/watch/${nextStream.id}`, { replace: true });
  };

  const goToPrevStream = () => {
    if (allStreams.length === 0) return;
    const prevIndex = currentStreamIndex === 0 ? allStreams.length - 1 : currentStreamIndex - 1;
    const prevStream = allStreams[prevIndex];
    navigate(`/watch/${prevStream.id}`, { replace: true });
  };

  const swipeHandlers = useSwipeable({
    onSwipedUp: () => goToNextStream(),
    onSwipedDown: () => goToPrevStream(),
    preventScrollOnSwipe: true,
    trackMouse: false,
    delta: 50
  });

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
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white/10 border-t-[#ff0050] rounded-full animate-spin" />
          <p className="text-white/60 font-body">Loading stream...</p>
        </div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-white/80 font-body mb-4">Stream not found</p>
          <button 
            onClick={() => navigate('/live')}
            className="px-6 py-3 rounded-full text-sm font-bold text-white font-body"
            style={{ background: '#ff0050' }}
          >
            Back to LIVE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div {...swipeHandlers} className="fixed inset-0 bg-black overflow-hidden">
      {/* Flying Gifts */}
      <AnimatePresence>
        {flyingGifts.map((gift) => (
          <FlyingGift key={gift.animationId} gift={gift} onComplete={() => {}} />
        ))}
      </AnimatePresence>

      {/* Full-Screen Video Background */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted={false}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
      />

      {/* Placeholder when stream initializing */}
      {!stream.hlsUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/50 via-pink-900/50 to-black z-[1]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-white/10 border-t-[#ff0050] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/80 text-lg font-body">Stream-ul se pregătește...</p>
            <p className="text-white/40 text-sm font-body mt-2">Așteaptă câteva secunde</p>
          </div>
        </div>
      )}

      {/* Top Gradient Overlay */}
      <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none z-[5]" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)' }} />

      {/* Bottom Gradient Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none z-[5]" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }} />

      {/* TOP BAR - Broadcaster Info */}
      <div className="absolute top-0 left-0 right-0 z-[90] px-4 pt-safe pt-4 pb-2 flex items-center justify-between">
        {/* Left: Broadcaster */}
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 ring-2 ring-white/30">
            <AvatarImage src={stream.user?.avatar} />
            <AvatarFallback>{(stream.user?.username || 'U')[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-bold text-white font-display" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>{stream.user?.username}</p>
            <p className="text-xs text-white/70 font-body" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.8)' }}>{stream.title}</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="px-4 py-1.5 rounded-full text-xs font-bold text-white font-body"
            style={{ background: '#ff0050' }}
            data-testid="follow-broadcaster-btn"
          >
            <UserPlus className="w-3.5 h-3.5 inline mr-1" />
            Follow
          </motion.button>
        </div>

        {/* Right: Viewers + Close */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md" style={{ background: 'rgba(255,0,80,0.9)' }}>
            <Eye className="w-4 h-4 text-white" />
            <span className="text-xs font-bold text-white font-body">{currentViewers}</span>
          </div>
          <button 
            onClick={() => navigate('/live')}
            className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md hover:bg-white/20 transition-colors"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            data-testid="close-stream-btn"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* CHAT OVERLAY - Bottom Left */}
      <AnimatePresence>
        {!isChatCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-24 left-4 w-[70%] max-w-sm z-[80]"
            style={{
              maxHeight: '35vh',
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 100%)'
            }}
          >
            <div className="overflow-y-auto space-y-2 pb-2">
              {chatMessages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex flex-col"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white font-body" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.95)' }}>
                      {msg.user.username}
                    </span>
                  </div>
                  <p className="text-sm text-white/90 font-body leading-snug" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.95)' }}>
                    {msg.text}
                  </p>
                </motion.div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Chat Button (when collapsed) */}
      {isChatCollapsed && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setIsChatCollapsed(false)}
          className="absolute bottom-24 left-4 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md z-[80]"
          style={{ background: 'rgba(255,0,80,0.9)' }}
        >
          <ChevronDown className="w-5 h-5 text-white rotate-180" />
        </motion.button>
      )}

      {/* Chat Input - Bottom Left */}
      <form 
        onSubmit={sendMessage}
        className="absolute bottom-4 left-4 w-[70%] max-w-sm z-[85] flex items-center gap-2"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder={isAuthenticated ? "Spune ceva..." : "Loghează-te..."}
          disabled={!isAuthenticated}
          className="flex-1 px-4 py-2.5 rounded-full text-sm text-white placeholder-white/40 outline-none border border-white/[0.15] backdrop-blur-xl font-body disabled:opacity-50"
          style={{ background: 'rgba(255,255,255,0.08)' }}
          data-testid="chat-input"
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          type="submit"
          disabled={!chatInput.trim() || !isAuthenticated}
          className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30"
          style={{ background: chatInput.trim() && isAuthenticated ? '#ff0050' : 'rgba(255,255,255,0.1)' }}
          data-testid="send-chat-btn"
        >
          <Send className="w-4 h-4 text-white" />
        </motion.button>
        
        {/* Collapse Chat Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          type="button"
          onClick={() => setIsChatCollapsed(!isChatCollapsed)}
          className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md"
          style={{ background: 'rgba(0,0,0,0.4)' }}
        >
          <ChevronDown className={`w-4 h-4 text-white transition-transform ${isChatCollapsed ? 'rotate-180' : ''}`} />
        </motion.button>
      </form>

      {/* ACTION STACK - Bottom Right */}
      <div className="absolute bottom-28 right-4 z-[90] flex flex-col items-center gap-4" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Creator Profile */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(`/profile/${stream.user?.username}`)}
          className="relative"
          data-testid="creator-profile-btn"
        >
          <Avatar className="w-12 h-12 ring-4 ring-white/40">
            <AvatarImage src={stream.user?.avatar} />
            <AvatarFallback>{(stream.user?.username || 'U')[0]}</AvatarFallback>
          </Avatar>
        </motion.button>

        {/* Like Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="flex flex-col items-center gap-1"
          data-testid="like-stream-btn"
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <Heart className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs font-bold text-white font-body" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>
            {stream.likes || 0}
          </span>
        </motion.button>

        {/* Share Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="flex flex-col items-center gap-1"
          data-testid="share-stream-btn"
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs font-bold text-white font-body" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>
            Share
          </span>
        </motion.button>
      </div>

      {/* FLOATING GIFT BUTTON - Bottom Right */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        animate={{ 
          boxShadow: [
            '0 0 20px rgba(255,215,0,0.4)',
            '0 0 35px rgba(255,215,0,0.7)',
            '0 0 20px rgba(255,215,0,0.4)'
          ]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        onClick={() => setShowGiftDrawer(true)}
        className="absolute bottom-4 right-4 w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-xl z-[90]"
        style={{ 
          background: 'linear-gradient(135deg, #FFD700, #FFA500)',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
        data-testid="open-gift-drawer-btn"
      >
        <Gift className="w-7 h-7 text-white" />
      </motion.button>

      {/* Gift Drawer */}
      <GiftDrawer 
        isOpen={showGiftDrawer}
        onClose={() => setShowGiftDrawer(false)}
        gifts={gifts}
        userBalance={user?.walletBalance || 0}
        onSend={sendGift}
      />

      {/* LIVE Badge - Top Left (over gradient) */}
      <div className="absolute top-20 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg z-[80]" style={{ background: '#ff0050' }}>
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        <span className="text-xs font-bold text-white font-body">LIVE</span>
      </div>

      {/* Swipe Indicators (TikTok-style) */}
      {allStreams.length > 1 && (
        <>
          {currentStreamIndex < allStreams.length - 1 && (
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 right-4 z-[85] opacity-40"
            >
              <ChevronDown className="w-8 h-8 text-white" style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.8))' }} />
            </motion.div>
          )}
          
          {currentStreamIndex > 0 && (
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 left-4 z-[85] opacity-40 rotate-180"
            >
              <ChevronDown className="w-8 h-8 text-white" style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.8))' }} />
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default WatchStreamPage;
