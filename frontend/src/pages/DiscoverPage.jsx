import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Flame, Zap, Music, Smile, ChefHat, Dumbbell, Plane,
  Cpu, Palette, Headphones, Shirt, Heart, TrendingUp, Play,
  Eye, BadgeCheck, Hash
} from 'lucide-react';
import { videos, trendingHashtags, discoverCategories, users, formatNumber } from '../data/mockData';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';

const iconMap = {
  flame: Flame, zap: Zap, music: Music, smile: Smile, 'chef-hat': ChefHat,
  dumbbell: Dumbbell, plane: Plane, cpu: Cpu, palette: Palette,
  headphones: Headphones, shirt: Shirt, heart: Heart
};

const VideoGrid = ({ videoList }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
    {videoList.map((video, i) => (
      <motion.div
        key={video.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        whileHover={{ scale: 1.02, y: -4 }}
        className="group relative aspect-[9/14] rounded-xl overflow-hidden cursor-pointer"
        style={{ border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
            <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
          </div>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-[2]">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Avatar className="w-6 h-6">
              <AvatarImage src={video.user.avatar} />
              <AvatarFallback>{video.user.displayName[0]}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-semibold text-white/90 truncate">{video.user.username}</span>
            {video.user.verified && <BadgeCheck className="w-3 h-3 text-[#00f5d4] flex-shrink-0" />}
          </div>
          <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">{video.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-[10px] text-white/50">
              <Play className="w-3 h-3" />{formatNumber(video.views)}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-white/50">
              <Heart className="w-3 h-3" />{formatNumber(video.likes)}
            </span>
          </div>
        </div>
      </motion.div>
    ))}
  </div>
);

const DiscoverPage = ({ live }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">
          {live ? 'LIVE Now' : 'Discover'}
        </h1>
        <p className="text-sm text-white/40">
          {live ? 'Watch live streams from creators around the world' : 'Explore trending content and discover new creators'}
        </p>
      </motion.div>

      {/* Trending Hashtags */}
      {!live && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#ff0050]" />
            <h2 className="text-lg font-bold text-white">Trending Now</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
            {trendingHashtags.map((hashtag, i) => {
              const Icon = iconMap[hashtag.icon] || Hash;
              return (
                <motion.div
                  key={hashtag.tag}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="flex-shrink-0 p-4 rounded-2xl cursor-pointer min-w-[160px]"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `rgba(255,0,80,${0.08 + i * 0.02})` }}>
                    <Icon className="w-5 h-5 text-[#ff0050]" />
                  </div>
                  <p className="text-sm font-bold text-white">#{hashtag.tag}</p>
                  <p className="text-xs text-white/40 mt-0.5">{hashtag.posts} views</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Category Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {discoverCategories.map((cat) => (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'text-white shadow-lg'
                  : 'text-white/50 hover:text-white/80'
              }`}
              style={{
                background: activeCategory === cat.id ? 'rgba(255,0,80,0.9)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${activeCategory === cat.id ? 'rgba(255,0,80,0.5)' : 'rgba(255,255,255,0.06)'}`,
                boxShadow: activeCategory === cat.id ? '0 0 20px rgba(255,0,80,0.2)' : 'none'
              }}
            >
              {cat.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Creators to follow */}
      {!live && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Popular Creators</h2>
          <div className="flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
            {users.map((user, i) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -6 }}
                className="flex-shrink-0 w-[140px] p-4 rounded-2xl text-center cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}
              >
                <div className="relative mx-auto w-16 h-16 mb-3">
                  <Avatar className="w-16 h-16 ring-2 ring-[#ff0050]/30">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                  </Avatar>
                  {user.verified && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#00f5d4] flex items-center justify-center">
                      <BadgeCheck className="w-3 h-3 text-black" />
                    </div>
                  )}
                </div>
                <p className="text-sm font-semibold text-white truncate">{user.username}</p>
                <p className="text-xs text-white/40 mt-0.5">{formatNumber(user.followers)} fans</p>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-3 w-full py-1.5 rounded-full text-xs font-bold text-white border border-[#ff0050]/50 hover:bg-[#ff0050]/20 transition-colors">
                  Follow
                </motion.button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Video Grid */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">
          {live ? 'Live Streams' : 'Explore Videos'}
        </h2>
        <VideoGrid videoList={[...videos, ...videos.slice(0, 4)]} />
      </div>
    </div>
  );
};

export default DiscoverPage;
