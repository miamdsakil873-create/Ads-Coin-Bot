import React from 'react';
import { LayoutDashboard, Tv, Gamepad2, Users, Wallet, Trophy, ShieldCheck } from 'lucide-react';

export type TabType = 'dashboard' | 'tasks' | 'games' | 'referral' | 'wallet' | 'leaderboard';

interface NavigationProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab
}) => {
  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks' as TabType, label: 'Watch & Earn', icon: Tv, badge: 'Hot' },
    { id: 'games' as TabType, label: 'Games', icon: Gamepad2 },
    { id: 'referral' as TabType, label: '3-Tier Ref', icon: Users, badge: '10%' },
    { id: 'wallet' as TabType, label: 'Withdraw', icon: Wallet },
    { id: 'leaderboard' as TabType, label: 'Ranks', icon: Trophy },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 shadow-2xl">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelectTab(t.id)}
              className={`relative flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? 'text-cyan-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <div className={`relative p-1 rounded-lg transition-colors ${isActive ? 'bg-cyan-500/15 text-cyan-400' : ''}`}>
                <Icon className="w-5 h-5" />
                {t.badge && (
                  <span className="absolute -top-1.5 -right-2 bg-gradient-to-r from-amber-500 to-red-500 text-white text-[8px] font-extrabold px-1 rounded-full animate-pulse">
                    {t.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[58px]">
                {t.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-cyan-400 rounded-full shadow-sm shadow-cyan-400"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
