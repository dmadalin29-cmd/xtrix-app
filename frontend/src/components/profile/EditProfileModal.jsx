import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usersAPI } from '../../services/api';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';

const EditProfileModal = ({ open, onClose }) => {
  const { user, login } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select an image'); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      // Upload avatar if changed
      if (avatarFile) {
        await usersAPI.uploadAvatar(avatarFile);
      }
      // Update profile fields
      const updates = {};
      if (displayName !== user?.displayName) updates.displayName = displayName;
      if (bio !== user?.bio) updates.bio = bio;
      if (Object.keys(updates).length > 0) {
        await usersAPI.updateProfile(updates);
      }
      // Refresh user data
      const token = localStorage.getItem('kdm_token');
      if (token) {
        const res = await import('../../services/api').then(m => m.authAPI.getMe());
        localStorage.setItem('kdm_user', JSON.stringify(res.data));
        window.location.reload();
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md rounded-3xl overflow-hidden" style={{ background: 'rgba(12,12,20,0.95)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/[0.06] transition-colors z-10">
            <X className="w-5 h-5 text-white/50" />
          </button>

          <div className="p-8">
            <h2 className="text-xl font-bold text-white mb-6">Edit Profile</h2>

            {/* Avatar */}
            <div className="flex justify-center mb-6">
              <div className="relative cursor-pointer group" onClick={() => fileRef.current?.click()}>
                <Avatar className="w-24 h-24 ring-2 ring-white/10 group-hover:ring-[#ff0050]/40 transition-all">
                  <AvatarImage src={avatarPreview || user?.avatar} />
                  <AvatarFallback className="text-2xl">{(user?.displayName || 'U')[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
            </div>

            {/* Display Name */}
            <div className="mb-4">
              <label className="text-sm font-semibold text-white/60 mb-2 block">Display Name</label>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={50} className="w-full bg-white/[0.04] rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none border border-white/[0.06] focus:border-[#ff0050]/30 transition-colors" />
            </div>

            {/* Bio */}
            <div className="mb-4">
              <label className="text-sm font-semibold text-white/60 mb-2 block">Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={150} rows={3} placeholder="Tell everyone about yourself..." className="w-full bg-white/[0.04] rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none border border-white/[0.06] focus:border-[#ff0050]/30 transition-colors resize-none" />
              <p className="text-[10px] text-white/25 text-right mt-1">{bio.length}/150</p>
            </div>

            {/* Username (read-only) */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-white/60 mb-2 block">Username</label>
              <input type="text" value={`@${user?.username || ''}`} disabled className="w-full bg-white/[0.02] rounded-xl px-4 py-3 text-sm text-white/30 outline-none border border-white/[0.04] cursor-not-allowed" />
            </div>

            {error && <p className="text-xs text-red-400 text-center mb-4">{error}</p>}

            <div className="flex gap-3">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white/60" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                Cancel
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50" style={{ background: '#ff0050', boxShadow: '0 0 20px rgba(255,0,80,0.3)' }}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditProfileModal;
