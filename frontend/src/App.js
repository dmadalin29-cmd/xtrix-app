import React, { Suspense, lazy } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { AuthProvider } from './contexts/AuthContext';
import AuthModal from './components/auth/AuthModal';

const FeedPage = lazy(() => import('./pages/FeedPage'));
const DiscoverPage = lazy(() => import('./pages/DiscoverPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const UploadPage = lazy(() => import('./pages/UploadPage'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 rounded-xl animate-spin" style={{ background: 'linear-gradient(135deg, #ff0050, #ff3366)', WebkitMaskImage: 'conic-gradient(transparent 30%, black)' }} />
      <p className="text-xs text-white/30 tracking-wider uppercase">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AuthModal />
          <Layout>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<FeedPage />} />
                <Route path="/discover" element={<DiscoverPage />} />
                <Route path="/following" element={<FeedPage following />} />
                <Route path="/live" element={<DiscoverPage live />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/:username" element={<ProfilePage />} />
                <Route path="/upload" element={<UploadPage />} />
              </Routes>
            </Suspense>
          </Layout>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
