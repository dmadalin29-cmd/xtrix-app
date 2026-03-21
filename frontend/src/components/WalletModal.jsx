import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, TrendingUp, TrendingDown, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { walletAPI } from '../services/api';

const WalletModal = ({ open, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('balance');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Balance state
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  
  // Top-up state
  const [topupAmount, setTopupAmount] = useState('');
  
  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState('');

  useEffect(() => {
    if (open && activeTab === 'balance') {
      fetchWalletData();
    }
  }, [open, activeTab]);

  const fetchWalletData = async () => {
    setLoading(true);
    setError('');
    try {
      const [balanceRes, transactionsRes] = await Promise.all([
        walletAPI.getBalance(),
        walletAPI.getTransactions(1)
      ]);
      setWalletData(balanceRes.data);
      setTransactions(transactionsRes.data.transactions || []);
    } catch (err) {
      setError('Nu am putut încărca datele wallet-ului');
    } finally {
      setLoading(false);
    }
  };

  const handleTopup = async () => {
    const amount = parseFloat(topupAmount);
    if (!amount || amount < 1) {
      setError('Introdu o sumă validă (min. 1 EUR)');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await walletAPI.initiateTopup(amount);
      if (res.data.paymentUrl) {
        setSuccess('Redirecționare către Viva Payments...');
        setTimeout(() => {
          window.open(res.data.paymentUrl, '_blank');
        }, 1000);
      } else {
        setError('Plata nu este configurată încă. Contactează admin.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Topup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount);
    if (!amount || amount < 100) {
      setError('Suma minimă de retragere este 100 coins');
      return;
    }
    if (amount > (walletData?.balance || 0)) {
      setError('Sold insuficient!');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await walletAPI.withdraw(amount);
      setSuccess(`Retragere de ${amount} coins (${res.data.eurAmount} EUR) procesată!`);
      setWithdrawAmount('');
      fetchWalletData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Withdraw failed');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const tabs = [
    { id: 'balance', label: 'Sold & Istoric', icon: Coins },
    { id: 'topup', label: 'Încarcă', icon: TrendingUp },
    { id: 'withdraw', label: 'Retrage', icon: TrendingDown },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center px-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl"
          style={{
            background: 'rgba(12,12,20,0.95)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(255,215,0,0.1)'
          }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/[0.06] transition-colors z-10"
          >
            <X className="w-5 h-5 text-white/50" />
          </button>

          {/* Header */}
          <div className="p-6 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)' }}>
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Portofel KdM</h2>
                <p className="text-xs text-white/40">Gestionează coins-urile tale</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setActiveTab(tab.id); setError(''); setSuccess(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive ? 'text-white' : 'text-white/40 hover:text-white/60'
                    }`}
                    style={{
                      background: isActive ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.03)',
                      border: isActive ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(255,255,255,0.06)'
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Balance Tab */}
            {activeTab === 'balance' && (
              <div>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-[#FFD700] animate-spin" />
                  </div>
                ) : walletData ? (
                  <>
                    {/* Balance Card */}
                    <div className="mb-6 p-6 rounded-2xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,165,0,0.08))', border: '1px solid rgba(255,215,0,0.2)' }}>
                      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20" style={{ background: '#FFD700' }} />
                      <p className="text-sm font-semibold text-white/50 mb-2 uppercase tracking-wider">Sold Total</p>
                      <p className="text-4xl font-bold text-white mb-1">{walletData.balance || 0}</p>
                      <p className="text-sm text-white/40">coins</p>
                      <div className="flex gap-4 mt-4 pt-4 border-t border-white/[0.08]">
                        <div>
                          <p className="text-xs text-white/40 mb-1">Câștigat Total</p>
                          <p className="text-base font-semibold text-green-400">+{walletData.totalEarned || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-white/40 mb-1">Cheltuit Total</p>
                          <p className="text-base font-semibold text-red-400">-{walletData.totalSpent || 0}</p>
                        </div>
                      </div>
                    </div>

                    {/* Transactions */}
                    <div>
                      <p className="text-sm font-semibold text-white/50 mb-3 uppercase tracking-wider">Istoric Tranzacții</p>
                      {transactions.length > 0 ? (
                        <div className="space-y-2">
                          {transactions.slice(0, 8).map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.amount >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                  {tx.amount >= 0 ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-white">{tx.type}</p>
                                  <p className="text-xs text-white/30">{new Date(tx.createdAt).toLocaleDateString('ro-RO')}</p>
                                </div>
                              </div>
                              <p className={`text-base font-bold ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {tx.amount >= 0 ? '+' : ''}{tx.amount}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-sm text-white/30">Nicio tranzacție încă</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <p className="text-sm text-white/40">{error || 'Nu s-au putut încărca datele'}</p>
                  </div>
                )}
              </div>
            )}

            {/* Top-up Tab */}
            {activeTab === 'topup' && (
              <div>
                <div className="mb-6 p-4 rounded-xl" style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.15)' }}>
                  <p className="text-xs text-[#FFD700] font-semibold mb-1">💰 Rata de conversie</p>
                  <p className="text-sm text-white/70">1 coin = 0.013 EUR (include 30% platform fee)</p>
                </div>

                <div className="mb-4">
                  <label className="text-sm font-semibold text-white/60 mb-2 block">Sumă EUR</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="10.00"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    className="w-full bg-white/[0.04] rounded-xl px-4 py-3 text-base text-white placeholder-white/25 outline-none border border-white/[0.06] focus:border-[#FFD700]/40 transition-colors"
                  />
                  {topupAmount && (
                    <p className="text-xs text-white/40 mt-2">
                      Vei primi <span className="font-bold text-[#FFD700]">~{Math.floor(parseFloat(topupAmount) / 0.013)} coins</span>
                    </p>
                  )}
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 rounded-xl flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-xs text-red-400">{error}</p>
                  </motion.div>
                )}

                {success && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 rounded-xl flex items-center gap-2" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <p className="text-xs text-green-400">{success}</p>
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleTopup}
                  disabled={loading || !topupAmount}
                  className="w-full py-3 rounded-xl text-sm font-bold text-black disabled:opacity-50 transition-all"
                  style={{ background: '#FFD700', boxShadow: '0 0 20px rgba(255,215,0,0.3)' }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Continuă cu Viva Payments'}
                </motion.button>
              </div>
            )}

            {/* Withdraw Tab */}
            {activeTab === 'withdraw' && (
              <div>
                <div className="mb-6 p-4 rounded-xl" style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.15)' }}>
                  <p className="text-xs text-[#FFD700] font-semibold mb-1">💸 Rata de conversie</p>
                  <p className="text-sm text-white/70">1 coin = 0.01 EUR (retragere standard)</p>
                  <p className="text-xs text-white/40 mt-1">Minim: 100 coins</p>
                </div>

                <div className="mb-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-xs text-white/40 mb-1">Sold disponibil:</p>
                  <p className="text-2xl font-bold text-white">{user?.walletBalance || 0} <span className="text-base text-white/40">coins</span></p>
                </div>

                <div className="mb-4">
                  <label className="text-sm font-semibold text-white/60 mb-2 block">Coins de retras</label>
                  <input
                    type="number"
                    min="100"
                    step="10"
                    placeholder="100"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full bg-white/[0.04] rounded-xl px-4 py-3 text-base text-white placeholder-white/25 outline-none border border-white/[0.06] focus:border-[#FFD700]/40 transition-colors"
                  />
                  {withdrawAmount && (
                    <p className="text-xs text-white/40 mt-2">
                      Vei primi <span className="font-bold text-[#FFD700]">~{(parseInt(withdrawAmount) * 0.01).toFixed(2)} EUR</span>
                    </p>
                  )}
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 rounded-xl flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-xs text-red-400">{error}</p>
                  </motion.div>
                )}

                {success && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 rounded-xl flex items-center gap-2" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <p className="text-xs text-green-400">{success}</p>
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleWithdraw}
                  disabled={loading || !withdrawAmount}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all"
                  style={{ background: '#ff0050', boxShadow: '0 0 20px rgba(255,0,80,0.3)' }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Retrage Coins'}
                </motion.button>

                <p className="text-xs text-white/30 text-center mt-4">
                  Retragerile sunt procesate în 1-3 zile lucrătoare
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WalletModal;
