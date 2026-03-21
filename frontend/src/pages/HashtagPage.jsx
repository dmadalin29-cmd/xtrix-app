import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hash, ArrowLeft, Play, Heart, TrendingUp } from 'lucide-react';
import { discoverAPI } from '../services/api';
import { videos as mockVideos, formatNumber } from '../data/mockData';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';

const HashtagPage = () => {
  const { tag } = useParams();
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [tagInfo, setTagInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const fetchHashtag = async () => {
      setLoading(true);
      try {
        const res = await discoverAPI.getHashtagVideos(tag, 1);
        setVideos(res.data.videos || []);
        setTagInfo({ tag: res.data.tag, postCount: res.data.total });
        setHasMore(res.data.hasMore || false);
      } catch (err) {
        setVideos(mockVideos.filter(v => v.hashtags?.includes(tag)));
      } finally { setLoading(false); }
    };
    if (tag) fetchHashtag();
  }, [tag]);

  const loadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    try {
      const res = await discoverAPI.getHashtagVideos(tag, nextPage);
      setVideos(prev => [...prev, ...(res.data.videos || [])]);
      setHasMore(res.data.hasMore || false);
    } catch (err) {}
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,0,80,0.15)' }}>
            <Hash className="w-8 h-8 text-[#ff0050]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">#{tag}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-sm text-white/40">
                <TrendingUp className="w-4 h-4" />
                {tagInfo ? formatNumber(tagInfo.postCount) : '0'} posts
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Video Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-white/10 border-t-[#ff0050] rounded-full animate-spin" />
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-20">
          <Hash className="w-12 h-12 text-white/15 mx-auto mb-4" />
          <p className="text-lg text-white/40">No videos with #{tag} yet</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {videos.map((video, i) => (
              <motion.div key={video.id + '-' + i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} whileHover={{ scale: 1.02, y: -4 }} className="group relative aspect-[9/14] rounded-xl overflow-hidden cursor-pointer" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
                    <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 z-[2]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Avatar className="w-6 h-6"><AvatarImage src={video.user?.avatar} /><AvatarFallback>{(video.user?.displayName||'U')[0]}</AvatarFallback></Avatar>
                    <span className="text-xs font-semibold text-white/90 truncate">{video.user?.username}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[10px] text-white/50"><Play className="w-3 h-3" />{formatNumber(video.views || 0)}</span>
                    <span className="flex items-center gap-1 text-[10px] text-white/50"><Heart className="w-3 h-3" />{formatNumber(video.likes || 0)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-8">
              <motion.button whileHover={{ scale: 1.05 }} onClick={loadMore} className="px-8 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                Load More
              </motion.button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HashtagPage;
