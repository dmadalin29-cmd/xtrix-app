import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Users, Eye, Heart, MessageCircle, Search, BadgeCheck } from 'lucide-react';
import { users as mockUsers, formatNumber } from '../data/mockData';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';

// Mock live streams (placeholder)
const mockStreams = [
  { id: 'live_1', user: mockUsers[0], title: 'Dance practice LIVE!', viewers: 12400, thumbnail: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=400&h=300&fit=crop' },
  { id: 'live_2', user: mockUsers[6], title: 'Comedy night - send requests!', viewers: 8900, thumbnail: 'https://images.unsplash.com/photo-1586105449897-20b5efeb3233?w=400&h=300&fit=crop' },
  { id: 'live_3', user: mockUsers[7], title: 'Acoustic session', viewers: 5600, thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=300&fit=crop' },
  { id: 'live_4', user: mockUsers[1], title: 'Cooking Italian dinner', viewers: 3200, thumbnail: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
  { id: 'live_5', user: mockUsers[4], title: 'Morning workout routine', viewers: 7800, thumbnail: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop' },
  { id: 'live_6', user: mockUsers[5], title: 'Digital art creation', viewers: 2100, thumbnail: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=300&fit=crop' },
];

const LivePage = () => {
  const [selectedStream, setSelectedStream] = useState(null);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-bold text-white">LIVE</h1>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: '#ff0050' }}>
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            {mockStreams.length} Live Now
          </span>
        </div>
        <p className="text-sm text-white/40">Watch live streams from your favorite creators</p>
      </motion.div>

      {/* Live Stream Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockStreams.map((stream, i) => (
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
            <div className="aspect-video relative">
              <img src={stream.thumbnail} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* LIVE badge */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold text-white" style={{ background: '#ff0050' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                </span>
                <span className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-white/80" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}>
                  <Eye className="w-3 h-3" /> {formatNumber(stream.viewers)}
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

      {/* Stream Viewer Modal */}
      <AnimatePresence>
        {selectedStream && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setSelectedStream(null)}>
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()} className="relative w-full max-w-3xl rounded-2xl overflow-hidden" style={{ background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="aspect-video relative bg-black">
                <img src={selectedStream.thumbnail} alt="" className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Radio className="w-12 h-12 text-[#ff0050] mx-auto mb-3 animate-pulse" />
                    <p className="text-lg font-bold text-white">Live Stream</p>
                    <p className="text-sm text-white/40 mt-1">Stream playback coming soon</p>
                  </div>
                </div>
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold text-white" style={{ background: '#ff0050' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                  </span>
                  <span className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-white/80" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <Eye className="w-3 h-3" /> {formatNumber(selectedStream.viewers)}
                  </span>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 ring-2 ring-[#ff0050]">
                    <AvatarImage src={selectedStream.user.avatar} />
                    <AvatarFallback>{selectedStream.user.displayName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-bold text-white">{selectedStream.user.displayName}</p>
                    <p className="text-xs text-white/40">{selectedStream.title}</p>
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.05 }} className="px-5 py-2 rounded-full text-sm font-bold text-white" style={{ background: '#ff0050' }}>Follow</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LivePage;
