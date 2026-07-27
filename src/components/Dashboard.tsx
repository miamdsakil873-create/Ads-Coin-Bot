import React, { useState } from 'react';
import { UserProfile, SystemConfig } from '../types';
import { 
  Wallet, 
  Tv, 
  Users, 
  Flame, 
  Gamepad2, 
  Copy, 
  Check, 
  ShieldAlert, 
  ShieldCheck, 
  ArrowUpRight, 
  Sparkles,
  TrendingUp,
  Clock
} from 'lucide-react';

interface DashboardProps {
  user: UserProfile;
  config: SystemConfig;
  onNavigate: (tab: 'tasks' | 'games' | 'referral' | 'wallet') => void;
  onClaimCheckin: () => void;
  checkinLoading: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  config,
  onNavigate,
  onClaimCheckin,
  checkinLoading
}) => {
  const [copied, setCopied] = useState(false);

  // Currency Conversions
  const withdrawableCoins = user.withdrawableCoins;
  const bdtVal = ((withdrawableCoins / config.coinsPerBdtRatio) * 12).toFixed(2);
  const usdVal = (withdrawableCoins / config.coinsPerUsdRatio).toFixed(2);

  // Daily Ad Progress
  const adsWatched = user.stats.adsWatchedToday;
  const adLimit = config.dailyAdLimit;
  const adProgressPercent = Math.min(100, Math.round((adsWatched / adLimit) * 100));

  const botUsername = config.botUsername || 'EarnAdsOfficialBot';
  const refLink = `https://t.me/${botUsername}?start=${user.telegramId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isCheckinClaimedToday = user.stats.lastCheckinDate === todayStr;

  return (
    <div className="space-y-4 pb-20">
      {/* Ban Warning Notice if flagged */}
      {user.isBanned && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-300 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-red-200">Account Flagged / Restricted</h4>
            <p className="text-xs text-red-300/90 mt-0.5">
              {user.banReason || 'Device fingerprint or IP collision detected. Please contact support.'}
            </p>
          </div>
        </div>
      )}

      {/* Main Glassmorphic Wallet Overview Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 border border-slate-700/80 shadow-xl shadow-cyan-950/20">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-36 h-36 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-36 h-36 rounded-full bg-amber-500/10 blur-2xl pointer-events-none"></div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Wallet className="w-3.5 h-3.5 text-cyan-400" />
            Total Wallet Balance
          </span>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
            1,000 Coins = ৳12 BDT
          </span>
        </div>

        {/* Large Coins Number */}
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 tracking-tight">
            {user.totalBalanceCoins.toLocaleString()}
          </span>
          <span className="text-sm font-bold text-amber-400/90">COINS</span>
        </div>

        {/* Estimated Fiat Value Pill Box */}
        <div className="mt-3 pt-3 border-t border-slate-700/60 grid grid-cols-2 gap-3">
          <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-medium block">Withdrawable (BDT)</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-lg font-bold text-emerald-400">৳{bdtVal}</span>
              <span className="text-[10px] text-slate-400">BDT</span>
            </div>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-medium block">Crypto Value (USD)</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-lg font-bold text-cyan-400">${usdVal}</span>
              <span className="text-[10px] text-slate-400">USDT</span>
            </div>
          </div>
        </div>

        {/* Pending & Withdraw Actions */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Pending: <strong className="text-slate-200">{user.pendingBalanceCoins} Coins</strong>
          </span>

          <button
            onClick={() => onNavigate('wallet')}
            className="flex items-center gap-1 text-cyan-400 font-bold hover:text-cyan-300 transition-colors"
          >
            Withdraw Now
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Daily Task Analytics Progress */}
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Tv className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-200">Daily Video Ads Goal</h3>
              <p className="text-[11px] text-slate-400">Complete 10 ads for maximum bonus</p>
            </div>
          </div>
          <span className="text-xs font-bold text-cyan-400">
            {adsWatched} / {adLimit} Ads
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700/50">
          <div
            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${adProgressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Daily Check-in Streak Card */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-900 rounded-2xl p-4 border border-amber-500/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Flame className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">7-Day Login Streak</h3>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                Day {user.stats.dailyStreak}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isCheckinClaimedToday ? 'Streak claimed for today!' : 'Claim daily streak coin bonus'}
            </p>
          </div>
        </div>

        <button
          onClick={onClaimCheckin}
          disabled={isCheckinClaimedToday || checkinLoading}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
            isCheckinClaimedToday
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:brightness-110 shadow-amber-500/20 active:scale-95'
          }`}
        >
          {checkinLoading ? 'Claiming...' : isCheckinClaimedToday ? 'Claimed' : 'Claim Daily'}
        </button>
      </div>

      {/* Quick Action Hub */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate('tasks')}
          className="bg-slate-900/90 hover:bg-slate-800/90 p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3 transition-all text-left group"
        >
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">Watch Ads</h4>
            <p className="text-[10px] text-slate-400">Monetag & Adsterra</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('games')}
          className="bg-slate-900/90 hover:bg-slate-800/90 p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3 transition-all text-left group"
        >
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">Spin & Scratch</h4>
            <p className="text-[10px] text-slate-400">3 Free daily spins</p>
          </div>
        </button>
      </div>

      {/* Referral Link Quick Copy Card */}
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-200">Invite Friends (3-Tier 10% + 5% + 2%)</h3>
          </div>
          <button
            onClick={() => onNavigate('referral')}
            className="text-[11px] text-emerald-400 font-bold hover:underline"
          >
            Tree View
          </button>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
          <input
            type="text"
            readOnly
            value={refLink}
            className="bg-transparent text-xs text-slate-300 w-full outline-none font-mono truncate px-1"
          />
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold flex items-center gap-1 transition-all shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Anti-Fraud & Security Shield Info Card */}
      <div className="bg-slate-900/60 rounded-2xl p-3.5 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Anti-Fraud Shield Active (IP & Device Fingerprint Protected)</span>
        </div>
        <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          Secured
        </span>
      </div>
    </div>
  );
};
