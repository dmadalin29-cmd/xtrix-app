import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home, Compass, Users, Radio, User, Search, Upload, Bell,
  MessageCircle, Settings, LogOut, BadgeCheck, Plus,
  ChevronDown, ChevronUp, Sparkles, Coins, Video
} from 'lucide-react';
import { formatNumber } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';
import { discoverAPI, notificationsAPI } from '../../services/api';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import WalletModal from '../WalletModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

const navItems = [
  { path: '/', label: 'For You', icon: Home },
  { path: '/discover', label: 'Discover', icon: Compass },
  { path: '/following', label: 'Following', icon: Users },
  { path: '/live', label: 'LIVE', icon: Radio, badge: true },
  { path: '/golive', label: 'Go Live', icon: Video, requireAuth: true },
  { path: '/profile', label: 'Profile', icon: User },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { requireAuth } = useAuth();
  const [showAllSuggested, setShowAllSuggested] = useState(false);
  const [suggestedAccounts, setSuggestedAccounts] = useState([]);

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        const res = await discoverAPI.getCreators(5);
        setSuggestedAccounts(res.data);
      } catch (err) {
        // Silently fail - sidebar still works
      }
    };
    fetchCreators();
  }, []);

  const displayedAccounts = showAllSuggested ? suggestedAccounts : suggestedAccounts.slice(0, 3);

  const handleNavClick = (path) => {
    if (path === '/following' || path === '/profile' || path === '/golive') {
      requireAuth(() => navigate(path));
    } else {
      navigate(path);
    }
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[280px] z-40 flex flex-col border-r border-white/[0.06]" style={{ background: 'rgba(5,5,10,0.95)', backdropFilter: 'blur(40px)' }}>
      {/* Logo */}
      <div className="px-6 py-5 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #ff0050, #ff3366)' }}>
          <Sparkles className="w-5 h-5 text-white" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.2))' }} />
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight text-white">KdM</span>
          <span className="text-[10px] text-white/30 block -mt-0.5 tracking-widest uppercase">Klip de Moment</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-3 mt-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <motion.div
              key={item.path}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNavClick(item.path)}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.5} />
              <span className={`text-[15px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
              {item.badge && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center">
                  <span className="absolute h-2.5 w-2.5 rounded-full bg-red-500 animate-ping opacity-75" />
                  <span className="relative h-2 w-2 rounded-full bg-red-500" />
                </span>
              )}
            </motion.div>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-5 my-4 h-px bg-white/[0.06]" />

      {/* Suggested Accounts */}
      <div className="px-4 flex-1 overflow-y-auto">
        <p className="text-xs font-semibold text-white/30 uppercase tracking-wider px-2 mb-3">Suggested</p>
        <div className="space-y-1">
          {displayedAccounts.map((account) => (
            <motion.div
              key={account.id}
              whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.04)' }}
              className="flex items-center gap-3 px-2 py-2 rounded-xl cursor-pointer"
              onClick={() => navigate(`/profile/${account.username}`)}
            >
              <div className="relative">
                <Avatar className="w-9 h-9 ring-2 ring-white/10">
                  <AvatarImage src={account.avatar} alt={account.username} />
                  <AvatarFallback>{(account.displayName || 'U')[0]}</AvatarFallback>
                </Avatar>
                {account.verified && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#00f5d4] flex items-center justify-center">
                    <BadgeCheck className="w-3 h-3 text-black" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white/90 truncate">{account.username}</p>
                <p className="text-xs text-white/40 truncate">{account.displayName}</p>
              </div>
            </motion.div>
          ))}
          {suggestedAccounts.length === 0 && (
            <p className="text-xs text-white/20 px-2 py-4 text-center">No creators yet</p>
          )}
        </div>
        {suggestedAccounts.length > 3 && (
          <button
            className="flex items-center gap-1.5 px-2 py-2 mt-1 text-xs font-semibold text-[#ff0050] hover:text-[#ff3366] transition-colors"
            onClick={() => setShowAllSuggested(!showAllSuggested)}
          >
            {showAllSuggested ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showAllSuggested ? 'Show Less' : 'See All'}
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/[0.06]">
        <p className="text-[10px] text-white/20 text-center leading-relaxed">&copy; 2025 KdM &middot; Terms &middot; Privacy &middot; Safety</p>
      </div>
    </aside>
  );
};

const Header = ({ showWalletModal, setShowWalletModal }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, setShowAuthModal, logout, requireAuth } = useAuth();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (isAuthenticated) {
      notificationsAPI.getAll().then(res => setNotifications(res.data || [])).catch(() => {});
    }
  }, [isAuthenticated]);

  return (
    <header className="fixed top-0 left-[280px] right-0 h-16 z-50 flex items-center justify-between px-6" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(30px)' }}>
      {/* Search */}
      <div className="flex-1 max-w-[460px]">
        <motion.div
          animate={{
            borderColor: searchFocused ? 'rgba(255,0,80,0.3)' : 'rgba(255,255,255,0.06)',
            boxShadow: searchFocused ? '0 0 20px rgba(255,0,80,0.1)' : 'none'
          }}
          className="relative rounded-full border overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search KdM..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onKeyDown={(e) => { if (e.key === 'Enter' && searchQuery.trim()) navigate(`/discover?q=${searchQuery}`); }}
            className="w-full bg-transparent text-sm text-white placeholder-white/30 pl-11 pr-4 py-2.5 outline-none"
          />
          {searchQuery && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ background: 'rgba(255,0,80,0.8)' }}
              onClick={() => navigate(`/discover?q=${searchQuery}`)}
            >
              Search
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {isAuthenticated && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowWalletModal(true)}
                  className="relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white border border-[#FFD700]/20 hover:border-[#FFD700]/40 transition-colors"
                  style={{ background: 'rgba(255,215,0,0.06)' }}
                >
                  <Coins className="w-4 h-4 text-[#FFD700]" />
                  <span className="text-[#FFD700]">{user?.walletBalance || 0}</span>
                </motion.button>
              </TooltipTrigger>
              <TooltipContent><p>Portofel</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => requireAuth(() => navigate('/upload'))}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white border border-white/10 hover:border-[#ff0050]/40 transition-colors" style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <Plus className="w-4 h-4" />
                Upload
              </motion.button>
            </TooltipTrigger>
            <TooltipContent><p>Upload video</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {isAuthenticated ? (
          <>
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/[0.05] transition-colors"
                >
                  <Bell className="w-5 h-5 text-white/60" />
                  {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ff0050]" />}
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 rounded-2xl p-2" style={{ background: 'rgba(15,15,25,0.95)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold text-white">Notifications</p>
                </div>
                <DropdownMenuSeparator className="bg-white/[0.06]" />
                {notifications.length > 0 ? notifications.slice(0, 5).map((notif) => (
                  <DropdownMenuItem key={notif.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer focus:bg-white/[0.05]">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={notif.user?.avatar} />
                      <AvatarFallback>{(notif.user?.displayName || 'U')[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/80"><span className="font-semibold text-white">{notif.user?.username}</span> {notif.text}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">{notif.time}</p>
                    </div>
                  </DropdownMenuItem>
                )) : (
                  <div className="px-3 py-6 text-center">
                    <p className="text-xs text-white/30">No notifications yet</p>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Messages */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/[0.05] transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-white/60" />
            </motion.button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button whileHover={{ scale: 1.05 }} className="ml-1">
                  <Avatar className="w-9 h-9 ring-2 ring-white/10 hover:ring-[#ff0050]/30 transition-all cursor-pointer">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback>{(user?.displayName || 'U')[0]}</AvatarFallback>
                  </Avatar>
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2" style={{ background: 'rgba(15,15,25,0.95)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer focus:bg-white/[0.05]" onClick={() => navigate('/profile')}>
                  <User className="w-4 h-4 text-white/60" />
                  <span className="text-sm text-white/80">View Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer focus:bg-white/[0.05]">
                  <Settings className="w-4 h-4 text-white/60" />
                  <span className="text-sm text-white/80">Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/[0.06]" />
                <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer focus:bg-white/[0.05]" onClick={logout}>
                  <LogOut className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-400">Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAuthModal(true)}
            className="px-6 py-2 rounded-full text-sm font-bold text-white"
            style={{ background: '#ff0050', boxShadow: '0 0 20px rgba(255,0,80,0.3)' }}
          >
            Sign In
          </motion.button>
        )}
      </div>
    </header>
  );
};

const Layout = ({ children }) => {
  const [showWalletModal, setShowWalletModal] = useState(false);

  return (
    <div className="h-screen overflow-hidden relative noise-overlay">
      {/* Ambient gradient orbs */}
      <div className="gradient-orb-1" />
      <div className="gradient-orb-2" />

      <Sidebar />
      <Header showWalletModal={showWalletModal} setShowWalletModal={setShowWalletModal} />
      <main className="ml-[280px] mt-16 h-[calc(100vh-64px)] overflow-y-auto relative z-10">
        {children}
      </main>

      {/* Wallet Modal */}
      <WalletModal open={showWalletModal} onClose={() => setShowWalletModal(false)} />
    </div>
  );
};

export default Layout;
