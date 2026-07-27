export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface AntiFraudFlags {
  ipAddress: string;
  deviceFingerprint: string;
  isVpnDetected: boolean;
  isAdBlockerDetected: boolean;
  isFlagged: boolean;
  flagReason?: string;
  lastIpChange?: string;
  accountCreatedIp?: string;
}

export interface UserStats {
  adsWatchedToday: number;
  totalAdsWatched: number;
  cpaTasksCompleted: number;
  dailyStreak: number;
  lastCheckinDate: string | null;
  totalSpinsUsed: number;
  spinsRemainingToday: number;
  scratchCardsUsedToday: number;
  totalEarnedCoins: number;
  totalWithdrawnCoins: number;
}

export interface ReferralEarnings {
  level1Count: number;
  level2Count: number;
  level3Count: number;
  level1Earnings: number;
  level2Earnings: number;
  level3Earnings: number;
  totalReferralEarnings: number;
}

export interface UserProfile {
  id: string; // string representation of Telegram ID
  telegramId: number;
  username: string;
  firstName: string;
  lastName?: string;
  photoUrl?: string;
  createdAt: string;
  role: 'user' | 'admin';
  isBanned: boolean;
  banReason?: string;
  referrerId?: string; // ID of who invited this user
  
  // Balances
  totalBalanceCoins: number;
  pendingBalanceCoins: number;
  withdrawableCoins: number;
  
  // Stats & Security
  stats: UserStats;
  antiFraud: AntiFraudFlags;
  referralEarnings: ReferralEarnings;
}

export interface AdTask {
  id: string;
  title: string;
  description: string;
  type: 'rewarded_video' | 'interstitial' | 'banner' | 'pop_under';
  rewardCoins: number;
  cooldownSeconds: number;
  dailyLimit: number;
  icon: string;
  monetagZoneId?: string;
}

export interface CpaTask {
  id: string;
  title: string;
  description: string;
  category: 'Visit Website' | 'Sign Up' | 'Telegram Channel' | 'App Install';
  rewardCoins: number;
  requiredTimeSeconds: number;
  externalUrl: string;
  requiresProof: boolean; // secret code or screenshot
  secretCode?: string;
  instructions: string;
  isCompleted?: boolean;
}

export interface DailyCheckinReward {
  day: number;
  rewardCoins: number;
  bonusSpin?: boolean;
  description: string;
}

export interface SpinReward {
  id: string;
  label: string;
  type: 'coins' | 'spin' | 'empty';
  amount: number;
  color: string;
  probabilityWeight: number;
}

export interface ScratchCard {
  id: string;
  title: string;
  costCoins: number;
  minRewardCoins: number;
  maxRewardCoins: number;
  revealedCoins?: number;
}

export interface ReferralNode {
  telegramId: number;
  username: string;
  firstName: string;
  joinedAt: string;
  level: 1 | 2 | 3;
  coinsEarnedForReferrer: number;
  activeStatus: 'active' | 'inactive';
}

export type PaymentGatewayType = 'bKash' | 'Nagad' | 'Rocket' | 'USDT_TRC20' | 'Binance_Pay';

export interface PaymentMethodConfig {
  id: PaymentGatewayType;
  name: string;
  icon: string;
  currencySymbol: string;
  minCoins: number;
  coinConversionRate: number; // e.g. 1000 coins = 0.1 USD or 12 BDT
  fiatName: 'BDT' | 'USD';
  fiatRatio: number; // e.g., 1000 coins = 12 BDT or 0.1 USD
  accountLabel: string;
  placeholder: string;
  isEnabled: boolean;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  telegramId: number;
  username: string;
  paymentMethod: PaymentGatewayType;
  accountNumber: string;
  amountCoins: number;
  amountFiat: number;
  fiatCurrency: 'BDT' | 'USD';
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedAt: string;
  processedAt?: string;
  rejectionReason?: string;
  transactionHashOrNote?: string;
}

export interface LeaderboardEntry {
  rank: number;
  telegramId: number;
  username: string;
  firstName: string;
  totalEarnedCoins: number;
  weeklyEarnedCoins: number;
  referralsCount: number;
  isCurrentUser?: boolean;
}

export interface SystemConfig {
  siteName: string;
  coinsPerUsdRatio: number; // Default 10,000 coins = 1 USD
  coinsPerBdtRatio: number; // Default 1,000 coins = 12 BDT
  monetagZoneId: string;
  monetagScriptUrl: string;
  adRewardCoins: number;
  adsterraKey: string;
  level1CommissionPercent: number; // 10%
  level2CommissionPercent: number; // 5%
  level3CommissionPercent: number; // 2%
  signupBonusCoins: number; // 200
  dailyAdLimit: number; // 10
  minWithdrawalCoinsBdt: number; // 5000
  minWithdrawalCoinsUsdt: number; // 10000
  minReferralsRequiredForWithdrawal: number; // Default 3
  telegramBotToken: string;
  botUsername: string;
  supportUsername: string;
  maintenanceMode: boolean;
  vpnBlockerEnabled: boolean;
  adBlockerCheckEnabled: boolean;
  captchaRequiredForHighTasks: boolean;
}

export interface AdminStats {
  totalUsers: number;
  activeUsersToday: number;
  totalCoinsEarnedAllTime: number;
  totalPendingWithdrawalsCount: number;
  totalPendingWithdrawalsCoins: number;
  totalApprovedWithdrawalsCoins: number;
  flaggedUsersCount: number;
  totalAdsWatchedToday: number;
}
