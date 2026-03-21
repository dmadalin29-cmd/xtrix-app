import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, TrendingUp, ArrowDownToLine, Plus, Sparkles } from 'lucide-react';
import { walletAPI } from '../services/api';

const WalletModal = ({ isOpen, onClose, user }) => {
  const [activeTab, setActiveTab] = useState('balance');
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [topupAmount, setTopupAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchWalletData();
    }
  }, [isOpen]);

  const fetchWalletData = async () => {
    try {
      const res = await walletAPI.getBalance();
      setBalance(res.data.balance);
      setTotalEarned(res.data.totalEarned);
      setTotalSpent(res.data.totalSpent);

      const txRes = await walletAPI.getTransactions(1);
      setTransactions(txRes.data || []);
    } catch (err) {
      console.error('Fetch wallet error:', err);
    }
  };

  const handleTopup = async () => {
    const amount = parseFloat(topupAmount);
    if (!amount || amount < 1) {
      alert('Sumă minimă: 1 EUR');
      return;
    }

    try {
      setLoading(true);
      const res = await walletAPI.initiateTopup(amount);
      
      const coins = res.data.coins;
      const checkoutUrl = res.data.checkoutUrl;
      
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        alert(`⚠️ Viva Payments nu este încă configurat.\n\nCând va fi activat, vei primi ${coins} coins pentru ${amount} EUR.`);
      }
      
      setTopupAmount('');
      fetchWalletData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Eroare la inițierea plății');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount);
    if (!amount || amount < 100) {
      alert('Sumă minimă retragere: 100 coins');
      return;
    }

    if (amount > balance) {
      alert('Sold insuficient!');
      return;
    }

    try {
      setLoading(true);
      const res = await walletAPI.withdraw(amount);
      alert(`Retragere reușită!\n${amount} coins → ${res.data.amountEur.toFixed(2)} EUR\nSold nou: ${res.data.newBalance} coins`);
      setWithdrawAmount('');
      fetchWalletData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Eroare la retragere');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-6 overflow-y-auto"
        onClick={onClose}
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-glass"
          style={{ 
            background: 'rgba(15,15,25,0.98)', 
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(24px)',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header */}
          <div className="p-5 border-b border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div 
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="w-11 h-11 rounded-xl flex items-center justify-center shadow-glow-gold" 
                  style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)' }}
                >
                  <Coins className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-xl font-bold text-white font-display">Wallet</h2>
                  <p className="text-xs text-white/40 font-body">Monedele tale</p>
                </div>
              </div>
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose} 
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </motion.button>
            </div>
          </div>

          {/* Balance Card - Compact */}
          <div className="p-5">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="p-5 rounded-xl relative overflow-hidden" 
              style={{ 
                background: 'linear-gradient(135deg, rgba(255,0,80,0.12), rgba(255,51,102,0.08))', 
                border: '1px solid rgba(255,0,80,0.25)',
                boxShadow: '0 8px 32px rgba(255,0,80,0.15)'
              }}
            >
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-wider mb-1 font-body font-semibold">Sold</p>
                  <p className="text-4xl font-bold text-white font-display">{balance}</p>
                  <p className="text-xs text-white/40 mt-1 font-body">coins</p>
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-12 h-12 text-[#FFD700] opacity-20" />
                </motion.div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/[0.08]">
                <div>
                  <p className="text-xs text-white/40 font-body">Câștigat</p>
                  <p className="text-lg font-bold text-green-400 font-display">{totalEarned}</p>
                </div>
                <div>
                  <p className="text-xs text-white/40 font-body">Cheltuit</p>
                  <p className="text-lg font-bold text-red-400 font-display">{totalSpent}</p>
                </div>
              </div>

              <div className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #ff0050, transparent)' }} />
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/[0.06] px-5">
            <TabButton active={activeTab === 'topup'} onClick={() => setActiveTab('topup')} icon={Plus}>
              Top-Up
            </TabButton>
            <TabButton active={activeTab === 'withdraw'} onClick={() => setActiveTab('withdraw')} icon={ArrowDownToLine}>
              Retrage
            </TabButton>
            <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={TrendingUp}>
              Istoric
            </TabButton>
          </div>

          {/* Content - Scrollable */}
          <div className="p-5 overflow-y-auto" style={{ maxHeight: '40vh' }}>
            <AnimatePresence mode="wait">
              {activeTab === 'topup' && (
                <TabContent key="topup">
                  <p className="text-sm text-white/60 mb-4 font-body">Încarcă wallet-ul cu monede pentru a trimite cadouri creatorilor!</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block font-body">Sumă (EUR)</label>
                      <input
                        type="number"
                        value={topupAmount}
                        onChange={(e) => setTopupAmount(e.target.value)}
                        placeholder="Ex: 10"
                        min="1"
                        step="1"
                        className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all font-body focus:shadow-glow-cyan"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}
                      />
                      {topupAmount && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-white/40 mt-2 font-body"
                        >
                          Vei primi aproximativ <span className="text-[#00f5d4] font-semibold">{Math.floor(parseFloat(topupAmount) / 0.013)} coins</span>
                        </motion.p>
                      )}
                    </div>

                    <div className="p-4 rounded-xl" style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.2)' }}>
                      <p className="text-xs text-white/50 font-body">
                        💡 <strong>Preț:</strong> 1 coin ≈ 0.013 EUR<br />
                        Ex: 10 EUR = ~769 coins
                      </p>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleTopup}
                      disabled={loading || !topupAmount}
                      className="w-full py-3.5 rounded-xl font-bold text-white disabled:opacity-40 shadow-glow-pink font-display"
                      style={{ background: 'linear-gradient(135deg, #ff0050, #ff3366)' }}
                    >
                      {loading ? 'Se procesează...' : 'Continuă cu Plata'}
                    </motion.button>
                  </div>
                </TabContent>
              )}

              {activeTab === 'withdraw' && (
                <TabContent key="withdraw">
                  <p className="text-sm text-white/60 mb-4 font-body">Retrage monedele câștigate din cadouri în contul tău bancar.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block font-body">Sumă Coins</label>
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="Minim 100 coins"
                        min="100"
                        step="10"
                        className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all font-body focus:shadow-glow-cyan"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}
                      />
                      {withdrawAmount && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-white/40 mt-2 font-body"
                        >
                          Vei primi aproximativ <span className="text-green-400 font-semibold">{(parseInt(withdrawAmount) * 0.01).toFixed(2)} EUR</span>
                        </motion.p>
                      )}
                    </div>

                    <div className="p-4 rounded-xl" style={{ background: 'rgba(0,245,212,0.05)', border: '1px solid rgba(0,245,212,0.2)' }}>
                      <p className="text-xs text-white/50 font-body">
                        💡 <strong>Conversie:</strong> 1 coin = 0.01 EUR<br />
                        Ex: 1000 coins = 10 EUR
                      </p>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleWithdraw}
                      disabled={loading || !withdrawAmount || parseInt(withdrawAmount) > balance}
                      className="w-full py-3.5 rounded-xl font-bold text-white disabled:opacity-40 shadow-glow-cyan font-display"
                      style={{ background: 'linear-gradient(135deg, #00f5d4, #00c9a7)' }}
                    >
                      {loading ? 'Se procesează...' : 'Retrage Bani'}
                    </motion.button>
                  </div>
                </TabContent>
              )}

              {activeTab === 'history' && (
                <TabContent key="history">
                  <p className="text-sm text-white/60 mb-4 font-body">Istoric complet al tranzacțiilor tale</p>
                  
                  {transactions.length === 0 ? (
                    <div className="text-center py-12">
                      <Coins className="w-16 h-16 text-white/10 mx-auto mb-3" />
                      <p className="text-xs text-white/30 font-body">Nicio tranzacție încă</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {transactions.map((tx, i) => (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="p-3 rounded-xl flex items-center justify-between hover:bg-white/[0.04] transition-colors"
                          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white/90 font-body">{tx.description}</p>
                            <p className="text-xs text-white/30 mt-0.5 font-body">
                              {new Date(tx.createdAt).toLocaleDateString('ro-RO', { 
                                day: 'numeric', 
                                month: 'short', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                          <div className={`text-sm font-bold font-display ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {tx.amount >= 0 ? '+' : ''}{tx.amount}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </TabContent>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
  
  return ReactDOM.createPortal(modalContent, document.body);
};

// Tab Button Component
const TabButton = ({ active, onClick, icon: Icon, children }) => (
  <motion.button
    whileHover={{ y: -2 }}
    whileTap={{ y: 0 }}
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all relative font-body ${
      active ? 'text-white' : 'text-white/40 hover:text-white/70'
    }`}
  >
    <Icon className="w-4 h-4" />
    {children}
    {active && (
      <motion.div
        layoutId="activeTab"
        className="absolute bottom-0 left-0 right-0 h-0.5"
        style={{ background: 'linear-gradient(90deg, #ff0050, #ff3366)' }}
      />
    )}
  </motion.button>
);

// Tab Content Wrapper
const TabContent = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.div>
);

export default WalletModal;


