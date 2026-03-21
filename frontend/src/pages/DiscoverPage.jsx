import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search, Flame, Zap, Music, Smile, ChefHat, Dumbbell, Plane,
  Cpu, Palette, Headphones, Shirt, Heart, TrendingUp, Play,
  BadgeCheck, Hash
} from 'lucide-react';
import { videos as mockVideos, trendingHashtags as mockHashtags, discoverCategories, users as mockUsers, formatNumber } from '../data/mockData';
import { discoverAPI } from '../services/api';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';

const iconMap = {
  flame: Flame, zap: Zap, music: Music, smile: Smile, 'chef-hat': ChefHat,
  dumbbell: Dumbbell, plane: Plane, cpu: Cpu, palette: Palette,
  headphones: Headphones, shirt: Shirt, heart: Heart, hash: Hash
};

const VideoGrid = ({ videoList }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
    {videoList.map((video, i) => (
      <motion.div
        key={video.id + '-' + i}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        whileHover={{ scale: 1.02, y: -4 }}
        className="group relative aspect-[9/14] rounded-xl overflow-hidden cursor-pointer"
        style={{ border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
            <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3 z-[2]">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Avatar className="w-6 h-6">
              <AvatarImage src={video.user?.avatar} />
              <AvatarFallback>{(video.user?.displayName || 'U')[0]}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-semibold text-white/90 truncate">{video.user?.username}</span>
            {video.user?.verified && <BadgeCheck className="w-3 h-3 text-[#00f5d4] flex-shrink-0" />}
          </div>
          <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">{video.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-[10px] text-white/50">
              <Play className="w-3 h-3" />{formatNumber(video.views || 0)}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-white/50">
              <Heart className="w-3 h-3" />{formatNumber(video.likes || 0)}
            </span>
          </div>
        </div>
      </motion.div>
    ))}
  </div>
);

const DiscoverPage = ({ live }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [trendingVideos, setTrendingVideos] = useState([]);
  const [creators, setCreators] = useState([]);
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get('q') || '';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (searchQuery) {
          const res = await discoverAPI.search(searchQuery);
          setSearchResults(res.data);
        } else {
          const [trendingRes, creatorsRes] = await Promise.all([
            discoverAPI.getTrending(),
            discoverAPI.getCreators(8),
          ]);
          const tData = trendingRes.data;
          setTrendingHashtags(tData.hashtags?.length > 0 ? tData.hashtags : mockHashtags);
          // Only use real videos if they have thumbnails
          const realVids = (tData.videos || []).filter(v => v.thumbnail || (v.videoUrl && v.videoUrl.includes('youtube')));
          setTrendingVideos(realVids.length > 0 ? realVids : mockVideos);
          setCreators(creatorsRes.data?.length > 0 ? creatorsRes.data : mockUsers);
        }
      } catch (err) {
        setTrendingHashtags(mockHashtags);
        setTrendingVideos(mockVideos);
        setCreators(mockUsers);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-white/10 border-t-[#ff0050] rounded-full animate-spin" />
      </div>
    );
  }

  // Search results view
  if (searchQuery && searchResults) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Search: "{searchQuery}"</h1>
          <p className="text-sm text-white/40">
            {(searchResults.users?.length || 0) + (searchResults.videos?.length || 0)} results found
          </p>
        </motion.div>
        {searchResults.users?.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4">Users</h2>
            <div className="flex gap-4 flex-wrap">
              {searchResults.users.map((user) => (
                <motion.div key={user.id} whileHover={{ y: -4 }} onClick={() => navigate(`/profile/${user.username}`)} className="p-4 rounded-2xl cursor-pointer w-[140px] text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Avatar className="w-14 h-14 mx-auto mb-2">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{(user.displayName || 'U')[0]}</AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-semibold text-white truncate">{user.username}</p>
                  <p className="text-xs text-white/40">{formatNumber(user.followers || 0)} fans</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
        {searchResults.videos?.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-4">Videos</h2>
            <VideoGrid videoList={searchResults.videos} />
          </div>
        )}
        {!searchResults.users?.length && !searchResults.videos?.length && (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-lg text-white/40">No results found</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">{live ? 'LIVE Now' : 'Discover'}</h1>
        <p className="text-sm text-white/40">{live ? 'Watch live streams from creators' : 'Explore trending content and discover new creators'}</p>
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
                <motion.div key={hashtag.tag} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -4, scale: 1.02 }} className="flex-shrink-0 p-4 rounded-2xl cursor-pointer min-w-[160px]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
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
            <motion.button key={cat.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setActiveCategory(cat.id)} className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeCategory === cat.id ? 'text-white shadow-lg' : 'text-white/50 hover:text-white/80'}`} style={{ background: activeCategory === cat.id ? 'rgba(255,0,80,0.9)' : 'rgba(255,255,255,0.04)', border: `1px solid ${activeCategory === cat.id ? 'rgba(255,0,80,0.5)' : 'rgba(255,255,255,0.06)'}`, boxShadow: activeCategory === cat.id ? '0 0 20px rgba(255,0,80,0.2)' : 'none' }}>
              {cat.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Creators */}
      {!live && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Popular Creators</h2>
          <div className="flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
            {creators.map((user, i) => (
              <motion.div key={user.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }} whileHover={{ y: -6 }} className="flex-shrink-0 w-[140px] p-4 rounded-2xl text-center cursor-pointer" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }} onClick={() => navigate(`/profile/${user.username}`)}>
                <div className="relative mx-auto w-16 h-16 mb-3">
                  <Avatar className="w-16 h-16 ring-2 ring-[#ff0050]/30">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{(user.displayName || 'U')[0]}</AvatarFallback>
                  </Avatar>
                  {user.verified && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#00f5d4] flex items-center justify-center">
                      <BadgeCheck className="w-3 h-3 text-black" />
                    </div>
                  )}
                </div>
                <p className="text-sm font-semibold text-white truncate">{user.username}</p>
                <p className="text-xs text-white/40 mt-0.5">{formatNumber(user.followers || 0)} fans</p>
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
        <h2 className="text-lg font-bold text-white mb-4">{live ? 'Live Streams' : 'Explore Videos'}</h2>
        <VideoGrid videoList={trendingVideos.length > 0 ? trendingVideos : [...mockVideos, ...mockVideos.slice(0, 4)]} />
      </div>
    </div>
  );
};

export default DiscoverPage;
