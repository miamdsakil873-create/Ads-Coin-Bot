import React, { useState, useEffect } from 'react';
import { UserProfile, SystemConfig, PaymentGatewayType } from './types';
import { 
  initUserProfile, 
  completeAdTask, 
  completeCpaTask, 
  claimDailyCheckin, 
  spinWheel, 
  playScratchCard, 
  submitWithdrawal 
} from './services/api';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { TasksSection } from './components/TasksSection';
import { GamesSection } from './components/GamesSection';
import { ReferralSection } from './components/ReferralSection';
import { WalletSection } from './components/WalletSection';
import { LeaderboardSection } from './components/LeaderboardSection';
import { CaptchaModal } from './components/CaptchaModal';
import { BotSimulatorDrawer } from './components/BotSimulatorDrawer';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active View Tab
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Modals & Drawers State
  const [showBotSimulator, setShowBotSimulator] = useState<boolean>(false);
  const [showCaptcha, setShowCaptcha] = useState<boolean>(false);
  const [captchaCallback, setCaptchaCallback] = useState<(() => void) | null>(null);

  const [checkinLoading, setCheckinLoading] = useState<boolean>(false);

  // Initialize Telegram WebApp Context and User Profile
  useEffect(() => {
    async function init() {
      try {
        let tgUser = undefined;
        let startParam = undefined;

        // Check if running inside real Telegram WebApp iFrame/Client
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
          const webApp = (window as any).Telegram.WebApp;
          webApp.ready();
          webApp.expand();
          if (webApp.initDataUnsafe?.user) {
            tgUser = webApp.initDataUnsafe.user;
          }
          if (webApp.initDataUnsafe?.start_param) {
            startParam = webApp.initDataUnsafe.start_param;
          }
        }

        // Check URL Query Parameters for referral deep links (?startapp=referrerID or ?start=referrerID)
        const urlParams = new URLSearchParams(window.location.search);
        const queryStart = urlParams.get('startapp') || urlParams.get('start');
        if (queryStart) startParam = queryStart;

        const res = await initUserProfile(tgUser, startParam);
        setUser(res.user);
        setConfig(res.config);
      } catch (err: any) {
        console.error('Initialization error:', err);
        setError(err.message || 'Failed to connect to backend server');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-3" />
        <h2 className="text-sm font-bold tracking-tight text-slate-300">
          Loading Watch Ads & Earn Platform...
        </h2>
        <p className="text-xs text-slate-500 mt-1">Connecting to Telegram Gateway & Security Shields</p>
      </div>
    );
  }

  if (error || !user || !config) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-sm w-full space-y-3">
          <h2 className="text-base font-bold text-red-400">Connection Failed</h2>
          <p className="text-xs text-slate-400">{error || 'Could not load profile'}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-md"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Task Actions Wrapper Handlers
  const handleWatchAd = async (taskId: string) => {
    const res = await completeAdTask(user.id, taskId);
    setUser(prev => prev ? {
      ...prev,
      totalBalanceCoins: res.newBalance,
      withdrawableCoins: res.newBalance,
      stats: {
        ...prev.stats,
        adsWatchedToday: res.adsWatchedToday,
        totalAdsWatched: prev.stats.totalAdsWatched + 1,
        totalEarnedCoins: prev.stats.totalEarnedCoins + res.rewardCoins
      }
    } : null);
    return res;
  };

  const handleCompleteCpa = async (taskId: string, proofCode?: string) => {
    const res = await completeCpaTask(user.id, taskId, proofCode);
    setUser(prev => prev ? {
      ...prev,
      totalBalanceCoins: res.newBalance,
      withdrawableCoins: res.newBalance,
      stats: {
        ...prev.stats,
        cpaTasksCompleted: prev.stats.cpaTasksCompleted + 1,
        totalEarnedCoins: prev.stats.totalEarnedCoins + res.rewardCoins
      }
    } : null);
    return res;
  };

  const handleClaimCheckin = async () => {
    setCheckinLoading(true);
    try {
      const res = await claimDailyCheckin(user.id);
      setUser(prev => prev ? {
        ...prev,
        totalBalanceCoins: res.newBalance,
        withdrawableCoins: res.newBalance,
        stats: {
          ...prev.stats,
          dailyStreak: res.streak,
          lastCheckinDate: new Date().toISOString().split('T')[0],
          spinsRemainingToday: res.bonusSpin ? prev.stats.spinsRemainingToday + 1 : prev.stats.spinsRemainingToday,
          totalEarnedCoins: prev.stats.totalEarnedCoins + res.rewardCoins
        }
      } : null);
    } catch (err: any) {
      alert(err.message || 'Check-in failed');
    } finally {
      setCheckinLoading(false);
    }
  };

  const handleSpinWheel = async (isBought: boolean) => {
    const res = await spinWheel(user.id, isBought);
    setUser(prev => prev ? {
      ...prev,
      totalBalanceCoins: res.newBalance,
      withdrawableCoins: res.newBalance,
      stats: {
        ...prev.stats,
        spinsRemainingToday: res.spinsRemaining,
        totalSpinsUsed: prev.stats.totalSpinsUsed + 1
      }
    } : null);
    return res;
  };

  const handleScratchCard = async () => {
    const res = await playScratchCard(user.id);
    setUser(prev => prev ? {
      ...prev,
      totalBalanceCoins: res.newBalance,
      withdrawableCoins: res.newBalance,
      stats: {
        ...prev.stats,
        scratchCardsUsedToday: prev.stats.scratchCardsUsedToday + 1
      }
    } : null);
    return res;
  };

  const handleSubmitWithdrawal = async (method: PaymentGatewayType, account: string, coins: number) => {
    const res = await submitWithdrawal(user.id, method, account, coins);
    setUser(prev => prev ? {
      ...prev,
      withdrawableCoins: res.newWithdrawableCoins,
      pendingBalanceCoins: prev.pendingBalanceCoins + coins
    } : null);
    return res;
  };

  const triggerCaptcha = (onSuccess: () => void) => {
    setCaptchaCallback(() => onSuccess);
    setShowCaptcha(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Fixed Sticky Header */}
      <Header
        user={user}
        onOpenBotSimulator={() => setShowBotSimulator(true)}
      />

      {/* Main Container Content */}
      <main className="flex-1 max-w-md mx-auto w-full p-4 pt-3">
        {activeTab === 'dashboard' && (
          <Dashboard
            user={user}
            config={config}
            onNavigate={(t) => setActiveTab(t)}
            onClaimCheckin={handleClaimCheckin}
            checkinLoading={checkinLoading}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksSection
            user={user}
            config={config}
            onWatchAd={handleWatchAd}
            onCompleteCpa={handleCompleteCpa}
            onClaimCheckin={handleClaimCheckin}
            onRequestCaptcha={triggerCaptcha}
          />
        )}

        {activeTab === 'games' && (
          <GamesSection
            user={user}
            onSpinWheel={handleSpinWheel}
            onScratchCard={handleScratchCard}
          />
        )}

        {activeTab === 'referral' && (
          <ReferralSection
            user={user}
            config={config}
          />
        )}

        {activeTab === 'wallet' && (
          <WalletSection
            user={user}
            config={config}
            onSubmitWithdrawal={handleSubmitWithdrawal}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardSection />
        )}
      </main>

      {/* Mobile Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={(t) => setActiveTab(t)}
      />

      {/* Telegram Bot Simulator Interactive Drawer */}
      <BotSimulatorDrawer
        isOpen={showBotSimulator}
        onClose={() => setShowBotSimulator(false)}
        telegramId={user.telegramId}
      />

      {/* Anti-Bot Captcha Modal */}
      {showCaptcha && (
        <CaptchaModal
          onSuccess={() => {
            setShowCaptcha(false);
            if (captchaCallback) captchaCallback();
          }}
          onClose={() => setShowCaptcha(false)}
        />
      )}
    </div>
  );
}
