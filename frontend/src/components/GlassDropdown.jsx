import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

const categories = [
  { value: 'other', label: 'Altele', icon: '✨' },
  { value: 'gaming', label: 'Gaming', icon: '🎮' },
  { value: 'music', label: 'Muzică', icon: '🎵' },
  { value: 'dance', label: 'Dans', icon: '💃' },
  { value: 'talk', label: 'Discuții', icon: '💬' },
  { value: 'cooking', label: 'Cooking', icon: '👨‍🍳' },
  { value: 'fitness', label: 'Fitness', icon: '💪' },
  { value: 'art', label: 'Artă', icon: '🎨' },
];

const GlassDropdown = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selected = categories.find(c => c.value === value) || categories[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      {label && (
        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block font-body">
          {label}
        </label>
      )}
      
      <motion.button
        type="button"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none flex items-center justify-between transition-all group"
        style={{
          background: isOpen ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
          border: '1px solid ' + (isOpen ? 'rgba(0,245,212,0.3)' : 'rgba(255,255,255,0.08)'),
          boxShadow: isOpen ? '0 0 20px rgba(0,245,212,0.15)' : 'none'
        }}
      >
        <div className="flex items-center gap-2 font-body">
          <span className="text-base">{selected.icon}</span>
          <span className="font-medium">{selected.label}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute top-full mt-2 left-0 right-0 rounded-xl overflow-hidden shadow-glass z-50"
            style={{
              background: 'rgba(10, 10, 20, 0.95)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            <div className="py-2 max-h-[280px] overflow-y-auto">
              {categories.map((category, i) => (
                <motion.button
                  key={category.value}
                  type="button"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => {
                    onChange(category.value);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-left transition-colors group"
                  style={{
                    background: value === category.value ? 'rgba(0,245,212,0.1)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (value !== category.value) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (value !== category.value) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <span className="text-xl">{category.icon}</span>
                  <span className="flex-1 font-body font-medium text-white/90 group-hover:text-white transition-colors">
                    {category.label}
                  </span>
                  {value === category.value && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      <Check className="w-4 h-4 text-[#00f5d4]" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlassDropdown;
