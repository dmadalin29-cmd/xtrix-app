import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, TrendingUp, ArrowDownToLine, Plus, Sparkles } from 'lucide-react';
import { walletAPI } from '../services/api';

const WalletModal = ({ isOpen, onClose, user }) => {
  const [activeTab, setActiveTab] = useState('balance'); // balance, topup, withdraw, history
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
      alert(`Redirecționare către Viva Payments...\nVei primi ${res.data.coins} coins pentru ${amount} EUR`);
      // TODO: Redirect to Viva payment page
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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="relative w-full max-w-2xl rounded-2xl overflow-hidden"
          style={{ background: 'rgba(15,15,25,0.98)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)' }}>
                  <Coins className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Wallet KdM</h2>
                  <p className="text-xs text-white/40">Gestionează monedele tale</p>
                </div>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Balance Card */}
          <div className="p-6">
            <div className="p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(255,0,80,0.1), rgba(255,51,102,0.05))', border: '1px solid rgba(255,0,80,0.2)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Sold Curent</p>
                  <p className="text-4xl font-bold text-white">{balance}</p>
                  <p className="text-sm text-white/40 mt-1">coins</p>
                </div>
                <Sparkles className="w-12 h-12 text-[#FFD700] opacity-20" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/[0.06]">
                <div>
                  <p className="text-xs text-white/40">Total câștigat</p>
                  <p className="text-lg font-bold text-green-400">{totalEarned} coins</p>
                </div>
                <div>
                  <p className="text-xs text-white/40">Total cheltuit</p>
                  <p className="text-lg font-bold text-red-400">{totalSpent} coins</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/[0.06] px-6">
            <button
              onClick={() => setActiveTab('topup')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'topup' ? 'text-white border-b-2 border-[#ff0050]' : 'text-white/40'}`}
            >
              <Plus className="w-4 h-4" />
              Top-Up
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'withdraw' ? 'text-white border-b-2 border-[#ff0050]' : 'text-white/40'}`}
            >
              <ArrowDownToLine className="w-4 h-4" />
              Retrage
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'history' ? 'text-white border-b-2 border-[#ff0050]' : 'text-white/40'}`}
            >
              <TrendingUp className="w-4 h-4" />
              Istoric
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'topup' && (
              <div>
                <p className="text-sm text-white/60 mb-4">Încarcă wallet-ul cu monede pentru a trimite cadouri creatorilor!</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">Sumă (EUR)</label>
                    <input
                      type="number"
                      value={topupAmount}
                      onChange={(e) => setTopupAmount(e.target.value)}
                      placeholder="Ex: 10"
                      min="1"
                      step="1"
                      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                    {topupAmount && (
                      <p className="text-xs text-white/40 mt-2">
                        Vei primi aproximativ <span className="text-[#00f5d4] font-semibold">{Math.floor(parseFloat(topupAmount) / 0.013)} coins</span>
                      </p>
                    )}
                  </div>

                  <div className="p-4 rounded-xl" style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.2)' }}>
                    <p className="text-xs text-white/50">
                      💡 <strong>Preț:</strong> 1 coin ≈ 0.013 EUR<br />
                      Ex: 10 EUR = ~769 coins
                    </p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleTopup}
                    disabled={loading || !topupAmount}
                    className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg, #ff0050, #ff3366)' }}
                  >
                    {loading ? 'Se procesează...' : 'Continuă cu Plata'}
                  </motion.button>
                </div>
              </div>
            )}

            {activeTab === 'withdraw' && (
              <div>
                <p className="text-sm text-white/60 mb-4">Retrage monedele câștigate din cadouri în contul tău bancar.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">Sumă Coins</label>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Minim 100 coins"
                      min="100"
                      step="10"
                      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                    {withdrawAmount && (
                      <p className="text-xs text-white/40 mt-2">
                        Vei primi aproximativ <span className="text-green-400 font-semibold">{(parseInt(withdrawAmount) * 0.01).toFixed(2)} EUR</span>
                      </p>
                    )}
                  </div>

                  <div className="p-4 rounded-xl" style={{ background: 'rgba(0,245,212,0.05)', border: '1px solid rgba(0,245,212,0.2)' }}>
                    <p className="text-xs text-white/50">
                      💡 <strong>Conversie:</strong> 1 coin = 0.01 EUR<br />
                      Ex: 1000 coins = 10 EUR
                    </p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleWithdraw}
                    disabled={loading || !withdrawAmount || parseInt(withdrawAmount) > balance}
                    className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg, #00f5d4, #00c9a7)' }}
                  >
                    {loading ? 'Se procesează...' : 'Retrage Bani'}
                  </motion.button>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <p className="text-sm text-white/60 mb-4">Istoric complet al tranzacțiilor tale</p>
                
                {transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <Coins className="w-12 h-12 text-white/10 mx-auto mb-3" />
                    <p className="text-xs text-white/30">Nicio tranzacție încă</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-3 rounded-xl flex items-center justify-between"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white/90">{tx.description}</p>
                          <p className="text-xs text-white/30 mt-0.5">
                            {new Date(tx.createdAt).toLocaleDateString('ro-RO', { 
                              day: 'numeric', 
                              month: 'short', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                        <div className={`text-sm font-bold ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {tx.amount >= 0 ? '+' : ''}{tx.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WalletModal;
