import React, { useState, useEffect } from 'react';
import { SystemConfig, UserProfile, WithdrawalRequest, AdminStats } from '../types';
import { 
  getAdminDashboard, 
  adminUserAction, 
  adminWithdrawalAction, 
  adminUpdateConfig, 
  adminBroadcast,
  adminLogin 
} from '../services/api';
import { 
  ShieldCheck, 
  Users, 
  Wallet, 
  Send, 
  Settings, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  Search, 
  Coins, 
  Tv, 
  Lock,
  RefreshCw,
  LogOut
} from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Dashboard Data
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'users' | 'withdrawals' | 'settings' | 'broadcast'>('overview');

  // Search & Filter State
  const [userSearch, setUserSearch] = useState('');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'Pending' | 'Approved' | 'Rejected' | 'All'>('Pending');

  // Broadcast State
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  // Config Form State
  const [monetagZone, setMonetagZone] = useState('');
  const [minBdtCoins, setMinBdtCoins] = useState('5000');
  const [minUsdtCoins, setMinUsdtCoins] = useState('10000');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const data = await getAdminDashboard();
      setStats(data.stats);
      setConfig(data.config);
      setUsers(data.users);
      setWithdrawals(data.withdrawals);
      setMonetagZone(data.config.monetagZoneId);
      setMinBdtCoins(data.config.minWithdrawalCoinsBdt.toString());
      setMinUsdtCoins(data.config.minWithdrawalCoinsUsdt.toString());
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      await adminLogin(password);
      setIsAuthenticated(true);
      fetchAdminData();
    } catch (err: any) {
      setLoginError(err.message || 'Authentication failed');
    }
  };

  const handleUserBanToggle = async (user: UserProfile) => {
    const action = user.isBanned ? 'unban' : 'ban';
    await adminUserAction(user.id, action, action === 'ban' ? 'Multi-account fingerprint or suspicious traffic' : undefined);
    fetchAdminData();
  };

  const handleAdjustBalance = async (userId: string) => {
    const adjStr = prompt('Enter coin adjustment (e.g. +500 or -500):');
    if (!adjStr) return;
    const adj = parseInt(adjStr, 10);
    if (isNaN(adj)) return;
    await adminUserAction(userId, 'adjust_balance', undefined, adj);
    fetchAdminData();
  };

  const handleWithdrawalAction = async (wId: string, action: 'approve' | 'reject') => {
    let note = '';
    let rejectionReason = '';
    if (action === 'approve') {
      note = prompt('Enter Transaction Hash / Ref Note (Optional):') || 'Paid via bKash/USDT Manual';
    } else {
      rejectionReason = prompt('Enter Rejection Reason for User:') || 'Invalid account details provided';
    }

    await adminWithdrawalAction(wId, action, rejectionReason, note);
    fetchAdminData();
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await adminUpdateConfig({
      monetagZoneId: monetagZone,
      minWithdrawalCoinsBdt: Number(minBdtCoins),
      minWithdrawalCoinsUsdt: Number(minUsdtCoins)
    });
    alert('System settings updated successfully!');
    fetchAdminData();
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    const res = await adminBroadcast(broadcastMessage);
    setBroadcastSuccess(res.message);
    setBroadcastMessage('');
    setTimeout(() => setBroadcastSuccess(null), 3000);
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full space-y-4">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Admin Control Portal</h3>
            <p className="text-xs text-slate-400">Enter master password to access administrative controls.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              placeholder="Admin Password (default: admin123)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 font-mono text-center"
              autoFocus
            />

            {loginError && <p className="text-xs text-red-400 font-bold text-center">{loginError}</p>}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20"
              >
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.firstName.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.telegramId.toString().includes(userSearch)
  );

  const filteredWithdrawals = withdrawalFilter === 'All'
    ? withdrawals
    : withdrawals.filter(w => w.status === withdrawalFilter);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col p-2 sm:p-4 overflow-hidden">
      <div className="max-w-4xl mx-auto w-full h-full bg-slate-900 border border-slate-700 rounded-3xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Central Admin Dashboard</h3>
              <p className="text-[10px] text-slate-400">Watch Ads & Earn Platform Controller</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAdminData}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold"
            >
              Exit Admin
            </button>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex bg-slate-950/80 p-1.5 border-b border-slate-800 text-xs overflow-x-auto gap-1">
          {[
            { id: 'overview', label: 'Overview', icon: ShieldCheck },
            { id: 'users', label: 'Users & Fraud', icon: Users, badge: users.length },
            { id: 'withdrawals', label: 'Withdrawals', icon: Wallet, badge: withdrawals.filter(w => w.status === 'Pending').length },
            { id: 'settings', label: 'Ad Settings', icon: Settings },
            { id: 'broadcast', label: 'Mass Broadcast', icon: Send }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveAdminTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeAdminTab === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-900 text-amber-300 font-extrabold">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {/* 1. OVERVIEW TAB */}
          {activeAdminTab === 'overview' && stats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-medium block">Total Users</span>
                  <span className="text-xl font-extrabold text-slate-100 mt-0.5 block">{stats.totalUsers}</span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-amber-500/30">
                  <span className="text-[10px] text-amber-400 font-medium block">Pending Withdrawals</span>
                  <span className="text-xl font-extrabold text-amber-300 mt-0.5 block">
                    {stats.totalPendingWithdrawalsCount} Requests
                  </span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 font-medium block">Paid Out Coins</span>
                  <span className="text-xl font-extrabold text-emerald-400 mt-0.5 block">
                    {stats.totalApprovedWithdrawalsCoins.toLocaleString()}
                  </span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-red-500/30">
                  <span className="text-[10px] text-red-400 font-medium block">Fraud Flagged Users</span>
                  <span className="text-xl font-extrabold text-red-400 mt-0.5 block">{stats.flaggedUsersCount}</span>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-200">Daily Monetization Metrics</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400">Ads Watched Today:</span>
                    <span className="font-bold text-cyan-400 block text-lg">{stats.totalAdsWatchedToday} Ads</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Total Coins Distributed:</span>
                    <span className="font-bold text-amber-400 block text-lg">{stats.totalCoinsEarnedAllTime.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. USERS & FRAUD TAB */}
          {activeAdminTab === 'users' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <Search className="w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search user by Name, @Username, or Telegram ID..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-200 outline-none"
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {filteredUsers.map(u => (
                  <div
                    key={u.id}
                    className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-100">{u.firstName}</h4>
                        <span className="text-[10px] text-slate-400">@{u.username || 'user'}</span>
                        {u.isBanned && (
                          <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 text-[9px] font-bold">
                            BANNED
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        ID: {u.telegramId} | IP: {u.antiFraud.ipAddress} | FP: {u.antiFraud.deviceFingerprint.slice(0, 12)}...
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAdjustBalance(u.id)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-[10px] hover:bg-amber-500/30"
                      >
                        {u.totalBalanceCoins} Coins
                      </button>

                      <button
                        onClick={() => handleUserBanToggle(u)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                          u.isBanned ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {u.isBanned ? 'Unban' : 'Ban'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. WITHDRAWALS APPROVAL TAB */}
          {activeAdminTab === 'withdrawals' && (
            <div className="space-y-3">
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
                {(['Pending', 'Approved', 'Rejected', 'All'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setWithdrawalFilter(status)}
                    className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                      withdrawalFilter === status
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {filteredWithdrawals.map(w => (
                  <div
                    key={w.id}
                    className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100">{w.username} ({w.paymentMethod})</span>
                      <span className="text-amber-400 font-bold">
                        {w.fiatCurrency === 'BDT' ? `৳${w.amountFiat} BDT` : `$${w.amountFiat} USD`} ({w.amountCoins} Coins)
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 font-mono bg-slate-900 p-2 rounded-xl">
                      Account / Wallet: <strong>{w.accountNumber}</strong>
                    </p>

                    {w.status === 'Pending' && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleWithdrawalAction(w.id, 'approve')}
                          className="flex-1 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400"
                        >
                          Approve Payout ✅
                        </button>
                        <button
                          onClick={() => handleWithdrawalAction(w.id, 'reject')}
                          className="flex-1 py-1.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 font-bold hover:bg-red-500/30"
                        >
                          Reject & Refund ❌
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. AD SETTINGS TAB */}
          {activeAdminTab === 'settings' && (
            <form onSubmit={handleSaveConfig} className="space-y-4 max-w-md mx-auto">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Monetag Zone ID
                </label>
                <input
                  type="text"
                  value={monetagZone}
                  onChange={e => setMonetagZone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Min BDT Withdrawal Coins
                </label>
                <input
                  type="number"
                  value={minBdtCoins}
                  onChange={e => setMinBdtCoins(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Min USDT Withdrawal Coins
                </label>
                <input
                  type="number"
                  value={minUsdtCoins}
                  onChange={e => setMinUsdtCoins(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20"
              >
                Save Settings
              </button>
            </form>
          )}

          {/* 5. BROADCAST TAB */}
          {activeAdminTab === 'broadcast' && (
            <form onSubmit={handleSendBroadcast} className="space-y-3 max-w-md mx-auto">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Broadcast Message Content
                </label>
                <textarea
                  rows={4}
                  placeholder="Type push notification or message to all users..."
                  value={broadcastMessage}
                  onChange={e => setBroadcastMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 font-mono"
                ></textarea>
              </div>

              {broadcastSuccess && (
                <p className="text-xs font-bold text-emerald-400 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/30">
                  {broadcastSuccess}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-extrabold text-xs shadow-md shadow-cyan-500/20"
              >
                Dispatch Mass Broadcast
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
