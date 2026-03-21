import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Eye, Heart, MessageCircle, Share2, Users,
  TrendingUp, Play, Video, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { discoverAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatNumber } from '../data/mockData';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';

const StatCard = ({ icon: Icon, label, value, color, trend }) => (
  <motion.div whileHover={{ y: -4, scale: 1.02 }} className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
    <div className="flex items-center justify-between mb-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      {trend && (
        <span className={`flex items-center gap-1 text-xs font-semibold ${trend > 0 ? 'text-[#00f5d4]' : 'text-red-400'}`}>
          {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-white">{formatNumber(value)}</p>
    <p className="text-xs text-white/40 mt-1">{label}</p>
  </motion.div>
);

const AnalyticsPage = () => {
  const { isAuthenticated, requireAuth } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchAnalytics = async () => {
      try {
        const res = await discoverAPI.getAnalytics();
        setAnalytics(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchAnalytics();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <BarChart3 className="w-16 h-16 text-white/20 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Creator Analytics</h2>
        <p className="text-sm text-white/40 mb-6">Sign in to see your analytics</p>
        <motion.button whileHover={{ scale: 1.05 }} onClick={() => requireAuth()} className="px-8 py-3 rounded-xl text-sm font-bold text-white" style={{ background: '#ff0050' }}>Sign In</motion.button>
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-white/10 border-t-[#ff0050] rounded-full animate-spin" /></div>;
  }

  const data = analytics || { totalVideos: 0, totalViews: 0, totalLikes: 0, totalComments: 0, totalShares: 0, followers: 0, following: 0, topVideos: [], recentFollowers: [] };

  return (
    <div className="p-6 max-w-[1100px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Analytics</h1>
        <p className="text-sm text-white/40">Track your growth and performance</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Eye} label="Total Views" value={data.totalViews} color="#ff0050" trend={12} />
        <StatCard icon={Heart} label="Total Likes" value={data.totalLikes} color="#ff6b6b" trend={8} />
        <StatCard icon={MessageCircle} label="Comments" value={data.totalComments} color="#00f5d4" trend={5} />
        <StatCard icon={Users} label="Followers" value={data.followers} color="#7c5dfa" trend={15} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Video} label="Total Videos" value={data.totalVideos} color="#f5c518" />
        <StatCard icon={Share2} label="Total Shares" value={data.totalShares} color="#1DA1F2" />
        <StatCard icon={Users} label="Following" value={data.following} color="#00f5d4" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Videos */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#ff0050]" /> Top Videos
          </h3>
          {data.topVideos.length === 0 ? (
            <p className="text-sm text-white/30 py-6 text-center">Upload videos to see analytics</p>
          ) : (
            <div className="space-y-3">
              {data.topVideos.map((video, i) => (
                <div key={video.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                  <span className="text-lg font-bold text-white/20 w-6">#{i + 1}</span>
                  {video.thumbnail ? (
                    <img src={video.thumbnail} alt="" className="w-12 h-16 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-16 rounded-lg bg-white/[0.05] flex items-center justify-center"><Play className="w-4 h-4 text-white/20" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 truncate">{video.caption || 'Untitled'}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-white/40 flex items-center gap-1"><Eye className="w-3 h-3" />{formatNumber(video.views)}</span>
                      <span className="text-[10px] text-white/40 flex items-center gap-1"><Heart className="w-3 h-3" />{formatNumber(video.likes)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Followers */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#00f5d4]" /> Recent Followers
          </h3>
          {data.recentFollowers.length === 0 ? (
            <p className="text-sm text-white/30 py-6 text-center">No followers yet</p>
          ) : (
            <div className="space-y-3">
              {data.recentFollowers.map(follower => (
                <div key={follower.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                  <Avatar className="w-10 h-10"><AvatarImage src={follower.avatar} /><AvatarFallback>{(follower.displayName||'U')[0]}</AvatarFallback></Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{follower.username}</p>
                    <p className="text-xs text-white/40">{follower.displayName}</p>
                  </div>
                  <span className="text-xs text-white/30">{formatNumber(follower.followers || 0)} fans</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
