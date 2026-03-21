import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Film, Music, Hash, AtSign, Globe, Lock, Users,
  X, Plus, Sparkles, Image, Scissors, Type, Wand2, Check,
  ChevronDown, Info
} from 'lucide-react';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';

const UploadPage = () => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [allowComments, setAllowComments] = useState(true);
  const [allowDuet, setAllowDuet] = useState(true);
  const [allowStitch, setAllowStitch] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setUploadComplete(true);
    }, 3000);
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setCaption('');
    setHashtags('');
    setUploadComplete(false);
    setIsUploading(false);
  };

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white mb-1">Upload Video</h1>
        <p className="text-sm text-white/40 mb-8">Share your moment with the world</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {uploadComplete ? (
          <motion.div key="complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(0,245,212,0.15)', boxShadow: '0 0 40px rgba(0,245,212,0.2)' }}>
              <Check className="w-10 h-10 text-[#00f5d4]" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">Upload Complete!</h2>
            <p className="text-sm text-white/40 mb-8">Your video is now being processed and will be live shortly.</p>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={resetUpload} className="px-8 py-3 rounded-xl text-sm font-bold text-white" style={{ background: '#ff0050', boxShadow: '0 0 20px rgba(255,0,80,0.3)' }}>
              Upload Another
            </motion.button>
          </motion.div>
        ) : (
          <motion.div key="upload" className="flex gap-8">
            {/* Left - Upload Area */}
            <div className="flex-1">
              {!selectedFile ? (
                <motion.div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  animate={{ borderColor: dragOver ? 'rgba(255,0,80,0.5)' : 'rgba(255,255,255,0.06)' }}
                  className="relative h-[450px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden"
                  style={{ background: dragOver ? 'rgba(255,0,80,0.05)' : 'rgba(255,255,255,0.02)' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
                  <motion.div animate={{ y: dragOver ? -10 : 0 }} className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <Upload className="w-8 h-8 text-white/40" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Select video to upload</h3>
                    <p className="text-sm text-white/40 mb-1">Or drag and drop a file</p>
                    <p className="text-xs text-white/25 mb-6">MP4 or WebM · 720p or higher · Up to 10 minutes</p>
                    <motion.div whileHover={{ scale: 1.05 }} className="px-8 py-3 rounded-xl text-sm font-bold text-white" style={{ background: '#ff0050', boxShadow: '0 0 20px rgba(255,0,80,0.3)' }}>
                      Select File
                    </motion.div>
                  </motion.div>
                </motion.div>
              ) : (
                <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="h-[300px] flex items-center justify-center relative" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <Film className="w-16 h-16 text-white/20" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <span className="text-sm text-white/70 truncate">{selectedFile.name}</span>
                      <button onClick={() => setSelectedFile(null)} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors">
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                  {/* Edit tools */}
                  <div className="flex items-center gap-3 p-4 border-t border-white/[0.04]">
                    {[{ icon: Scissors, label: 'Trim' }, { icon: Music, label: 'Sound' }, { icon: Type, label: 'Text' }, { icon: Sparkles, label: 'Effects' }, { icon: Image, label: 'Cover' }].map((tool) => (
                      <motion.button key={tool.label} whileHover={{ scale: 1.05, y: -2 }} className="flex flex-col items-center gap-1.5 px-4 py-2 rounded-xl hover:bg-white/[0.04] transition-colors">
                        <tool.icon className="w-5 h-5 text-white/50" />
                        <span className="text-[10px] text-white/40">{tool.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right - Details */}
            <div className="w-[340px] space-y-6">
              {/* Caption */}
              <div>
                <label className="text-sm font-semibold text-white/80 mb-2 block">Caption</label>
                <div className="relative rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write a caption that describes your video..." rows={4} maxLength={2200} className="w-full bg-transparent text-sm text-white placeholder-white/25 p-4 outline-none resize-none" />
                  <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      <button className="text-white/30 hover:text-white/60 transition-colors"><AtSign className="w-4 h-4" /></button>
                      <button className="text-white/30 hover:text-white/60 transition-colors"><Hash className="w-4 h-4" /></button>
                    </div>
                    <span className="text-[10px] text-white/25">{caption.length}/2200</span>
                  </div>
                </div>
              </div>

              {/* Hashtags */}
              <div>
                <label className="text-sm font-semibold text-white/80 mb-2 block">Hashtags</label>
                <input type="text" value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="#fyp #viral #kdm" className="w-full bg-transparent text-sm text-white placeholder-white/25 px-4 py-3 outline-none rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }} />
              </div>

              {/* Visibility */}
              <div>
                <label className="text-sm font-semibold text-white/80 mb-2 block">Who can view</label>
                <div className="flex gap-2">
                  {[
                    { id: 'public', label: 'Public', icon: Globe },
                    { id: 'friends', label: 'Friends', icon: Users },
                    { id: 'private', label: 'Private', icon: Lock },
                  ].map((opt) => (
                    <motion.button key={opt.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setVisibility(opt.id)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all ${visibility === opt.id ? 'text-white' : 'text-white/40'}`} style={{ background: visibility === opt.id ? 'rgba(255,0,80,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${visibility === opt.id ? 'rgba(255,0,80,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
                      <opt.icon className="w-3.5 h-3.5" />{opt.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-4">
                {[
                  { label: 'Allow comments', state: allowComments, setter: setAllowComments },
                  { label: 'Allow Duet', state: allowDuet, setter: setAllowDuet },
                  { label: 'Allow Stitch', state: allowStitch, setter: setAllowStitch },
                ].map((toggle) => (
                  <div key={toggle.label} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <span className="text-sm text-white/70">{toggle.label}</span>
                    <Switch checked={toggle.state} onCheckedChange={toggle.setter} />
                  </div>
                ))}
              </div>

              {/* Upload Button */}
              <div className="flex gap-3 pt-2">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={resetUpload} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white/60 transition-colors" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  Discard
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleUpload} disabled={!selectedFile || isUploading} className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all relative overflow-hidden" style={{ background: '#ff0050', boxShadow: selectedFile ? '0 0 20px rgba(255,0,80,0.3)' : 'none' }}>
                  {isUploading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Uploading...
                    </div>
                  ) : 'Post'}
                  {isUploading && (
                    <motion.div initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 3, ease: 'linear' }} className="absolute bottom-0 left-0 h-1 bg-white/30" />
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadPage;
