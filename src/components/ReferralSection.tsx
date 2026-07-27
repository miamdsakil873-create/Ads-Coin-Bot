import React, { useState, useEffect } from 'react';
import { UserProfile, SystemConfig, ReferralNode } from '../types';
import { getReferrals } from '../services/api';
import { Users, Copy, Check, Share2, Layers, Award, Sparkles, UserCheck, ShieldCheck } from 'lucide-react';

interface ReferralSectionProps {
  user: UserProfile;
  config: SystemConfig;
}

export const ReferralSection: React.FC<ReferralSectionProps> = ({ user, config }) => {
  const [copied, setCopied] = useState(false);
  const [nodes, setNodes] = useState<ReferralNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLevelFilter, setActiveLevelFilter] = useState<0 | 1 | 2 | 3>(0);

  const botUsername = config.botUsername || 'EarnAdsOfficialBot';
  const refLink = `https://t.me/${botUsername}?start=${user.telegramId}`;

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getReferrals(user.id);
        setNodes(res.nodes || []);
      } catch (err) {
        console.error('Failed to load referral tree:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user.id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(`🎉 Join me on Watch Ads & Earn Bot to get +200 FREE coins bonus! Earn real cash daily.`);
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${text}`;
    window.open(shareUrl, '_blank');
  };

  const filteredNodes = activeLevelFilter === 0 
    ? nodes 
    : nodes.filter(n => n.level === activeLevelFilter);

  return (
    <div className="space-y-4 pb-20">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 p-5 rounded-3xl border border-emerald-500/30 relative overflow-hidden">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
          <Users className="w-4 h-4" />
          <span>3-Level Passive Affiliate System</span>
        </div>

        <h2 className="text-xl font-extrabold text-slate-100 mt-1">
          Build Your Passive Earnings Network
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          Earn lifetime commission whenever your team watches ads or completes tasks!
        </p>

        {/* 3 Tier Commission Breakdown Grid */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-slate-900/90 rounded-2xl p-2.5 border border-emerald-500/40 text-center">
            <span className="text-[10px] font-bold text-emerald-400 block">Level 1</span>
            <span className="text-lg font-black text-slate-100">10%</span>
            <span className="text-[9px] text-slate-400 block">Direct Invite</span>
          </div>

          <div className="bg-slate-900/90 rounded-2xl p-2.5 border border-cyan-500/40 text-center">
            <span className="text-[10px] font-bold text-cyan-400 block">Level 2</span>
            <span className="text-lg font-black text-slate-100">5%</span>
            <span className="text-[9px] text-slate-400 block">Indirect L2</span>
          </div>

          <div className="bg-slate-900/90 rounded-2xl p-2.5 border border-purple-500/40 text-center">
            <span className="text-[10px] font-bold text-purple-400 block">Level 3</span>
            <span className="text-lg font-black text-slate-100">2%</span>
            <span className="text-[9px] text-slate-400 block">Deep Network</span>
          </div>
        </div>
      </div>

      {/* Direct Referral Link Share Card */}
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200">Your Unique Telegram Link</h3>
          <span className="text-[10px] text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
            +200 Coins Signup Bonus
          </span>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
          <input
            type="text"
            readOnly
            value={refLink}
            className="bg-transparent text-xs text-slate-300 w-full outline-none font-mono truncate px-1"
          />
          <button
            onClick={handleCopy}
            className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold flex items-center gap-1 transition-all shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <button
          onClick={handleShareTelegram}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 hover:brightness-110"
        >
          <Share2 className="w-4 h-4" />
          Share Direct to Telegram Friends
        </button>
      </div>

      {/* Network Stats Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800">
          <span className="text-[10px] text-slate-400 font-medium block">Total Referrals</span>
          <span className="text-xl font-bold text-emerald-400 mt-0.5 block">
            {user.referralEarnings.level1Count + user.referralEarnings.level2Count + user.referralEarnings.level3Count} Members
          </span>
        </div>

        <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800">
          <span className="text-[10px] text-slate-400 font-medium block">Referral Commission</span>
          <span className="text-xl font-bold text-amber-400 mt-0.5 block">
            {user.referralEarnings.totalReferralEarnings.toLocaleString()} Coins
          </span>
        </div>
      </div>

      {/* Tree Filter & List */}
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-400" />
            Downline Team Tree ({filteredNodes.length})
          </h3>

          <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-[10px]">
            {[0, 1, 2, 3].map(lvl => (
              <button
                key={lvl}
                onClick={() => setActiveLevelFilter(lvl as any)}
                className={`px-2 py-1 rounded font-bold transition-all ${
                  activeLevelFilter === lvl
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl === 0 ? 'All' : `L${lvl}`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 text-center py-4">Loading referral tree...</p>
        ) : filteredNodes.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl">
            <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No active team members found in this tier yet.</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Share your link to start earning 10% lifetime commissions!</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {filteredNodes.map((node, idx) => (
              <div
                key={idx}
                className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                    node.level === 1 ? 'bg-emerald-500/20 text-emerald-400' :
                    node.level === 2 ? 'bg-cyan-500/20 text-cyan-400' : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    L{node.level}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200">{node.firstName}</h4>
                    <span className="text-[10px] text-slate-400">@{node.username || 'user'}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-amber-400 block">+{node.coinsEarnedForReferrer} Coins</span>
                  <span className={`text-[9px] font-semibold ${node.activeStatus === 'active' ? 'text-emerald-400' : 'text-slate-500'}`}>
                    ● {node.activeStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
