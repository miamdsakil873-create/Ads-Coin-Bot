import React, { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../types';
import { getLeaderboard } from '../services/api';
import { Trophy, Award, Flame, Users, Sparkles } from 'lucide-react';

export const LeaderboardSection: React.FC = () => {
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRanks() {
      try {
        const data = await getLeaderboard();
        setBoard(data);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchRanks();
  }, []);

  const top3 = board.slice(0, 3);
  const restList = board.slice(3);

  return (
    <div className="space-y-4 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-amber-950 via-slate-900 to-slate-900 p-5 rounded-3xl border border-amber-500/30 text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
          <Trophy className="w-6 h-6 animate-pulse" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-100">Weekly Top Earners</h2>
        <p className="text-xs text-slate-400">
          Rankings reset every Sunday at midnight UTC. Top earners receive extra coin bonuses!
        </p>
      </div>

      {loading ? (
        <p className="text-xs text-slate-400 text-center py-8">Loading rankings...</p>
      ) : (
        <>
          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {/* 2nd Place Silver */}
            {top3[1] && (
              <div className="bg-slate-900/90 rounded-2xl p-3 border border-slate-400/40 text-center relative mt-4">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow">
                  #2 SILVER
                </span>
                <div className="w-10 h-10 mx-auto mt-2 rounded-full bg-slate-800 border-2 border-slate-400 flex items-center justify-center font-bold text-slate-200 text-xs">
                  {top3[1].firstName.charAt(0)}
                </div>
                <h4 className="text-xs font-bold text-slate-200 mt-1 truncate">{top3[1].firstName}</h4>
                <span className="text-xs font-extrabold text-slate-300 block mt-0.5">
                  {top3[1].totalEarnedCoins.toLocaleString()}
                </span>
                <span className="text-[9px] text-slate-400">Coins</span>
              </div>
            )}

            {/* 1st Place Gold */}
            {top3[0] && (
              <div className="bg-gradient-to-b from-amber-500/20 to-slate-900 rounded-2xl p-3 border-2 border-amber-400 text-center relative shadow-lg shadow-amber-500/10">
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-lg">
                  👑 #1 GOLD
                </span>
                <div className="w-12 h-12 mx-auto mt-2 rounded-full bg-amber-500/30 border-2 border-amber-400 flex items-center justify-center font-bold text-amber-300 text-sm">
                  {top3[0].firstName.charAt(0)}
                </div>
                <h4 className="text-xs font-bold text-amber-300 mt-1 truncate">{top3[0].firstName}</h4>
                <span className="text-sm font-extrabold text-amber-400 block mt-0.5">
                  {top3[0].totalEarnedCoins.toLocaleString()}
                </span>
                <span className="text-[9px] text-amber-400/80">Coins</span>
              </div>
            )}

            {/* 3rd Place Bronze */}
            {top3[2] && (
              <div className="bg-slate-900/90 rounded-2xl p-3 border border-amber-700/40 text-center relative mt-6">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-700 text-slate-100 font-black text-[10px] px-2 py-0.5 rounded-full shadow">
                  #3 BRONZE
                </span>
                <div className="w-10 h-10 mx-auto mt-2 rounded-full bg-slate-800 border-2 border-amber-700 flex items-center justify-center font-bold text-amber-500 text-xs">
                  {top3[2].firstName.charAt(0)}
                </div>
                <h4 className="text-xs font-bold text-slate-200 mt-1 truncate">{top3[2].firstName}</h4>
                <span className="text-xs font-extrabold text-slate-300 block mt-0.5">
                  {top3[2].totalEarnedCoins.toLocaleString()}
                </span>
                <span className="text-[9px] text-slate-400">Coins</span>
              </div>
            )}
          </div>

          {/* Ranks 4 to 50 List */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold text-slate-300">Global Earners Board</h3>

            <div className="space-y-1.5">
              {restList.map(entry => (
                <div
                  key={entry.telegramId}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 font-bold text-slate-500 text-center">#{entry.rank}</span>
                    <div>
                      <h4 className="font-bold text-slate-200">{entry.firstName}</h4>
                      <span className="text-[10px] text-slate-400">@{entry.username}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-amber-400 block">
                      {entry.totalEarnedCoins.toLocaleString()} Coins
                    </span>
                    <span className="text-[9px] text-slate-500">
                      {entry.referralsCount} Referrals
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
