import React, { useState, useRef, useCallback, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Heart, MessageCircle, Share2, Bookmark, Music, Volume2,
  VolumeX, Play, ChevronUp, ChevronDown, BadgeCheck,
  Send, X, Radio, Eye
} from 'lucide-react';
import { videos as mockVideos, comments as mockComments, formatNumber } from '../data/mockData';
import { videosAPI, liveAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import ReactPlayer from 'react-player';
import ShareModal from '../components/share/ShareModal';
import StoriesBar from '../components/stories/StoriesBar';

// Lazy load ShareModal for better performance
const LazyShareModal = lazy(() => import('../components/share/ShareModal'));

const VideoCard = React.memo(({ video, isActive }) => {
  const { requireAuth, isAuthenticated } = useAuth();
  const navigate = useNavigate();
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

  // Detect if this is a live stream card
  const isLiveStream = video.isLiveStream === true;

  // For live streams, handle click to navigate
  const handleLiveClick = () => {
    if (isLiveStream) {
      navigate(`/watch/${video.streamId}`);
    }
  };

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
    <div className="snap-item flex items-center justify-center py-0 px-0" style={{ height: 'calc(100dvh - 64px)' }}>
      {/* Video Container - FULL SCREEN cu overlays */}
      <div 
        className={`relative w-full h-full ${isLiveStream ? 'cursor-pointer' : ''}`} 
        style={{ background: 'rgba(0,0,0,1)' }} 
        onDoubleClick={isLiveStream ? handleLiveClick : handleDoubleClick} 
        onClick={isLiveStream ? handleLiveClick : () => { if (playTimeoutRef.current) { clearTimeout(playTimeoutRef.current); } setPlaying(p => !p); }}
      >
        {/* Live Stream Badge (if is live) - OVERLAY absolute */}
        {isLiveStream && (
          <div className="absolute top-4 left-4 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: '#ff0050' }}>
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-xs font-bold text-white font-body">LIVE</span>
          </div>
        )}

        {/* Video Player (or Live Stream Preview) - FULL SCREEN */}
        {isLiveStream ? (
          // Live stream preview (thumbnail or placeholder)
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-pink-900/40 to-black flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 mx-auto" style={{ background: 'rgba(255,0,80,0.2)' }}>
                <Radio className="w-10 h-10 text-[#ff0050]" />
              </div>
              <p className="text-white/90 text-lg font-bold font-display mb-1" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>{video.description}</p>
              <p className="text-white/50 text-sm font-body" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>Tap pentru a viziona LIVE</p>
              <div className="flex items-center gap-2 justify-center mt-3">
                <Eye className="w-4 h-4 text-white/60" />
                <span className="text-sm font-bold text-white/80 font-body" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>{video.views} viewers</span>
              </div>
            </div>
          </div>
        ) : (
          <ReactPlayer
            url={video.videoUrl}
            width="100%"
            height="100%"
            playing={playing}
            muted={muted}
            loop
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            onReady={() => setPlayerReady(true)}
            onError={(e) => { console.warn('Video error:', e); setPlaying(false); }}
            config={{ 
              youtube: { 
                playerVars: { 
                  controls: 0, 
                  modestbranding: 1, 
                  rel: 0, 
                  showinfo: 0,
                  iv_load_policy: 3,
                  fs: 0
                } 
              },
              file: {
                attributes: {
                  style: { width: '100%', height: '100%', objectFit: 'cover' }
                }
              }
            }}
          />
        )}

        {/* Thumbnail fallback */}
        {video.thumbnail && !playing && <img src={video.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 1 }} />}

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

        {/* Bottom info overlay - TikTok style compact */}
        <div className="absolute bottom-20 sm:bottom-24 left-3 sm:left-4 right-20 sm:right-24 z-[3]">
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="w-9 h-9 sm:w-10 sm:h-10 ring-2 ring-white/30 cursor-pointer" onClick={(e) => { e.stopPropagation(); navigate(`/profile/${video.user?.username}`); }}>
              <AvatarImage src={video.user?.avatar} />
              <AvatarFallback>{(video.user?.displayName || 'U')[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-bold text-white font-body" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.95)' }}>{video.user?.username}</span>
                {video.user?.verified && <BadgeCheck className="w-4 h-4 text-[#00f5d4]" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }} />}
              </div>
              {!following && !isLiveStream && (
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }} 
                  onClick={(e) => { e.stopPropagation(); setFollowing(true); }} 
                  className="px-3 py-1 rounded-full text-xs font-bold text-white font-body"
                  style={{ background: '#ff0050', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
                >
                  Follow
                </motion.button>
              )}
            </div>
          </div>
          <p className="text-sm sm:text-base text-white leading-snug mb-2 line-clamp-2 font-body" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.95)' }}>{video.description}</p>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full inline-flex" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)' }}>
            <Music className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/80" />
            <span className="text-xs text-white/80 max-w-[140px] sm:max-w-[180px] truncate font-body" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>{video.music || 'Original Sound'}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons - TikTok style (absolute right, bottom) */}
      <div className="absolute bottom-20 sm:bottom-24 right-3 sm:right-4 z-[90] flex flex-col items-center gap-3 sm:gap-4">
        <motion.div className="action-btn" whileTap={{ scale: 0.85 }}>
          <motion.button onClick={isLiveStream ? handleLiveClick : handleLike} animate={liked ? { scale: [1, 1.3, 1] } : {}} className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-colors ${liked ? 'bg-[#ff0050]/20' : 'bg-black/30 hover:bg-black/40'}`} style={liked ? { boxShadow: '0 0 20px rgba(255,0,80,0.4)', backdropFilter: 'blur(10px)' } : { backdropFilter: 'blur(10px)' }}>
            <Heart className={`w-6 h-6 sm:w-7 sm:h-7 ${liked ? 'text-[#ff0050]' : 'text-white'}`} fill={liked ? '#ff0050' : 'none'} />
          </motion.button>
          <span className={`text-xs sm:text-sm font-bold font-body mt-1 ${liked ? 'text-[#ff0050]' : 'text-white'}`} style={{ textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>{formatNumber(likeCount)}</span>
        </motion.div>

        <motion.div className="action-btn" whileTap={{ scale: 0.85 }}>
          <button onClick={() => !isLiveStream && setShowComments(true)} disabled={isLiveStream} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors disabled:opacity-50" style={{ backdropFilter: 'blur(10px)' }}>
            <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </button>
          <span className="text-xs sm:text-sm font-bold text-white font-body mt-1" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>{formatNumber(video.comments || 0)}</span>
        </motion.div>

        <motion.div className="action-btn" whileTap={{ scale: 0.85 }}>
          <motion.button onClick={handleBookmark} animate={bookmarked ? { scale: [1, 1.3, 1] } : {}} className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-colors ${bookmarked ? 'bg-[#f5c518]/20' : 'bg-black/30 hover:bg-black/40'}`} style={{ backdropFilter: 'blur(10px)' }}>
            <Bookmark className={`w-6 h-6 sm:w-7 sm:h-7 ${bookmarked ? 'text-[#f5c518]' : 'text-white'}`} fill={bookmarked ? '#f5c518' : 'none'} />
          </motion.button>
          <span className={`text-xs sm:text-sm font-bold font-body mt-1 ${bookmarked ? 'text-[#f5c518]' : 'text-white'}`} style={{ textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>{formatNumber(video.bookmarks || 0)}</span>
        </motion.div>

        <motion.div className="action-btn" whileTap={{ scale: 0.85 }}>
          <button onClick={() => setShowShare(true)} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors" style={{ backdropFilter: 'blur(10px)' }}>
            <Share2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </button>
          <span className="text-xs sm:text-sm font-bold text-white font-body mt-1" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>{formatNumber(video.shares || 0)}</span>
        </motion.div>

        <div className={`music-disc mt-1 ${!isLiveStream && playing ? 'animate-spin-slow' : ''}`}>
          <img src={video.user?.avatar} alt="" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-white/20" />
        </div>
      </div>

      {/* Comments Panel */}
      <AnimatePresence>
        {showComments && (
          <CommentsPanel video={video} onClose={() => setShowComments(false)} />
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <Suspense fallback={null}>
        <LazyShareModal open={showShare} onClose={() => setShowShare(false)} videoId={video.id} description={video.description} />
      </Suspense>
    </div>
  );
});

// Nested Reply Component
const CommentReply = React.memo(({ reply, commentId, onLike }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(reply.likes || 0);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    onLike && onLike(commentId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex gap-2 ml-11 mt-3"
    >
      <Avatar className="w-7 h-7 flex-shrink-0">
        <AvatarImage src={reply.user?.avatar} />
        <AvatarFallback>{(reply.user?.username || 'U')[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white/80 font-body">{reply.user?.username}</span>
          <span className="text-[10px] text-white/30 font-body">{reply.time}</span>
        </div>
        <p className="text-xs text-white/60 mt-0.5 leading-relaxed font-body">{reply.text}</p>
        <button
          onClick={handleLike}
          className="flex items-center gap-1 text-[10px] text-white/30 hover:text-[#ff0050] transition-colors mt-1.5"
        >
          <Heart className={`w-3 h-3 ${liked ? 'fill-[#ff0050] text-[#ff0050]' : ''}`} />
          {likeCount > 0 && likeCount}
        </button>
      </div>
    </motion.div>
  );
});

// Single Comment Item with Nested Replies
const CommentItem = React.memo(({ comment, videoId, onReplySuccess }) => {
  const { requireAuth } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likes || 0);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState([]);
  const [showReplies, setShowReplies] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const handleLike = async () => {
    if (!requireAuth()) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(newLiked ? likeCount + 1 : likeCount - 1);
    try {
      const res = await videosAPI.likeComment(comment.id);
      setLiked(res.data.liked);
      setLikeCount(res.data.likeCount);
    } catch (err) {
      setLiked(!newLiked);
      setLikeCount(newLiked ? likeCount : likeCount + 1);
    }
  };

  const loadReplies = async () => {
    if (replies.length > 0) {
      setShowReplies(!showReplies);
      return;
    }
    setLoadingReplies(true);
    try {
      const res = await videosAPI.getCommentReplies(comment.id);
      setReplies(res.data.replies || []);
      setShowReplies(true);
    } catch (err) {
      console.error('Failed to load replies:', err);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !requireAuth()) return;
    try {
      const res = await videosAPI.createCommentReply(comment.id, replyText);
      setReplies([...replies, res.data]);
      setReplyText('');
      setShowReplyInput(false);
      setShowReplies(true);
      onReplySuccess && onReplySuccess();
    } catch (err) {
      console.error('Failed to post reply:', err);
    }
  };

  return (
    <div>
      {/* Main Comment */}
      <div className="flex gap-3">
        <Avatar className="w-9 h-9 flex-shrink-0">
          <AvatarImage src={comment.user?.avatar} />
          <AvatarFallback>{(comment.user?.displayName || 'U')[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white/90 font-body">{comment.user?.username}</span>
            <span className="text-[10px] text-white/30 font-body">{comment.time}</span>
          </div>
          <p className="text-sm text-white/70 mt-1 leading-relaxed font-body">{comment.text}</p>
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-[11px] transition-colors font-body ${
                liked ? 'text-[#ff0050]' : 'text-white/40 hover:text-white/60'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-[#ff0050]' : ''}`} />
              {likeCount > 0 && formatNumber(likeCount)}
            </button>
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="text-[11px] text-white/40 hover:text-white/60 transition-colors font-body"
            >
              Reply
            </button>
            {comment.replies > 0 && (
              <button
                onClick={loadReplies}
                className="text-[11px] text-[#ff0050]/60 hover:text-[#ff0050] transition-colors font-bold font-body"
              >
                {loadingReplies ? (
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 border border-white/20 border-t-[#ff0050] rounded-full animate-spin" />
                    Loading...
                  </span>
                ) : showReplies ? (
                  `Hide ${comment.replies} ${comment.replies === 1 ? 'reply' : 'replies'}`
                ) : (
                  `View ${comment.replies} ${comment.replies === 1 ? 'reply' : 'replies'}`
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reply Input */}
      <AnimatePresence>
        {showReplyInput && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleReplySubmit}
            className="ml-11 mt-3 flex items-center gap-2"
          >
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Răspunde la @${comment.user?.username}...`}
              autoFocus
              className="flex-1 bg-white/[0.04] rounded-full px-3 py-2 text-xs text-white placeholder-white/30 outline-none border border-white/[0.08] focus:border-[#ff0050]/40 font-body"
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={!replyText.trim()}
              className="px-3 py-2 rounded-full text-[10px] font-bold text-white disabled:opacity-30 transition-opacity font-body"
              style={{ background: replyText.trim() ? '#ff0050' : 'rgba(255,255,255,0.06)' }}
            >
              Send
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Nested Replies */}
      <AnimatePresence>
        {showReplies && replies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {replies.map((reply) => (
              <CommentReply key={reply.id} reply={reply} commentId={comment.id} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

const CommentsPanel = React.memo(({ video, onClose }) => {
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

  const handleReplySuccess = () => {
    // Optionally refresh comments to update reply count
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ y: 50, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 50, opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md h-[70vh] rounded-2xl overflow-hidden flex flex-col" style={{ background: 'rgba(15,15,25,0.95)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-base font-bold text-white font-display">Comments</h3>
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
              <MessageCircle className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/30 font-body">Niciun comentariu încă. Fii primul!</p>
            </div>
          ) : (
            localComments.map((comment, i) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <CommentItem comment={comment} videoId={video.id} onReplySuccess={handleReplySuccess} />
              </motion.div>
            ))
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t border-white/[0.06] flex items-center gap-3">
          <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder={isAuthenticated ? "Adaugă un comentariu..." : "Loghează-te pentru a comenta"} disabled={!isAuthenticated} className="flex-1 bg-white/[0.04] rounded-full px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none border border-white/[0.06] focus:border-[#ff0050]/30 transition-colors disabled:opacity-50 font-body" />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" disabled={!commentText.trim() || !isAuthenticated} className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30 transition-opacity" style={{ background: commentText.trim() && isAuthenticated ? '#ff0050' : 'rgba(255,255,255,0.06)' }}>
            <Send className="w-4 h-4 text-white" />
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
});

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
      let vids = res.data.videos || [];
      setHasMore(res.data.hasMore || false);

      // Fetch active live streams and mix into feed (only for page 1, For You feed)
      if (pageNum === 1 && !isFollowing) {
        try {
          const liveRes = await liveAPI.getActiveStreams();
          const liveStreams = (liveRes.data || []).slice(0, 2); // Max 2 live streams in feed
          
          // Transform live streams to video card format with special "LIVE" marker
          const liveCards = liveStreams.map(stream => ({
            id: stream.id,
            isLiveStream: true, // Special marker
            user: stream.user,
            description: stream.title,
            music: 'LIVE Stream',
            likes: stream.likes || 0,
            comments: 0,
            shares: 0,
            bookmarks: 0,
            views: stream.currentViewers || 0,
            videoUrl: stream.hlsUrl || '',
            thumbnail: '',
            hashtags: stream.hashtags || [],
            createdAt: stream.createdAt,
            streamId: stream.id
          }));
          
          // Insert live streams at positions 0 and 3 (beginning and after 2 videos)
          if (liveCards.length > 0) {
            vids = [liveCards[0], ...vids.slice(0, 2), ...(liveCards[1] ? [liveCards[1]] : []), ...vids.slice(2)];
          }
        } catch (err) {
          console.log('No live streams to mix in feed');
        }
      }

      if (append) {
        setFeedVideos(prev => [...prev, ...vids]);
      } else if (vids.length > 0) {
        setFeedVideos(vids);
      } else {
        // Backend nu are videos - use mock data for demo
        console.log('No videos from backend, using mock data');
        setFeedVideos(mockVideos);
      }
    } catch (err) {
      console.error('Feed fetch error:', err);
      if (!append) {
        console.log('API failed, loading mock data instantly');
        setFeedVideos(mockVideos);
      }
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
    <div className="h-full relative flex flex-col">
      {/* Stories Bar */}
      {!isFollowing && (
        <div className="border-b border-white/[0.04] flex-shrink-0">
          <StoriesBar />
        </div>
      )}
      <div ref={scrollRef} onScroll={handleScroll} className="snap-scroll flex-1">
        {feedVideos.map((video, index) => (
          <VideoCard key={video.id} video={video} isActive={index === activeIndex} />
        ))}
        {loadingMore && (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-white/10 border-t-[#ff0050] rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Navigation arrows - DESKTOP ONLY */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 flex-col gap-2 z-30 hidden lg:flex">
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
