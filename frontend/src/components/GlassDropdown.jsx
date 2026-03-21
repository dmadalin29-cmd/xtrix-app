import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

const CATEGORIES = [
  { value: 'gaming', label: '🎮 Gaming', icon: '🎮' },
  { value: 'music', label: '🎵 Muzică', icon: '🎵' },
  { value: 'talk', label: '💬 Talk Show', icon: '💬' },
  { value: 'cooking', label: '🍳 Gătit', icon: '🍳' },
  { value: 'sports', label: '⚽ Sport', icon: '⚽' },
  { value: 'art', label: '🎨 Artă', icon: '🎨' },
  { value: 'education', label: '📚 Educație', icon: '📚' },
  { value: 'tech', label: '💻 Tech', icon: '💻' },
  { value: 'lifestyle', label: '✨ Lifestyle', icon: '✨' },
  { value: 'other', label: '📌 Altele', icon: '📌' },
];

const GlassDropdown = ({ label, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const selectedCategory = CATEGORIES.find(cat => cat.value === value) || CATEGORIES[CATEGORIES.length - 1];

  return (
    <div ref={dropdownRef} className="relative">
      {label && (
        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block font-body">
          {label}
        </label>
      )}
      
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all flex items-center justify-between font-body"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <span className="flex items-center gap-2">
          <span>{selectedCategory.icon}</span>
          <span>{selectedCategory.label}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50 shadow-2xl"
            style={{
              background: 'rgba(15,15,25,0.98)',
              backdropFilter: 'blur(40px)',
              border: '1px solid rgba(255,255,255,0.12)',
              maxHeight: '280px',
              overflowY: 'auto'
            }}
          >
            <div className="p-2">
              {CATEGORIES.map((category) => {
                const isSelected = value === category.value;
                return (
                  <motion.button
                    key={category.value}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                    onClick={() => {
                      onChange(category.value);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors"
                    style={{
                      background: isSelected ? 'rgba(255,0,80,0.1)' : 'transparent'
                    }}
                  >
                    <span className="flex items-center gap-2 text-sm text-white/80 font-body">
                      <span>{category.icon}</span>
                      <span>{category.label}</span>
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-[#ff0050]" />}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlassDropdown;
