import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, VideoOff, Mic, MicOff, Radio, X, Users, Heart, Send, Settings, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { liveAPI } from '../services/api';
import GlassDropdown from '../components/GlassDropdown.jsx';

const GoLiveStudio = () => {
  const navigate = useNavigate();
  const { user, requireAuth } = useAuth();
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  
  const [isLive, setIsLive] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [error, setError] = useState('');
  
  // Stream info
  const [streamTitle, setStreamTitle] = useState('');
  const [streamCategory, setStreamCategory] = useState('other');
  const [currentStream, setCurrentStream] = useState(null);
  const [viewers, setViewers] = useState(0);
  const [likes, setLikes] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    // Check auth
    requireAuth(() => {});
    return () => {
      // Cleanup on unmount
      stopCamera();
    };
  }, []);

  useEffect(() => {
    // Ensure video stream is set when camera is enabled
    if (cameraEnabled && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(err => console.warn('Video play:', err));
      }
    }
  }, [cameraEnabled]);

  useEffect(() => {
    // Duration timer
    if (isLive) {
      const interval = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isLive]);

  const startCamera = async () => {
    try {
      setError('');
      console.log('🎥 Requesting camera access...');
      
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser-ul tău nu suportă acces la cameră. Încearcă Chrome, Firefox sau Safari.');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });
      
      console.log('✅ Camera stream obtained:', stream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled })));
      streamRef.current = stream;
      
      if (videoRef.current) {
        console.log('✅ Setting srcObject on video element...');
        videoRef.current.srcObject = stream;
        
        // Wait for metadata and play
        videoRef.current.onloadedmetadata = () => {
          console.log('✅ Video metadata loaded, dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
          videoRef.current.play()
            .then(() => {
              console.log('✅ Video playing successfully!');
              setCameraEnabled(true);
            })
            .catch(playErr => {
              console.warn('⚠️ Play warning:', playErr);
              // Even if play fails, set enabled (video will show)
              setCameraEnabled(true);
            });
        };
        
        // Fallback if onloadedmetadata doesn't fire
        setTimeout(() => {
          if (!videoRef.current.srcObject) {
            console.warn('⚠️ Fallback: re-setting srcObject');
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.log('Fallback play:', e));
          }
          setCameraEnabled(true);
        }, 1000);
      } else {
        console.error('❌ videoRef.current is null!');
        setCameraEnabled(true); // Set anyway
      }
    } catch (err) {
      console.error('❌ Camera error:', err);
      let errorMsg = 'Nu se poate accesa camera. ';
      
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg += 'Nicio cameră detectată pe dispozitiv.';
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg += 'Permisiunea pentru cameră a fost refuzată. Click pe iconița de cameră din bara browser-ului și permite accesul.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMsg += 'Camera este folosită de altă aplicație. Închide alte aplicații care folosesc camera.';
      } else {
        errorMsg += err.message;
      }
      
      setError(errorMsg);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraEnabled(false);
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
      }
    }
  };

  const startBroadcast = async () => {
    if (!streamTitle.trim()) {
      setError('Adaugă un titlu pentru live-ul tău!');
      return;
    }

    try {
      setIsPreparing(true);
      setError('');

      // Start camera if not already
      if (!cameraEnabled) {
        await startCamera();
      }

      // Create live stream session
      const res = await liveAPI.startStream(streamTitle, streamCategory);
      setCurrentStream(res.data);
      setIsLive(true);
      setDuration(0);

      // Start recording and uploading chunks
      const options = { mimeType: 'video/webm;codecs=vp8,opus' };
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);
      
      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          try {
            await liveAPI.uploadChunk(res.data.id, event.data);
          } catch (err) {
            console.error('Chunk upload error:', err);
          }
        }
      };

      // Send chunks every 2 seconds
      mediaRecorderRef.current.start(2000);

      // Start polling chat
      pollChat(res.data.id);

    } catch (err) {
      console.error('Broadcast error:', err);
      setError(err.response?.data?.detail || 'Eroare la pornirea live-ului');
    } finally {
      setIsPreparing(false);
    }
  };

  const endBroadcast = async () => {
    if (!currentStream) return;

    try {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      // End stream on backend
      const res = await liveAPI.endStream(currentStream.id);
      
      // Show stats
      alert(`Live încheiat!\nDurată: ${Math.floor(res.data.duration / 60)}m\nViewers max: ${res.data.peakViewers}\nLikes: ${res.data.totalLikes}`);

      // Reset state
      setIsLive(false);
      setCurrentStream(null);
      stopCamera();
      
      // Navigate back
      navigate('/live');
    } catch (err) {
      console.error('End broadcast error:', err);
    }
  };

  const pollChat = (streamId) => {
    // Simple polling for chat (WebSocket upgrade later)
    const interval = setInterval(async () => {
      if (!isLive) {
        clearInterval(interval);
        return;
      }
      try {
        const res = await liveAPI.getChat(streamId);
        setChatMessages(res.data || []);
      } catch (err) {
        console.error('Chat poll error:', err);
      }
    }, 3000);
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !currentStream) return;
    try {
      await liveAPI.sendChat(currentStream.id, chatInput);
      setChatInput('');
    } catch (err) {
      console.error('Chat send error:', err);
    }
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50" style={{ background: 'rgba(5,5,10,1)' }}>
      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-20 left-4 p-3 rounded-lg text-xs" style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '250px' }}>
          <div className="text-white/50 space-y-1">
            <div>Camera State: <span className={cameraEnabled ? 'text-green-400' : 'text-red-400'}>{cameraEnabled ? 'ENABLED' : 'DISABLED'}</span></div>
            <div>Stream Ref: <span className={streamRef.current ? 'text-green-400' : 'text-red-400'}>{streamRef.current ? 'SET' : 'NULL'}</span></div>
            <div>Video Ref: <span className={videoRef.current ? 'text-green-400' : 'text-red-400'}>{videoRef.current ? 'SET' : 'NULL'}</span></div>
            {streamRef.current && <div>Tracks: {streamRef.current.getTracks().map(t => t.kind).join(', ')}</div>}
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-10" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/live')} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ff0050, #ff3366)' }}>
              <Radio className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Studio Live</h1>
              {isLive && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 text-red-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    LIVE
                  </span>
                  <span className="text-white/40">•</span>
                  <span className="text-white/60">{formatDuration(duration)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {isLive && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <Users className="w-4 h-4 text-white/60" />
              <span className="text-sm font-semibold text-white">{viewers}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <Heart className="w-4 h-4 text-red-400" />
              <span className="text-sm font-semibold text-white">{likes}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="h-full pt-16 flex">
        {/* Video Preview */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="relative w-full max-w-3xl aspect-video rounded-2xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline 
              className="w-full h-full object-cover"
              style={{ display: cameraEnabled ? 'block' : 'none' }}
            />
            {!cameraEnabled && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <VideoOff className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <p className="text-sm text-white/40">Camera oprită</p>
                </div>
              </div>
            )}

            {/* Controls Overlay */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={cameraEnabled ? stopCamera : startCamera}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
                style={{ background: cameraEnabled ? 'rgba(255,255,255,0.15)' : 'rgba(255,0,80,0.8)' }}
              >
                {cameraEnabled ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-white" />}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleMic}
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: micEnabled ? 'rgba(255,255,255,0.15)' : 'rgba(255,0,80,0.8)' }}
              >
                {micEnabled ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Settings & Chat */}
        <div className="w-[380px] flex flex-col border-l border-white/[0.06]" style={{ background: 'rgba(10,10,15,0.95)' }}>
          {!isLive ? (
            // Pre-Live Settings
            <div className="flex-1 p-6 overflow-y-auto">
              <h2 className="text-lg font-bold text-white mb-6">Setări Live</h2>
              
              {error && (
                <div className="mb-4 p-3 rounded-xl flex items-start gap-2" style={{ background: 'rgba(255,0,80,0.1)', border: '1px solid rgba(255,0,80,0.3)' }}>
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block font-body">Titlu Live</label>
                  <input
                    type="text"
                    value={streamTitle}
                    onChange={(e) => setStreamTitle(e.target.value)}
                    placeholder="Ex: Sesiune Q&A LIVE! 🔥"
                    maxLength={100}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all font-body focus:shadow-glow-cyan"
                    style={{ 
                      background: 'rgba(255,255,255,0.04)', 
                      border: '1px solid rgba(255,255,255,0.08)',
                      backdropFilter: 'blur(10px)'
                    }}
                  />
                  <p className="text-xs text-white/30 mt-1 font-body">{streamTitle.length}/100</p>
                </div>

                <GlassDropdown
                  label="Categorie"
                  value={streamCategory}
                  onChange={setStreamCategory}
                />

                <div className="pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={startBroadcast}
                    disabled={isPreparing || !cameraEnabled}
                    className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #ff0050, #ff3366)' }}
                  >
                    {isPreparing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Se pregătește...
                      </>
                    ) : (
                      <>
                        <Radio className="w-5 h-5" />
                        Start LIVE
                      </>
                    )}
                  </motion.button>
                  {!cameraEnabled && (
                    <p className="text-xs text-white/40 text-center mt-2">Pornește camera pentru a începe</p>
                  )}
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-xs text-white/50 mb-2">💡 Tips:</p>
                <ul className="text-xs text-white/40 space-y-1 pl-4">
                  <li>• Asigură-te că ai lumină bună</li>
                  <li>• Testează microfonul înainte</li>
                  <li>• Interacționează cu viewers</li>
                  <li>• Viewers pot trimite cadouri!</li>
                </ul>
              </div>
            </div>
          ) : (
            // Live Chat
            <>
              <div className="p-4 border-b border-white/[0.06]">
                <h3 className="text-sm font-bold text-white">Chat Live</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 ? (
                  <p className="text-xs text-white/30 text-center py-8">Fii primul care trimite un mesaj!</p>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className="flex items-start gap-2">
                      <img src={msg.user.avatar} alt="" className="w-6 h-6 rounded-full flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs">
                          <span className="font-semibold text-[#00f5d4]">{msg.user.username}</span>
                          <span className="text-white/60 ml-2">{msg.text}</span>
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-white/[0.06]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Scrie un mesaj..."
                    className="flex-1 px-3 py-2 rounded-xl text-xs text-white placeholder-white/30 outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={sendChatMessage}
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #ff0050, #ff3366)' }}
                  >
                    <Send className="w-4 h-4 text-white" />
                  </motion.button>
                </div>
              </div>
            </>
          )}

          {/* End Live Button */}
          {isLive && (
            <div className="p-4 border-t border-white/[0.06]">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={endBroadcast}
                className="w-full py-3 rounded-xl font-bold text-white"
                style={{ background: 'rgba(255,0,80,0.15)', border: '1px solid rgba(255,0,80,0.3)' }}
              >
                Închide Live
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoLiveStudio;
