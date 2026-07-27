import React, { useState, useEffect } from 'react';
import { UserProfile, SystemConfig, WithdrawalRequest, PaymentGatewayType } from '../types';
import { PAYMENT_METHODS } from '../data/mockData';
import { getWithdrawalHistory } from '../services/api';
import { Wallet, Smartphone, Building2, Coins, CreditCard, Clock, CheckCircle2, XCircle, ArrowUpRight, AlertCircle } from 'lucide-react';

interface WalletSectionProps {
  user: UserProfile;
  config: SystemConfig;
  onSubmitWithdrawal: (paymentMethod: PaymentGatewayType, accountNumber: string, amountCoins: number) => Promise<any>;
}

export const WalletSection: React.FC<WalletSectionProps> = ({
  user,
  config,
  onSubmitWithdrawal
}) => {
  const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayType>('bKash');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [amountCoinsInput, setAmountCoinsInput] = useState<string>('5000');
  const [history, setHistory] = useState<WithdrawalRequest[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const activeMethodConfig = PAYMENT_METHODS.find(m => m.id === selectedGateway) || PAYMENT_METHODS[0];

  const fetchHistory = async () => {
    try {
      const records = await getWithdrawalHistory(user.id);
      setHistory(records);
    } catch (err) {
      console.error('Error fetching withdrawal history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const coinsNum = Number(amountCoinsInput);
    if (!accountNumber.trim()) {
      setFeedback({ type: 'error', message: `Please enter your ${activeMethodConfig.accountLabel}` });
      return;
    }

    if (coinsNum < activeMethodConfig.minCoins) {
      setFeedback({ type: 'error', message: `Minimum payout for ${activeMethodConfig.name} is ${activeMethodConfig.minCoins.toLocaleString()} Coins.` });
      return;
    }

    if (user.withdrawableCoins < coinsNum) {
      setFeedback({ type: 'error', message: `Insufficient withdrawable coins balance.` });
      return;
    }

    setSubmitting(true);
    try {
      await onSubmitWithdrawal(selectedGateway, accountNumber, coinsNum);
      setFeedback({ type: 'success', message: 'Withdrawal request submitted! Payout processing typically completes in 1-6 hours.' });
      setAccountNumber('');
      fetchHistory();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Submission failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Convert input coins to fiat
  const inputCoinsVal = Number(amountCoinsInput) || 0;
  const estimatedFiat = activeMethodConfig.fiatName === 'BDT'
    ? ((inputCoinsVal / activeMethodConfig.coinConversionRate) * activeMethodConfig.fiatRatio).toFixed(2)
    : (inputCoinsVal / activeMethodConfig.coinConversionRate).toFixed(2);

  return (
    <div className="space-y-4 pb-20">
      {/* Balance Summary Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-5 border border-slate-700/80 shadow-xl space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-bold text-slate-300">
            <Wallet className="w-4 h-4 text-cyan-400" />
            Payout Wallet Balances
          </span>
          <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Automated / Manual Gateways
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
          <div className="bg-slate-950/80 rounded-2xl p-2.5 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-medium block">Total Balance</span>
            <span className="text-sm font-bold text-amber-300 mt-0.5 block">
              {user.totalBalanceCoins.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-950/80 rounded-2xl p-2.5 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-medium block">Pending</span>
            <span className="text-sm font-bold text-amber-400 mt-0.5 block">
              {user.pendingBalanceCoins.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-950/80 rounded-2xl p-2.5 border border-emerald-500/30">
            <span className="text-[10px] text-emerald-400 font-medium block">Withdrawable</span>
            <span className="text-sm font-bold text-emerald-400 mt-0.5 block">
              {user.withdrawableCoins.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Referral Gate Requirement Card */}
      {(() => {
        const minRefersRequired = config.minReferralsRequiredForWithdrawal ?? 3;
        const currentRefers = user.referralEarnings?.level1Count || 0;
        const isRefGateUnlocked = currentRefers >= minRefersRequired;

        return (
          <div className={`p-4 rounded-2xl border space-y-2 text-xs ${
            isRefGateUnlocked
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
          }`}>
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5">
                <AlertCircle className={`w-4 h-4 ${isRefGateUnlocked ? 'text-emerald-400' : 'text-amber-400'}`} />
                Referral Gate Security Validation
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                isRefGateUnlocked ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {isRefGateUnlocked ? 'UNLOCKED ✅' : 'LOCKED 🔒'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              {isRefGateUnlocked
                ? `You have satisfied the referral gate requirement with ${currentRefers} active referrals!`
                : `Payouts require at least ${minRefersRequired} active referrals. You currently have ${currentRefers} / ${minRefersRequired}. Invite ${minRefersRequired - currentRefers} more friend(s) to unlock withdrawals!`}
            </p>
          </div>
        );
      })()}

      {/* Payment Gateway Selector */}
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-slate-200">Select Payment Method</h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PAYMENT_METHODS.map(method => {
            const isSelected = selectedGateway === method.id;
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => {
                  setSelectedGateway(method.id);
                  setAmountCoinsInput(method.minCoins.toString());
                }}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-cyan-500/10 border-cyan-500/60 text-cyan-300 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">{method.name}</span>
                  <span className="text-[10px] font-bold text-amber-400">{method.currencySymbol}</span>
                </div>
                <span className="text-[9px] text-slate-500 block mt-1">
                  Min: {method.minCoins.toLocaleString()} Coins
                </span>
              </button>
            );
          })}
        </div>

        {/* Withdrawal Form */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              {activeMethodConfig.accountLabel}
            </label>
            <input
              type="text"
              placeholder={activeMethodConfig.placeholder}
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-300">Amount in Coins</label>
              <span className="text-[11px] font-bold text-emerald-400">
                ≈ {activeMethodConfig.currencySymbol}{estimatedFiat} {activeMethodConfig.fiatName}
              </span>
            </div>
            <input
              type="number"
              min={activeMethodConfig.minCoins}
              step="500"
              value={amountCoinsInput}
              onChange={e => setAmountCoinsInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {feedback && (
            <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              feedback.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border border-red-500/30 text-red-300'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{feedback.message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || user.withdrawableCoins < activeMethodConfig.minCoins}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-extrabold text-xs shadow-md shadow-cyan-500/20 hover:brightness-110 disabled:opacity-50"
          >
            {submitting ? 'Submitting Request...' : `Withdraw ${inputCoinsVal.toLocaleString()} Coins`}
          </button>
        </form>
      </div>

      {/* Withdrawal Status Tracker Table */}
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-amber-400" />
          Withdrawal Request Status Tracker
        </h3>

        {loadingHistory ? (
          <p className="text-xs text-slate-400 text-center py-4">Loading withdrawal logs...</p>
        ) : history.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">No withdrawal requests placed yet.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {history.map(w => (
              <div
                key={w.id}
                className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{w.paymentMethod}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({w.accountNumber})</span>
                  </div>

                  {w.status === 'Pending' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Pending ⏳
                    </span>
                  )}
                  {w.status === 'Approved' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Approved ✅
                    </span>
                  )}
                  {w.status === 'Rejected' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Rejected ❌
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{w.amountCoins.toLocaleString()} Coins</span>
                  <span className="font-bold text-slate-200">
                    {w.fiatCurrency === 'BDT' ? `৳${w.amountFiat} BDT` : `$${w.amountFiat} USD`}
                  </span>
                </div>

                {w.rejectionReason && (
                  <p className="text-[10px] text-red-400 bg-red-500/10 p-1.5 rounded border border-red-500/20">
                    Reason: {w.rejectionReason}
                  </p>
                )}

                {w.transactionHashOrNote && (
                  <p className="text-[10px] text-emerald-400 bg-emerald-500/10 p-1.5 rounded border border-emerald-500/20 font-mono">
                    TX / Note: {w.transactionHashOrNote}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
