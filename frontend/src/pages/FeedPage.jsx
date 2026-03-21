import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MessageCircle, Share2, Bookmark, Music, Volume2,
  VolumeX, Play, ChevronUp, ChevronDown, BadgeCheck,
  Send, X
} from 'lucide-react';
import { videos as mockVideos, comments as mockComments, formatNumber } from '../data/mockData';
import { videosAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import ReactPlayer from 'react-player';
import ShareModal from '../components/share/ShareModal';

const VideoCard = ({ video, isActive }) => {
  const { requireAuth, isAuthenticated } = useAuth();
  const [liked, setLiked] = useState(video.isLiked || false);
  const [bookmarked, setBookmarked] = useState(video.isBookmarked || false);
  const [likeCount, setLikeCount] = useState(video.likes || 0);
  const [showComments, setShowComments] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [showHeart, setShowHeart] = useState(false);
  const [following, setFollowing] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const playTimeoutRef = useRef(null);

  useEffect(() => {
    // Clear any pending play timeout on cleanup or state change
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current);
      playTimeoutRef.current = null;
    }

    if (!isActive) {
      setPlaying(false);
      return;
    }

    // Only autoplay if player is ready, with a small delay to prevent race condition
    if (isActive && playerReady) {
      playTimeoutRef.current = setTimeout(() => {
        setPlaying(true);
      }, 300);
      if (video.id) {
        videosAPI.recordView(video.id).catch(() => {});
      }
    }

    return () => {
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current);
      }
    };
  }, [isActive, video.id, playerReady]);

  const handleLike = async () => {
    if (!requireAuth()) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(newLiked ? likeCount + 1 : likeCount - 1);
    if (newLiked) {
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    }
    try {
      const res = await videosAPI.toggleLike(video.id);
      setLiked(res.data.liked);
      setLikeCount(res.data.likeCount);
    } catch (err) {
      setLiked(!newLiked);
      setLikeCount(newLiked ? likeCount : likeCount + 1);
    }
  };

  const handleBookmark = async () => {
    if (!requireAuth()) return;
    const newBookmarked = !bookmarked;
    setBookmarked(newBookmarked);
    try {
      const res = await videosAPI.toggleBookmark(video.id);
      setBookmarked(res.data.bookmarked);
    } catch (err) {
      setBookmarked(!newBookmarked);
    }
  };

  const handleDoubleClick = () => {
    if (!liked) handleLike();
    else {
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    }
  };

  return (
    <div className="snap-item flex items-center justify-center gap-5 py-4 px-8" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Video Container */}
      <div className="relative h-full aspect-[9/16] max-h-[calc(100vh-96px)] rounded-2xl overflow-hidden group cursor-pointer" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }} onDoubleClick={handleDoubleClick} onClick={() => { if (playTimeoutRef.current) { clearTimeout(playTimeoutRef.current); } setPlaying(p => !p); }}>
        {/* Video Player */}
        <ReactPlayer
          url={video.videoUrl}
          width="100%"
          height="100%"
          playing={playing}
          muted={muted}
          loop
          style={{ position: 'absolute', top: 0, left: 0 }}
          onReady={() => setPlayerReady(true)}
          onError={(e) => { console.warn('Video error:', e); setPlaying(false); }}
          config={{ youtube: { playerVars: { controls: 0, modestbranding: 1, rel: 0, showinfo: 0 } } }}
        />

        {/* Thumbnail fallback */}
        {video.thumbnail && <img src={video.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: playing ? -1 : 1 }} />}

        {/* Play/Pause overlay */}
        <AnimatePresence>
          {!playing && (
            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="absolute inset-0 flex items-center justify-center z-10">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
                <Play className="w-7 h-7 text-white ml-1" fill="white" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Double-click heart */}
        <AnimatePresence>
          {showHeart && (
            <motion.div initial={{ opacity: 0, scale: 0.2 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.2, y: -40 }} transition={{ duration: 0.4 }} className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <Heart className="w-24 h-24 text-[#ff0050]" fill="#ff0050" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-[2]" />

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-[3]">
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="w-10 h-10 ring-2 ring-white/20">
              <AvatarImage src={video.user?.avatar} />
              <AvatarFallback>{(video.user?.displayName || 'U')[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white">{video.user?.username}</span>
                {video.user?.verified && <BadgeCheck className="w-3.5 h-3.5 text-[#00f5d4]" />}
              </div>
              <span className="text-[11px] text-white/50">{video.createdAt}</span>
            </div>
            {!following && (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={(e) => { e.stopPropagation(); setFollowing(true); }} className="ml-3 px-4 py-1.5 rounded-full text-xs font-bold text-white border border-[#ff0050] hover:bg-[#ff0050]/20 transition-colors">
                Follow
              </motion.button>
            )}
          </div>
          <p className="text-sm text-white/90 leading-relaxed mb-3 line-clamp-2">{video.description}</p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
              <Music className="w-3.5 h-3.5 text-white/70" />
              <span className="text-xs text-white/70 max-w-[180px] truncate">{video.music || 'Original Sound'}</span>
            </div>
          </div>
        </div>

        {/* Mute button */}
        <button onClick={(e) => { e.stopPropagation(); setMuted(!muted); }} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}>
          {muted ? <VolumeX className="w-4 h-4 text-white/80" /> : <Volume2 className="w-4 h-4 text-white/80" />}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col items-center gap-6">
        <motion.div className="action-btn" whileTap={{ scale: 0.85 }}>
          <motion.button onClick={handleLike} animate={liked ? { scale: [1, 1.3, 1] } : {}} className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${liked ? 'bg-[#ff0050]/20' : 'bg-white/[0.06] hover:bg-white/[0.1]'}`} style={liked ? { boxShadow: '0 0 20px rgba(255,0,80,0.3)' } : {}}>
            <Heart className={`w-6 h-6 ${liked ? 'text-[#ff0050]' : 'text-white'}`} fill={liked ? '#ff0050' : 'none'} />
          </motion.button>
          <span className={`text-xs font-semibold ${liked ? 'text-[#ff0050]' : 'text-white/60'}`}>{formatNumber(likeCount)}</span>
        </motion.div>

        <motion.div className="action-btn" whileTap={{ scale: 0.85 }}>
          <button onClick={() => setShowComments(true)} className="w-12 h-12 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.1] transition-colors">
            <MessageCircle className="w-6 h-6 text-white" />
          </button>
          <span className="text-xs font-semibold text-white/60">{formatNumber(video.comments || 0)}</span>
        </motion.div>

        <motion.div className="action-btn" whileTap={{ scale: 0.85 }}>
          <motion.button onClick={handleBookmark} animate={bookmarked ? { scale: [1, 1.3, 1] } : {}} className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${bookmarked ? 'bg-[#f5c518]/20' : 'bg-white/[0.06] hover:bg-white/[0.1]'}`}>
            <Bookmark className={`w-6 h-6 ${bookmarked ? 'text-[#f5c518]' : 'text-white'}`} fill={bookmarked ? '#f5c518' : 'none'} />
          </motion.button>
          <span className={`text-xs font-semibold ${bookmarked ? 'text-[#f5c518]' : 'text-white/60'}`}>{formatNumber(video.bookmarks || 0)}</span>
        </motion.div>

        <motion.div className="action-btn" whileTap={{ scale: 0.85 }}>
          <button onClick={() => setShowShare(true)} className="w-12 h-12 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.1] transition-colors">
            <Share2 className="w-6 h-6 text-white" />
          </button>
          <span className="text-xs font-semibold text-white/60">{formatNumber(video.shares || 0)}</span>
        </motion.div>

        <div className={`music-disc mt-2 ${playing ? 'animate-spin-slow' : ''}`}>
          <img src={video.user?.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
        </div>
      </div>

      {/* Comments Panel */}
      <AnimatePresence>
        {showComments && (
          <CommentsPanel video={video} onClose={() => setShowComments(false)} />
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <ShareModal open={showShare} onClose={() => setShowShare(false)} videoId={video.id} description={video.description} />
    </div>
  );
};

const CommentsPanel = ({ video, onClose }) => {
  const { requireAuth, isAuthenticated } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [localComments, setLocalComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await videosAPI.getComments(video.id);
        setLocalComments(res.data.comments || []);
      } catch (err) {
        setLocalComments(mockComments);
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [video.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!requireAuth()) return;
    try {
      const res = await videosAPI.createComment(video.id, commentText);
      setLocalComments([res.data, ...localComments]);
      setCommentText('');
    } catch (err) {
      console.error('Failed to post comment');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ y: 50, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 50, opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md h-[70vh] rounded-2xl overflow-hidden flex flex-col" style={{ background: 'rgba(15,15,25,0.95)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-base font-bold text-white">Comments</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/[0.06] transition-colors">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-white/10 border-t-[#ff0050] rounded-full animate-spin" />
            </div>
          ) : localComments.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-white/30">No comments yet. Be the first!</p>
            </div>
          ) : (
            localComments.map((comment, i) => (
              <motion.div key={comment.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="flex gap-3">
                <Avatar className="w-9 h-9 flex-shrink-0">
                  <AvatarImage src={comment.user?.avatar} />
                  <AvatarFallback>{(comment.user?.displayName || 'U')[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white/90">{comment.user?.username}</span>
                    <span className="text-[10px] text-white/30">{comment.time}</span>
                  </div>
                  <p className="text-sm text-white/70 mt-1 leading-relaxed">{comment.text}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <button className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/60 transition-colors">
                      <Heart className="w-3.5 h-3.5" />
                      {formatNumber(comment.likes || 0)}
                    </button>
                    <button className="text-[11px] text-white/40 hover:text-white/60 transition-colors">Reply</button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t border-white/[0.06] flex items-center gap-3">
          <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder={isAuthenticated ? "Add a comment..." : "Sign in to comment"} disabled={!isAuthenticated} className="flex-1 bg-white/[0.04] rounded-full px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none border border-white/[0.06] focus:border-[#ff0050]/30 transition-colors disabled:opacity-50" />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" disabled={!commentText.trim() || !isAuthenticated} className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30 transition-opacity" style={{ background: commentText.trim() && isAuthenticated ? '#ff0050' : 'rgba(255,255,255,0.06)' }}>
            <Send className="w-4 h-4 text-white" />
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
};

const FeedPage = ({ following: isFollowing }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [feedVideos, setFeedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const scrollRef = useRef(null);
  const { isAuthenticated } = useAuth();

  const fetchFeed = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum > 1) setLoadingMore(true);
    try {
      let res;
      if (isFollowing && isAuthenticated) {
        res = await videosAPI.getFollowingFeed(pageNum, 10);
      } else {
        res = await videosAPI.getFeed(pageNum, 10);
      }
      const vids = res.data.videos || [];
      const goodVids = vids.filter(v => v.thumbnail || (v.videoUrl && v.videoUrl.includes('youtube')));
      setHasMore(res.data.hasMore || false);

      if (append) {
        setFeedVideos(prev => [...prev, ...goodVids]);
      } else if (goodVids.length > 0) {
        setFeedVideos(goodVids);
      } else {
        setFeedVideos(mockVideos);
      }
    } catch (err) {
      if (!append) setFeedVideos(mockVideos);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [isFollowing, isAuthenticated]);

  useEffect(() => {
    fetchFeed(1);
  }, [fetchFeed]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const scrollTop = scrollRef.current.scrollTop;
    const itemHeight = scrollRef.current.clientHeight;
    const newIndex = Math.round(scrollTop / itemHeight);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }

    // Infinite scroll: load more when near the end
    if (newIndex >= feedVideos.length - 3 && hasMore && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFeed(nextPage, true);
    }
  }, [activeIndex, feedVideos.length, hasMore, loadingMore, page, fetchFeed]);

  const scrollToIndex = (index) => {
    if (scrollRef.current) {
      const itemHeight = scrollRef.current.clientHeight;
      scrollRef.current.scrollTo({ top: index * itemHeight, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-white/10 border-t-[#ff0050] rounded-full animate-spin" />
          <p className="text-xs text-white/30">Loading feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      <div ref={scrollRef} onScroll={handleScroll} className="snap-scroll h-full">
        {feedVideos.map((video, index) => (
          <VideoCard key={video.id} video={video} isActive={index === activeIndex} />
        ))}
      </div>

      {/* Navigation arrows */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-30">
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))} disabled={activeIndex === 0} className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-20 transition-opacity" style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)' }}>
          <ChevronUp className="w-5 h-5 text-white/70" />
        </motion.button>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => scrollToIndex(Math.min(feedVideos.length - 1, activeIndex + 1))} disabled={activeIndex === feedVideos.length - 1} className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-20 transition-opacity" style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)' }}>
          <ChevronDown className="w-5 h-5 text-white/70" />
        </motion.button>
      </div>
    </div>
  );
};

export default FeedPage;
