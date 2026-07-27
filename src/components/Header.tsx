import React from 'react';
import { UserProfile } from '../types';
import { Bot, Shield, ShieldAlert, Award, Sparkles, UserCheck } from 'lucide-react';

interface HeaderProps {
  user: UserProfile;
  onOpenBotSimulator: () => void;
  onOpenAdmin: () => void;
  isAdminView: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenBotSimulator,
  onOpenAdmin,
  isAdminView
}) => {
  // Determine level based on total earned coins
  const earned = user.stats.totalEarnedCoins;
  let levelName = 'Bronze Earner';
  let levelColor = 'from-amber-700 to-amber-500';
  if (earned >= 50000) {
    levelName = 'Diamond Master';
    levelColor = 'from-cyan-500 to-blue-600';
  } else if (earned >= 20000) {
    levelName = 'Platinum VIP';
    levelColor = 'from-slate-300 to-slate-500';
  } else if (earned >= 5000) {
    levelName = 'Gold Pro';
    levelColor = 'from-amber-400 to-yellow-500';
  } else if (earned >= 1000) {
    levelName = 'Silver Earner';
    levelColor = 'from-slate-400 to-zinc-400';
  }

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* User Info */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shadow-md shadow-cyan-500/20">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-cyan-400 text-sm overflow-hidden">
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt={user.firstName} className="w-full h-full object-cover" />
                ) : (
                  user.firstName.charAt(0).toUpperCase()
                )}
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-slate-900 text-[9px] text-white font-bold">
              ✓
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-slate-100 truncate max-w-[120px] sm:max-w-[180px]">
                {user.firstName}
              </h1>
              {user.username && (
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                  @{user.username}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold text-white bg-gradient-to-r ${levelColor}`}>
                <Award className="w-2.5 h-2.5" />
                {levelName}
              </span>
              {user.antiFraud.isFlagged ? (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-red-400 font-medium">
                  <ShieldAlert className="w-2.5 h-2.5" /> Banned
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 font-medium">
                  <Shield className="w-2.5 h-2.5" /> Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Tools & Balance Pill */}
        <div className="flex items-center gap-2">
          {/* Quick Balance Pill */}
          <div className="bg-slate-800/90 border border-amber-500/30 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-xs font-bold text-amber-300 tracking-tight">
              {user.totalBalanceCoins.toLocaleString()}
            </span>
            <span className="text-[10px] text-amber-400/80 font-medium">Coins</span>
          </div>

          {/* Bot Simulator Button */}
          <button
            onClick={onOpenBotSimulator}
            className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-all flex items-center justify-center group relative"
            title="Open Interactive Telegram Bot Simulator"
          >
            <Bot className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
          </button>
        </div>
      </div>
    </header>
  );
};
