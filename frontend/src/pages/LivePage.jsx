import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Radio, Users, Eye, Heart, MessageCircle, X, Send, Gift, BadgeCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { liveAPI, giftsAPI } from '../services/api';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import Hls from 'hls.js';

const LivePage = () => {
  const navigate = useNavigate();
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
              onClick={() => navigate(`/watch/${stream.id}`)}
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
    </div>
  );
};

export default LivePage;
