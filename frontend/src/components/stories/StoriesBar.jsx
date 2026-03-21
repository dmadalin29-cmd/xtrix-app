import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ChevronLeft, ChevronRight, Heart, Send, Eye, Clock } from 'lucide-react';
import { users as mockUsers, formatNumber } from '../../data/mockData';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { useAuth } from '../../contexts/AuthContext';

// Mock stories
const mockStories = [
  { id: 's1', user: mockUsers[0], image: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=600&h=1000&fit=crop', caption: 'Dance practice today!', time: '2h', views: 12400, liked: false },
  { id: 's2', user: mockUsers[1], image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=1000&fit=crop', caption: 'New recipe coming', time: '3h', views: 8900, liked: false },
  { id: 's3', user: mockUsers[2], image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=1000&fit=crop', caption: 'Tech unboxing', time: '5h', views: 15600, liked: false },
  { id: 's4', user: mockUsers[3], image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&h=1000&fit=crop', caption: 'Santorini vibes', time: '6h', views: 6700, liked: false },
  { id: 's5', user: mockUsers[4], image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=1000&fit=crop', caption: 'Morning gains', time: '8h', views: 9200, liked: false },
  { id: 's6', user: mockUsers[5], image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=1000&fit=crop', caption: 'New artwork', time: '10h', views: 4300, liked: false },
  { id: 's7', user: mockUsers[6], image: 'https://images.unsplash.com/photo-1586105449897-20b5efeb3233?w=600&h=1000&fit=crop', caption: 'BTS of the sketch', time: '12h', views: 18900, liked: false },
  { id: 's8', user: mockUsers[7], image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=1000&fit=crop', caption: 'Studio session', time: '14h', views: 11200, liked: false },
];

const StoryViewer = ({ stories, startIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [liked, setLiked] = useState({});
  const [progress, setProgress] = useState(0);
  const story = stories[currentIndex];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex(i => i + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return p + 2;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [currentIndex, stories.length, onClose]);

  React.useEffect(() => { setProgress(0); }, [currentIndex]);

  const goNext = () => { if (currentIndex < stories.length - 1) { setCurrentIndex(i => i + 1); setProgress(0); } else onClose(); };
  const goPrev = () => { if (currentIndex > 0) { setCurrentIndex(i => i - 1); setProgress(0); } };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90">
      <button onClick={onClose} className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors">
        <X className="w-5 h-5 text-white" />
      </button>

      {/* Navigation */}
      <button onClick={goPrev} disabled={currentIndex === 0} className="absolute left-4 z-20 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 disabled:opacity-20">
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>
      <button onClick={goNext} className="absolute right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20">
        <ChevronRight className="w-5 h-5 text-white" />
      </button>

      {/* Story Content */}
      <motion.div key={currentIndex} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-[380px] h-[680px] rounded-2xl overflow-hidden" style={{ boxShadow: '0 0 60px rgba(0,0,0,0.5)' }}>
        <img src={story.image} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/20">
              <div className="h-full rounded-full bg-white transition-all" style={{ width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%' }} />
            </div>
          ))}
        </div>

        {/* User info */}
        <div className="absolute top-8 left-3 right-3 flex items-center gap-2 z-10">
          <Avatar className="w-8 h-8 ring-2 ring-white/30">
            <AvatarImage src={story.user.avatar} />
            <AvatarFallback>{story.user.displayName[0]}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-bold text-white">{story.user.username}</span>
          <span className="text-xs text-white/50 flex items-center gap-1"><Clock className="w-3 h-3" /> {story.time}</span>
        </div>

        {/* Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          <p className="text-sm text-white mb-3">{story.caption}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-white/50">
              <Eye className="w-3.5 h-3.5" /> {formatNumber(story.views)}
            </div>
            <div className="flex items-center gap-3">
              <motion.button whileTap={{ scale: 0.8 }} onClick={() => setLiked(p => ({ ...p, [story.id]: !p[story.id] }))} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <Heart className={`w-5 h-5 ${liked[story.id] ? 'text-[#ff0050]' : 'text-white'}`} fill={liked[story.id] ? '#ff0050' : 'none'} />
              </motion.button>
              <motion.button whileTap={{ scale: 0.8 }} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <Send className="w-5 h-5 text-white" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const StoriesBar = () => {
  const { user } = useAuth();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStart, setViewerStart] = useState(0);

  const openStory = (index) => {
    setViewerStart(index);
    setViewerOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-4 px-6 py-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {/* Add Story */}
        <motion.div whileHover={{ scale: 1.05 }} className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer">
          <div className="w-16 h-16 rounded-full flex items-center justify-center relative" style={{ background: 'rgba(255,255,255,0.04)', border: '2px dashed rgba(255,255,255,0.15)' }}>
            {user?.avatar ? (
              <>
                <Avatar className="w-14 h-14"><AvatarImage src={user.avatar} /><AvatarFallback>{(user.displayName||'U')[0]}</AvatarFallback></Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#ff0050] flex items-center justify-center ring-2 ring-black">
                  <Plus className="w-3 h-3 text-white" />
                </div>
              </>
            ) : (
              <Plus className="w-6 h-6 text-white/40" />
            )}
          </div>
          <span className="text-[10px] text-white/40">Your story</span>
        </motion.div>

        {/* Stories */}
        {mockStories.map((story, i) => (
          <motion.div key={story.id} whileHover={{ scale: 1.05 }} onClick={() => openStory(i)} className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer">
            <div className="w-16 h-16 rounded-full p-0.5" style={{ background: 'linear-gradient(135deg, #ff0050, #ff6b6b, #00f5d4)' }}>
              <Avatar className="w-full h-full ring-2 ring-black">
                <AvatarImage src={story.user.avatar} />
                <AvatarFallback>{story.user.displayName[0]}</AvatarFallback>
              </Avatar>
            </div>
            <span className="text-[10px] text-white/50 max-w-[60px] truncate">{story.user.username}</span>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {viewerOpen && (
          <StoryViewer stories={mockStories} startIndex={viewerStart} onClose={() => setViewerOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

export default StoriesBar;
