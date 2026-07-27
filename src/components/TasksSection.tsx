import React, { useState, useEffect } from 'react';
import { UserProfile, SystemConfig, CpaTask } from '../types';
import { INITIAL_AD_TASKS, INITIAL_CPA_TASKS, DAILY_CHECKIN_REWARDS } from '../data/mockData';
import { 
  Tv, 
  ExternalLink, 
  Flame, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  PlayCircle,
  Key,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TasksSectionProps {
  user: UserProfile;
  config: SystemConfig;
  onWatchAd: (taskId: string) => Promise<any>;
  onCompleteCpa: (taskId: string, proofCode?: string) => Promise<any>;
  onClaimCheckin: () => Promise<any>;
  onRequestCaptcha: (onSuccess: () => void) => void;
}

export const TasksSection: React.FC<TasksSectionProps> = ({
  user,
  config,
  onWatchAd,
  onCompleteCpa,
  onClaimCheckin,
  onRequestCaptcha
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ads' | 'cpa' | 'checkin'>('ads');
  
  // Ad Player Modal State
  const [activeAdTask, setActiveAdTask] = useState<typeof INITIAL_AD_TASKS[0] | null>(null);
  const [adTimer, setAdTimer] = useState<number>(0);
  const [adPlaying, setAdPlaying] = useState<boolean>(false);
  const [adCompleted, setAdCompleted] = useState<boolean>(false);
  const [adLoading, setAdLoading] = useState<boolean>(false);
  const [adError, setAdError] = useState<string | null>(null);

  // CPA Task Modal State
  const [activeCpaTask, setActiveCpaTask] = useState<CpaTask | null>(null);
  const [cpaSecretCode, setCpaSecretCode] = useState<string>('');
  const [cpaTimer, setCpaTimer] = useState<number>(0);
  const [cpaLoading, setCpaLoading] = useState<boolean>(false);
  const [cpaCompletedIds, setCpaCompletedIds] = useState<string[]>([]);
  const [cpaMsg, setCpaMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Ad Timer Countdown Effect
  useEffect(() => {
    let interval: any = null;
    if (adPlaying && adTimer > 0) {
      interval = setInterval(() => {
        setAdTimer(prev => {
          if (prev <= 1) {
            setAdPlaying(false);
            setAdCompleted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [adPlaying, adTimer]);

  // CPA Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (activeCpaTask && cpaTimer > 0) {
      interval = setInterval(() => {
        setCpaTimer(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeCpaTask, cpaTimer]);

  // CPA Tasks state
  const [cpaTaskList, setCpaTaskList] = useState<CpaTask[]>(INITIAL_CPA_TASKS);

  // Fetch live CPA tasks from backend API
  useEffect(() => {
    async function loadCpaTasks() {
      try {
        const res = await fetch('/api/tasks/cpa-list');
        const data = await res.json();
        if (data.success && data.tasks && data.tasks.length > 0) {
          setCpaTaskList(data.tasks);
        }
      } catch (e) {
        console.error('CPA list fetch error:', e);
      }
    }
    loadCpaTasks();
  }, []);

  // Handle Start Watching Ad with Monetag SDK Fallback
  const handleStartAd = (ad: typeof INITIAL_AD_TASKS[0]) => {
    setAdError(null);
    if (user.stats.adsWatchedToday >= config.dailyAdLimit) {
      setAdError(`Daily ad limit reached (${config.dailyAdLimit}/${config.dailyAdLimit}).`);
      return;
    }

    const triggerAdFlow = () => {
      const monetagZone = config.monetagZoneId || '9537184';
      const sdkFn = (window as any)[`show_${monetagZone}`] || (window as any).show_9537184;

      if (typeof sdkFn === 'function') {
        try {
          sdkFn().then(() => {
            onWatchAd(ad.id).then(() => {
              confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
            }).catch((err: any) => {
              setAdError(err.message || 'Ad completion verification failed');
            });
          }).catch(() => {
            // Fallback to timer modal if ad popup fails or is closed
            setActiveAdTask(ad);
            setAdTimer(15);
            setAdPlaying(true);
            setAdCompleted(false);
          });
        } catch (e) {
          setActiveAdTask(ad);
          setAdTimer(15);
          setAdPlaying(true);
          setAdCompleted(false);
        }
      } else {
        // Fallback to interactive timer modal
        setActiveAdTask(ad);
        setAdTimer(15);
        setAdPlaying(true);
        setAdCompleted(false);
      }
    };

    if (config.captchaRequiredForHighTasks && user.stats.adsWatchedToday > 0 && user.stats.adsWatchedToday % 3 === 0) {
      onRequestCaptcha(triggerAdFlow);
    } else {
      triggerAdFlow();
    }
  };

  // Claim Ad Reward
  const handleClaimAdReward = async () => {
    if (!activeAdTask) return;
    setAdLoading(true);
    setAdError(null);
    try {
      const res = await onWatchAd(activeAdTask.id);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      setActiveAdTask(null);
    } catch (err: any) {
      setAdError(err.message || 'Failed to claim ad reward');
    } finally {
      setAdLoading(false);
    }
  };

  // Handle CPA Start
  const handleStartCpa = (task: CpaTask) => {
    setCpaMsg(null);
    setActiveCpaTask(task);
    setCpaTimer(task.requiredTimeSeconds);
    window.open(task.externalUrl, '_blank');
  };

  const handleClaimCpa = async () => {
    if (!activeCpaTask) return;
    setCpaLoading(true);
    setCpaMsg(null);
    try {
      await onCompleteCpa(activeCpaTask.id, cpaSecretCode);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setCpaCompletedIds(prev => [...prev, activeCpaTask.id]);
      setCpaMsg({ type: 'success', text: `Completed! +${activeCpaTask.rewardCoins} Coins added.` });
      setTimeout(() => setActiveCpaTask(null), 1500);
    } catch (err: any) {
      setCpaMsg({ type: 'error', text: err.message || 'Verification failed.' });
    } finally {
      setCpaLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4 pb-20">
      {/* Top Sub-Tab Navigation */}
      <div className="flex rounded-2xl bg-slate-900 p-1 border border-slate-800">
        <button
          onClick={() => setActiveSubTab('ads')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'ads'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          Monetag Video Ads
        </button>

        <button
          onClick={() => setActiveSubTab('cpa')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'cpa'
              ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Direct Tasks
        </button>

        <button
          onClick={() => setActiveSubTab('checkin')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'checkin'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          7-Day Streak
        </button>
      </div>

      {/* ADS TAB */}
      {activeSubTab === 'ads' && (
        <div className="space-y-3">
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Daily Watched:</span>
            <span className="font-bold text-cyan-400">
              {user.stats.adsWatchedToday} / {config.dailyAdLimit} Ads Today
            </span>
          </div>

          {INITIAL_AD_TASKS.map(ad => (
            <div
              key={ad.id}
              className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <PlayCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">{ad.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{ad.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      +{ad.rewardCoins} Coins
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 15s timer
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleStartAd(ad)}
                disabled={user.stats.adsWatchedToday >= config.dailyAdLimit}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                Watch Ad
              </button>
            </div>
          ))}
        </div>
      )}

      {/* CPA TASKS TAB */}
      {activeSubTab === 'cpa' && (
        <div className="space-y-3">
          {cpaTaskList.map(task => {
            const isDone = cpaCompletedIds.includes(task.id);
            return (
              <div
                key={task.id}
                className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                      {task.category}
                    </span>
                    <h4 className="text-xs font-bold text-slate-100 mt-1">{task.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{task.description}</p>
                  </div>
                  <span className="text-xs font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20 shrink-0">
                    +{task.rewardCoins} Coins
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800 pt-2.5">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    {task.requiredTimeSeconds}s required
                  </span>

                  <button
                    onClick={() => handleStartCpa(task)}
                    disabled={isDone}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isDone
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20'
                    }`}
                  >
                    {isDone ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Completed
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-3.5 h-3.5" /> Start Task
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CHECK-IN STREAK TAB */}
      {activeSubTab === 'checkin' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-slate-900 rounded-2xl p-4 border border-amber-500/30 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-amber-300">Daily Login Bonus</h3>
              <p className="text-xs text-slate-400 mt-0.5">Consecutive logins increase daily rewards!</p>
            </div>
            <button
              onClick={onClaimCheckin}
              disabled={user.stats.lastCheckinDate === todayStr}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              {user.stats.lastCheckinDate === todayStr ? 'Claimed Today' : 'Claim Now'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {DAILY_CHECKIN_REWARDS.map(item => {
              const isCurrentStreak = user.stats.dailyStreak === item.day;
              return (
                <div
                  key={item.day}
                  className={`rounded-2xl p-3 border text-center transition-all ${
                    isCurrentStreak
                      ? 'bg-gradient-to-b from-amber-500/20 to-slate-900 border-amber-500/60 shadow-lg shadow-amber-500/10 scale-105'
                      : 'bg-slate-900/90 border-slate-800'
                  }`}
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Day {item.day}</span>
                  <div className="my-1 text-sm font-extrabold text-amber-300">
                    +{item.rewardCoins}
                  </div>
                  <span className="text-[9px] text-slate-400 block truncate">{item.description}</span>
                  {item.bonusSpin && (
                    <span className="mt-1 inline-block text-[9px] font-bold text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded">
                      +1 Free Spin
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AD WATCH MODAL PLAYER */}
      {activeAdTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full space-y-4 text-center relative overflow-hidden">
            <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Tv className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-100">{activeAdTask.title}</h3>
              <p className="text-xs text-slate-400 mt-1">
                Monetag / Adsterra Sponsor Video Ad Loading...
              </p>
            </div>

            {/* Simulated Video Player Stage */}
            <div className="relative bg-slate-950 rounded-2xl h-44 border border-slate-800 flex flex-col items-center justify-center p-4">
              {adPlaying ? (
                <>
                  <div className="w-12 h-12 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin mb-2"></div>
                  <span className="text-sm font-bold text-cyan-400">Watching Ad... {adTimer}s</span>
                  <span className="text-[10px] text-slate-500 mt-1">Do not close window</span>
                </>
              ) : adCompleted ? (
                <>
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-1 animate-bounce" />
                  <span className="text-sm font-bold text-emerald-400">Ad Completed!</span>
                  <span className="text-xs text-slate-300 mt-1">
                    Reward Ready: +{activeAdTask.rewardCoins} Coins
                  </span>
                </>
              ) : null}
            </div>

            {adError && (
              <p className="text-xs text-red-400 font-medium">{adError}</p>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveAdTask(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
              {adCompleted && (
                <button
                  onClick={handleClaimAdReward}
                  disabled={adLoading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-extrabold hover:brightness-110"
                >
                  {adLoading ? 'Crediting...' : 'Claim Coins'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CPA VERIFICATION MODAL */}
      {activeCpaTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100">{activeCpaTask.title}</h3>
              <button
                onClick={() => setActiveCpaTask(null)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
              <strong>Instructions:</strong> {activeCpaTask.instructions}
            </div>

            {activeCpaTask.requiresProof && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-purple-400" />
                  Enter Secret Verification Code / Proof:
                </label>
                <input
                  type="text"
                  placeholder="e.g. JOIN2026 or Binance UID"
                  value={cpaSecretCode}
                  onChange={e => setCpaSecretCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-purple-500"
                />
              </div>
            )}

            {cpaMsg && (
              <p className={`text-xs font-bold ${cpaMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                {cpaMsg.text}
              </p>
            )}

            <button
              onClick={handleClaimCpa}
              disabled={cpaLoading || cpaTimer > 0}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md disabled:opacity-50"
            >
              {cpaTimer > 0 ? `Wait ${cpaTimer}s...` : cpaLoading ? 'Verifying...' : 'Submit Proof & Claim'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
