import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import {
  Settings, Share2, MoreHorizontal, BadgeCheck, Grid3X3,
  Heart, Bookmark, Lock, Play, Eye, Music, Edit3, Link,
  MapPin, Calendar, Users, UserPlus
} from 'lucide-react';
import { users, currentUser, videos, formatNumber } from '../data/mockData';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';

const ProfilePage = () => {
  const { username } = useParams();
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('videos');

  const profileUser = username
    ? users.find(u => u.username === username) || currentUser
    : currentUser;
  const isOwnProfile = !username || profileUser.id === currentUser.id;
  const userVideos = isOwnProfile ? videos.slice(0, 6) : videos.filter(v => v.user.id === profileUser.id);
  const allVideos = userVideos.length > 0 ? userVideos : videos.slice(0, 4);

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative mb-8">
        {/* Banner */}
        <div className="h-48 rounded-2xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg, rgba(255,0,80,0.15), rgba(0,245,212,0.1), rgba(100,50,200,0.1))' }}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(60px)' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-40 h-40 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #ff0050, transparent)' }} />
          </div>
        </div>

        {/* Avatar & Info */}
        <div className="px-6 -mt-16 relative z-10">
          <div className="flex items-end gap-6">
            <div className="relative">
              <Avatar className="w-32 h-32 ring-4 ring-black">
                <AvatarImage src={profileUser.avatar} />
                <AvatarFallback className="text-3xl">{profileUser.displayName[0]}</AvatarFallback>
              </Avatar>
              {profileUser.verified && (
                <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-[#00f5d4] flex items-center justify-center ring-3 ring-black">
                  <BadgeCheck className="w-4 h-4 text-black" />
                </div>
              )}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-white">{profileUser.displayName}</h1>
                {profileUser.verified && <BadgeCheck className="w-5 h-5 text-[#00f5d4]" />}
              </div>
              <p className="text-sm text-white/50">@{profileUser.username}</p>
            </div>
            <div className="flex items-center gap-3 pb-2">
              {isOwnProfile ? (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Edit3 className="w-4 h-4" /> Edit Profile
                </motion.button>
              ) : (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setIsFollowing(!isFollowing)} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${isFollowing ? 'text-white/70 border border-white/10' : 'text-white'}`} style={!isFollowing ? { background: '#ff0050', boxShadow: '0 0 20px rgba(255,0,80,0.3)' } : { background: 'rgba(255,255,255,0.06)' }}>
                  {isFollowing ? 'Following' : <><UserPlus className="w-4 h-4" /> Follow</>}
                </motion.button>
              )}
              <motion.button whileHover={{ scale: 1.05 }} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Share2 className="w-4 h-4 text-white/60" />
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <MoreHorizontal className="w-4 h-4 text-white/60" />
              </motion.button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 mt-6">
            {[
              { label: 'Following', value: profileUser.following },
              { label: 'Followers', value: profileUser.followers },
              { label: 'Likes', value: profileUser.likes },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-xl font-bold text-white">{formatNumber(stat.value)}</p>
                <p className="text-xs text-white/40 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Bio */}
          <p className="text-sm text-white/70 mt-4 max-w-md leading-relaxed">{profileUser.bio}</p>
          <div className="flex items-center gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-xs text-white/30">
              <Link className="w-3.5 h-3.5" /> kdm.com/@{profileUser.username}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-white/30">
              <Calendar className="w-3.5 h-3.5" /> Joined 2024
            </span>
          </div>
        </div>
      </motion.div>

      {/* Content Tabs */}
      <div className="border-b border-white/[0.06] mb-6">
        <div className="flex gap-1">
          {[
            { id: 'videos', label: 'Videos', icon: Grid3X3 },
            { id: 'liked', label: 'Liked', icon: Heart },
            { id: 'saved', label: 'Saved', icon: Bookmark },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'text-white border-white'
                    : 'text-white/40 border-transparent hover:text-white/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Video Grid */}
      <motion.div layout className="grid grid-cols-3 md:grid-cols-4 gap-3">
        {allVideos.map((video, i) => (
          <motion.div
            key={`${activeTab}-${video.id}-${i}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.03, y: -4 }}
            className="group relative aspect-[9/14] rounded-xl overflow-hidden cursor-pointer"
            style={{ border: '1px solid rgba(255,255,255,0.04)' }}
          >
            <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
                <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
              </div>
            </div>
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
              <Play className="w-3 h-3 text-white/80" fill="white" />
              <span className="text-xs font-semibold text-white/80">{formatNumber(video.views)}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Empty state for saved/liked when not own profile */}
      {activeTab === 'saved' && !isOwnProfile && (
        <div className="flex flex-col items-center justify-center py-20">
          <Lock className="w-12 h-12 text-white/20 mb-4" />
          <p className="text-lg font-semibold text-white/40">This content is private</p>
          <p className="text-sm text-white/20 mt-1">Only the user can see saved videos</p>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
