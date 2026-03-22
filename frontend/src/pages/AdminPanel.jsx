import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Video, Trash2, BarChart3, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats');

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/');
      return;
    }
    loadStats();
  }, [user, navigate]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Admin stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupDatabase = async () => {
    if (!window.confirm('⚠️ Ștergi TOATE datele fake? (useri, videoclipuri, comentarii)')) return;
    try {
      await api.delete('/admin/cleanup-database');
      alert('✅ Database curățat!');
      loadStats();
    } catch (err) {
      alert('❌ Eroare: ' + err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Ștergi acest user permanent?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      alert('✅ User șters!');
      loadStats();
    } catch (err) {
      alert('❌ Eroare: ' + err.message);
    }
  };

  if (!user?.isAdmin) return null;
  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-r from-[#ff0050]/20 to-purple-500/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#ff0050]" />
            <div>
              <h1 className="text-2xl font-display font-bold">Xtrix Admin Panel</h1>
              <p className="text-sm text-gray-400">Platform Management Dashboard</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 sticky top-0 bg-black/90 backdrop-blur-xl z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6">
            {[
              { id: 'stats', label: 'Statistics', icon: BarChart3 },
              { id: 'users', label: 'Users', icon: Users },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#ff0050] text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Total Users" value={stats?.stats?.totalUsers || 0} color="blue" />
              <StatCard icon={Video} label="Total Videos" value={stats?.stats?.totalVideos || 0} color="purple" />
              <StatCard icon={Video} label="Active Streams" value={stats?.stats?.activeStreams || 0} color="red" />
              <StatCard icon={BarChart3} label="Comments" value={stats?.stats?.totalComments || 0} color="green" />
            </div>

            {/* Actions */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                Database Cleanup
              </h2>
              <p className="text-gray-400 mb-4">Șterge toate datele de test (useri, videoclipuri, comentarii)</p>
              <button
                onClick={handleCleanupDatabase}
                className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded-xl font-semibold transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clean Database
              </button>
            </div>

            {/* Recent Users */}
            {stats?.recentUsers?.length > 0 && (
              <div className="glass-card p-6">
                <h2 className="text-xl font-display font-bold mb-4">Recent Users</h2>
                <div className="space-y-2">
                  {stats.recentUsers.map(u => (
                    <div key={u._id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <img src={u.avatar} alt="" className="w-10 h-10 rounded-full" />
                        <div>
                          <p className="font-semibold">{u.displayName}</p>
                          <p className="text-sm text-gray-400">@{u.username}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs ${u.isAdmin ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {u.isAdmin ? 'ADMIN' : 'USER'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-display font-bold">All Users</h2>
              <button onClick={loadStats} className="p-2 hover:bg-white/10 rounded-lg">
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {stats?.recentUsers?.map(u => (
                <div key={u._id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <img src={u.avatar} alt="" className="w-12 h-12 rounded-full" />
                    <div>
                      <p className="font-semibold">{u.displayName} {u.verified && '✓'}</p>
                      <p className="text-sm text-gray-400">@{u.username}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <p className="text-gray-400">{u.followers} followers</p>
                      <p className="text-gray-500">{u.likes} likes</p>
                    </div>
                    {!u.isAdmin && (
                      <button
                        onClick={() => handleDeleteUser(u._id)}
                        className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
    red: 'from-red-500/20 to-orange-500/20 border-red-500/30',
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`glass-card p-6 bg-gradient-to-br ${colors[color]}`}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-6 h-6 text-white/60" />
      </div>
      <p className="text-3xl font-display font-bold mb-1">{value.toLocaleString()}</p>
      <p className="text-sm text-gray-400">{label}</p>
    </motion.div>
  );
};

export default AdminPanel;
