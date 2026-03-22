import React, { Suspense, lazy, useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AuthModal from './components/auth/AuthModal';
import { useCapacitor } from './hooks/useCapacitor';

const FeedPage = lazy(() => import('./pages/FeedPage'));
const DiscoverPage = lazy(() => import('./pages/DiscoverPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const UploadPage = lazy(() => import('./pages/UploadPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const HashtagPage = lazy(() => import('./pages/HashtagPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const LivePage = lazy(() => import('./pages/LivePage'));
const GoLiveStudio = lazy(() => import('./pages/GoLiveStudio'));
const WatchStreamPage = lazy(() => import('./pages/WatchStreamPage'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 rounded-xl animate-spin" style={{ background: 'linear-gradient(135deg, #ff0050, #ff3366)', WebkitMaskImage: 'conic-gradient(transparent 30%, black)' }} />
      <p className="text-xs text-white/30 tracking-wider uppercase">Loading...</p>
    </div>
  </div>
);

function AppContent() {
  const { isNative, platform } = useCapacitor();

  useEffect(() => {
    if (isNative) {
      console.log(`🚀 Xtrix running on native ${platform}`);
    } else {
      console.log('🌐 Xtrix running on web');
    }
  }, [isNative, platform]);

  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AuthModal />
          
          <Routes>
            {/* Full Screen Pages (NO Layout/Sidebar) */}
            <Route path="/watch/:streamId" element={
              <Suspense fallback={<LoadingFallback />}>
                <WatchStreamPage />
              </Suspense>
            } />
            <Route path="/golive" element={
              <Suspense fallback={<LoadingFallback />}>
                <GoLiveStudio />
              </Suspense>
            } />

            {/* Regular Pages (WITH Layout/Sidebar) */}
            <Route path="*" element={
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<FeedPage />} />
                    <Route path="/discover" element={<DiscoverPage />} />
                    <Route path="/following" element={<FeedPage following />} />
                    <Route path="/live" element={<LivePage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/profile/:username" element={<ProfilePage />} />
                    <Route path="/upload" element={<UploadPage />} />
                    <Route path="/messages" element={<MessagesPage />} />
                    <Route path="/hashtag/:tag" element={<HashtagPage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                  </Routes>
                </Suspense>
              </Layout>
            } />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
