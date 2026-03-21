import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, Send, Search, ArrowLeft, Check, CheckCheck,
  MoreHorizontal, Phone, Video, Info, Smile, Image, Paperclip
} from 'lucide-react';
import { messagesAPI, discoverAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';

const MessagesPage = () => {
  const { user, isAuthenticated, requireAuth } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchConversations();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [isAuthenticated]);

  const fetchConversations = async () => {
    try {
      const res = await messagesAPI.getConversations();
      setConversations(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openConversation = async (convo) => {
    setActiveConvo(convo);
    try {
      const res = await messagesAPI.getMessages(convo.id);
      setMessages(res.data.messages || []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) { console.error(err); }
    // Poll for new messages
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await messagesAPI.getMessages(convo.id);
        setMessages(res.data.messages || []);
      } catch (e) {}
    }, 5000);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConvo) return;
    const text = messageText;
    setMessageText('');
    try {
      const res = await messagesAPI.sendMessage(activeConvo.id, text);
      setMessages(prev => [...prev, res.data]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      fetchConversations();
    } catch (err) { console.error(err); }
  };

  const startNewConversation = async (targetUser) => {
    try {
      const res = await messagesAPI.createConversation(targetUser.id);
      setShowSearch(false);
      setSearchQuery('');
      await fetchConversations();
      openConversation(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await discoverAPI.search(q, 'users');
      setSearchResults((res.data.users || []).filter(u => u.id !== user?.id));
    } catch (err) { setSearchResults([]); }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <MessageCircle className="w-16 h-16 text-white/20 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2 font-display">Sign in to message</h2>
        <p className="text-sm text-white/40 mb-6 font-body">Connect with friends and creators</p>
        <motion.button whileHover={{ scale: 1.05 }} onClick={() => requireAuth()} className="px-8 py-3 rounded-xl text-sm font-bold text-white font-body" style={{ background: '#ff0050' }}>Sign In</motion.button>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Conversation List */}
      <div className="w-[340px] border-r border-white/[0.06] flex flex-col" style={{ background: 'rgba(255,255,255,0.01)' }}>
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Messages</h2>
            <motion.button whileHover={{ scale: 1.1 }} onClick={() => setShowSearch(!showSearch)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/[0.06] transition-colors">
              <Search className="w-4 h-4 text-white/50" />
            </motion.button>
          </div>
          <AnimatePresence>
            {showSearch && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                <input type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} placeholder="Search users..." className="w-full bg-white/[0.04] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none border border-white/[0.06] focus:border-[#ff0050]/30 transition-colors mb-2" autoFocus />
                {searchResults.length > 0 && (
                  <div className="space-y-1 max-h-[200px] overflow-y-auto">
                    {searchResults.map(u => (
                      <motion.div key={u.id} whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }} onClick={() => startNewConversation(u)} className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer">
                        <Avatar className="w-8 h-8"><AvatarImage src={u.avatar} /><AvatarFallback>{(u.displayName||'U')[0]}</AvatarFallback></Avatar>
                        <div><p className="text-sm font-medium text-white">{u.username}</p><p className="text-xs text-white/40">{u.displayName}</p></div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10"><div className="w-6 h-6 border-2 border-white/10 border-t-[#ff0050] rounded-full animate-spin" /></div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4">
              <MessageCircle className="w-10 h-10 text-white/15 mb-3" />
              <p className="text-sm text-white/30 text-center">No conversations yet</p>
              <p className="text-xs text-white/20 text-center mt-1">Search for users to start chatting</p>
            </div>
          ) : conversations.map(convo => (
            <motion.div key={convo.id} whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }} onClick={() => openConversation(convo)} className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-l-2 transition-all ${activeConvo?.id === convo.id ? 'border-[#ff0050] bg-white/[0.03]' : 'border-transparent'}`}>
              <div className="relative">
                <Avatar className="w-11 h-11"><AvatarImage src={convo.user?.avatar} /><AvatarFallback>{(convo.user?.displayName||'U')[0]}</AvatarFallback></Avatar>
                {convo.unread > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#ff0050] text-[9px] font-bold text-white flex items-center justify-center">{convo.unread}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between"><p className="text-sm font-semibold text-white truncate">{convo.user?.displayName || convo.user?.username}</p><span className="text-[10px] text-white/30 flex-shrink-0">{convo.lastMessageTime}</span></div>
                <p className={`text-xs truncate mt-0.5 ${convo.unread > 0 ? 'text-white/70 font-medium' : 'text-white/35'}`}>{convo.lastMessage || 'Start a conversation'}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConvo ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex items-center gap-3">
                <Avatar className="w-9 h-9"><AvatarImage src={activeConvo.user?.avatar} /><AvatarFallback>{(activeConvo.user?.displayName||'U')[0]}</AvatarFallback></Avatar>
                <div><p className="text-sm font-semibold text-white">{activeConvo.user?.displayName || activeConvo.user?.username}</p><p className="text-[10px] text-[#00f5d4]">Online</p></div>
              </div>
              <div className="flex items-center gap-2">
                {[Phone, Video, Info].map((Icon, i) => (
                  <motion.button key={i} whileHover={{ scale: 1.1 }} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/[0.06] transition-colors"><Icon className="w-4 h-4 text-white/50" /></motion.button>
                ))}
              </div>
            </div>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, i) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-end gap-2 max-w-[65%] ${msg.isOwn ? 'flex-row-reverse' : ''}`}>
                    {!msg.isOwn && <Avatar className="w-7 h-7 flex-shrink-0"><AvatarImage src={msg.sender?.avatar} /><AvatarFallback>{(msg.sender?.displayName||'U')[0]}</AvatarFallback></Avatar>}
                    <div className={`px-4 py-2.5 rounded-2xl ${msg.isOwn ? 'rounded-br-md' : 'rounded-bl-md'}`} style={{ background: msg.isOwn ? '#ff0050' : 'rgba(255,255,255,0.06)' }}>
                      <p className="text-sm text-white leading-relaxed">{msg.text}</p>
                      <div className={`flex items-center gap-1 mt-1 ${msg.isOwn ? 'justify-end' : ''}`}>
                        <span className="text-[9px] text-white/40">{msg.time}</span>
                        {msg.isOwn && <CheckCheck className={`w-3 h-3 ${msg.read ? 'text-[#00f5d4]' : 'text-white/30'}`} />}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-white/[0.06] flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[Smile, Image, Paperclip].map((Icon, i) => (
                  <button key={i} type="button" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/[0.06] transition-colors"><Icon className="w-4 h-4 text-white/35" /></button>
                ))}
              </div>
              <input type="text" value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type a message..." className="flex-1 bg-white/[0.04] rounded-full px-5 py-2.5 text-sm text-white placeholder-white/30 outline-none border border-white/[0.06] focus:border-[#ff0050]/30 transition-colors" />
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" disabled={!messageText.trim()} className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30 transition-opacity" style={{ background: messageText.trim() ? '#ff0050' : 'rgba(255,255,255,0.06)' }}>
                <Send className="w-4 h-4 text-white" />
              </motion.button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,0.03)' }}><MessageCircle className="w-10 h-10 text-white/15" /></div>
            <p className="text-lg font-semibold text-white/40">Select a conversation</p>
            <p className="text-sm text-white/20 mt-1">Or search for a user to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
