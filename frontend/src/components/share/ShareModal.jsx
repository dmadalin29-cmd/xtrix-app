import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link2, Copy, Check, Facebook, Twitter } from 'lucide-react';

const ShareModal = ({ open, onClose, videoId, description }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/video/${videoId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareToSocial = (platform) => {
    const text = encodeURIComponent(description || 'Check out this video on KdM!');
    const url = encodeURIComponent(shareUrl);
    const links = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
      email: `mailto:?subject=Check this KdM video&body=${text}%20${url}`,
    };
    window.open(links[platform], '_blank', 'width=600,height=400');
  };

  if (!open) return null;

  const socials = [
    { id: 'twitter', label: 'Twitter / X', color: '#1DA1F2', icon: 'X' },
    { id: 'facebook', label: 'Facebook', color: '#1877F2', icon: 'f' },
    { id: 'whatsapp', label: 'WhatsApp', color: '#25D366', icon: 'W' },
    { id: 'telegram', label: 'Telegram', color: '#0088CC', icon: 'T' },
    { id: 'email', label: 'Email', color: '#EA4335', icon: '@' },
  ];

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-sm rounded-3xl overflow-hidden" style={{ background: 'rgba(12,12,20,0.95)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/[0.06] z-10">
            <X className="w-5 h-5 text-white/50" />
          </button>

          <div className="p-6">
            <h3 className="text-lg font-bold text-white mb-5">Share Video</h3>

            {/* Social buttons */}
            <div className="grid grid-cols-5 gap-3 mb-6">
              {socials.map(s => (
                <motion.button key={s.id} whileHover={{ scale: 1.1, y: -4 }} whileTap={{ scale: 0.9 }} onClick={() => shareToSocial(s.id)} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: s.color }}>
                    {s.icon}
                  </div>
                  <span className="text-[10px] text-white/40">{s.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Copy link */}
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Link2 className="w-4 h-4 text-white/40 flex-shrink-0" />
              <p className="text-xs text-white/50 flex-1 truncate">{shareUrl}</p>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleCopy} className="px-4 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 flex-shrink-0" style={{ background: copied ? '#00f5d4' : '#ff0050' }}>
                {copied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ShareModal;
