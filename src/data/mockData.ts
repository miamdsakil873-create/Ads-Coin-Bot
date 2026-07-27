import { 
  AdTask, 
  CpaTask, 
  DailyCheckinReward, 
  SpinReward, 
  PaymentMethodConfig, 
  SystemConfig,
  LeaderboardEntry
} from '../types';

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  siteName: 'AdCoinz Telegram Network',
  coinsPerUsdRatio: 10000, // 10,000 Coins = $1.00 USD
  coinsPerBdtRatio: 1000,   // 1,000 Coins = ৳12.00 BDT
  monetagZoneId: '9537184',
  monetagScriptUrl: '//libtl.com',
  adRewardCoins: 150,
  adsterraKey: 'adst_998877',
  level1CommissionPercent: 10,
  level2CommissionPercent: 5,
  level3CommissionPercent: 2,
  signupBonusCoins: 200,
  dailyAdLimit: 10,
  minWithdrawalCoinsBdt: 5000,  // ৳60 BDT
  minWithdrawalCoinsUsdt: 10000, // $1.00 USD
  minReferralsRequiredForWithdrawal: 3,
  telegramBotToken: '8156075807:AAFrAOog64ZTvCPHr_4T3FQTPixmMo5RYmI',
  botUsername: 'adcoinz_bot',
  supportUsername: 'adcoinz_support',
  maintenanceMode: false,
  vpnBlockerEnabled: true,
  adBlockerCheckEnabled: true,
  captchaRequiredForHighTasks: true
};

export const INITIAL_AD_TASKS: AdTask[] = [
  {
    id: 'ad_video_1',
    title: 'Watch Rewarded Video #1',
    description: 'Watch a 15-second sponsor video to earn coins instantly.',
    type: 'rewarded_video',
    rewardCoins: 150,
    cooldownSeconds: 60,
    dailyLimit: 10,
    icon: 'Tv'
  },
  {
    id: 'ad_interstitial_1',
    title: 'Monetag Interstitial View',
    description: 'Load high-eCPM interstitial ad overlay.',
    type: 'interstitial',
    rewardCoins: 100,
    cooldownSeconds: 30,
    dailyLimit: 10,
    icon: 'Sparkles'
  },
  {
    id: 'ad_popunder_1',
    title: 'Adsterra Pop-under Visit',
    description: 'Open sponsor partner link in background window.',
    type: 'pop_under',
    rewardCoins: 120,
    cooldownSeconds: 45,
    dailyLimit: 10,
    icon: 'ExternalLink'
  }
];

export const INITIAL_CPA_TASKS: CpaTask[] = [
  {
    id: 'cpa_tg_channel',
    title: 'Join Official Telegram Channel',
    description: 'Subscribe to @EarnAdsOfficial channel for daily promo codes & updates.',
    category: 'Telegram Channel',
    rewardCoins: 500,
    requiredTimeSeconds: 5,
    externalUrl: 'https://t.me/EarnAdsOfficial',
    requiresProof: true,
    secretCode: 'JOIN2026',
    instructions: 'Join channel, find pinned post secret code, enter code below.'
  },
  {
    id: 'cpa_visit_web',
    title: 'Explore Crypto Exchange Review',
    description: 'Visit page, stay for 30 seconds to read the article.',
    category: 'Visit Website',
    rewardCoins: 350,
    requiredTimeSeconds: 30,
    externalUrl: 'https://example.com/crypto-review',
    requiresProof: false,
    instructions: 'Click Start, keep the window open until 30s timer finishes.'
  },
  {
    id: 'cpa_signup_app',
    title: 'Sign Up on Binance Partner Link',
    description: 'Create a free account and submit your User ID (UID).',
    category: 'Sign Up',
    rewardCoins: 1500,
    requiredTimeSeconds: 60,
    externalUrl: 'https://binance.com',
    requiresProof: true,
    instructions: 'Register account, copy your 8-digit Binance UID and submit as proof.'
  }
];

export const DAILY_CHECKIN_REWARDS: DailyCheckinReward[] = [
  { day: 1, rewardCoins: 50, description: 'Day 1 Bonus' },
  { day: 2, rewardCoins: 100, description: 'Day 2 Streak' },
  { day: 3, rewardCoins: 150, description: 'Day 3 Streak' },
  { day: 4, rewardCoins: 250, description: 'Day 4 Streak' },
  { day: 5, rewardCoins: 400, description: 'Day 5 Streak' },
  { day: 6, rewardCoins: 600, description: 'Day 6 Mega Boost' },
  { day: 7, rewardCoins: 1200, bonusSpin: true, description: 'Day 7 Jackpot + Extra Spin!' }
];

export const SPIN_WHEEL_REWARDS: SpinReward[] = [
  { id: 'sp_100', label: '100 Coins', type: 'coins', amount: 100, color: '#3B82F6', probabilityWeight: 35 },
  { id: 'sp_250', label: '250 Coins', type: 'coins', amount: 250, color: '#10B981', probabilityWeight: 25 },
  { id: 'sp_500', label: '500 Coins', type: 'coins', amount: 500, color: '#F59E0B', probabilityWeight: 15 },
  { id: 'sp_spin', label: '+1 Free Spin', type: 'spin', amount: 1, color: '#8B5CF6', probabilityWeight: 10 },
  { id: 'sp_50', label: '50 Coins', type: 'coins', amount: 50, color: '#6B7280', probabilityWeight: 10 },
  { id: 'sp_jackpot', label: '2,500 GOLD', type: 'coins', amount: 2500, color: '#EC4899', probabilityWeight: 5 }
];

export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'bKash',
    name: 'bKash Personal',
    icon: 'Smartphone',
    currencySymbol: '৳',
    minCoins: 5000,
    coinConversionRate: 1000, // 1000 coins = 12 BDT
    fiatName: 'BDT',
    fiatRatio: 12,
    accountLabel: 'bKash Mobile Number',
    placeholder: '01712345678',
    isEnabled: true
  },
  {
    id: 'Nagad',
    name: 'Nagad Wallet',
    icon: 'Wallet',
    currencySymbol: '৳',
    minCoins: 5000,
    coinConversionRate: 1000,
    fiatName: 'BDT',
    fiatRatio: 12,
    accountLabel: 'Nagad Mobile Number',
    placeholder: '01812345678',
    isEnabled: true
  },
  {
    id: 'Rocket',
    name: 'Rocket Banking',
    icon: 'Building2',
    currencySymbol: '৳',
    minCoins: 5000,
    coinConversionRate: 1000,
    fiatName: 'BDT',
    fiatRatio: 12,
    accountLabel: 'Rocket Mobile + Check Digit',
    placeholder: '019123456789',
    isEnabled: true
  },
  {
    id: 'USDT_TRC20',
    name: 'USDT (TRC-20)',
    icon: 'Coins',
    currencySymbol: '$',
    minCoins: 10000,
    coinConversionRate: 10000, // 10000 coins = $1.00 USD
    fiatName: 'USD',
    fiatRatio: 1,
    accountLabel: 'TRC20 Wallet Address',
    placeholder: 'TXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    isEnabled: true
  },
  {
    id: 'Binance_Pay',
    name: 'Binance Pay ID',
    icon: 'CreditCard',
    currencySymbol: '$',
    minCoins: 10000,
    coinConversionRate: 10000,
    fiatName: 'USD',
    fiatRatio: 1,
    accountLabel: 'Binance Pay ID or Email',
    placeholder: '123456789 or user@binance.com',
    isEnabled: true
  }
];

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, telegramId: 98765432, username: 'tariq_pro', firstName: 'Tariq Islam', totalEarnedCoins: 85400, weeklyEarnedCoins: 24500, referralsCount: 84 },
  { rank: 2, telegramId: 87654321, username: 'crypto_tanvir', firstName: 'Tanvir Hossain', totalEarnedCoins: 62100, weeklyEarnedCoins: 18900, referralsCount: 52 },
  { rank: 3, telegramId: 76543210, username: 'sadia_m', firstName: 'Sadia Rahman', totalEarnedCoins: 51200, weeklyEarnedCoins: 15400, referralsCount: 41 },
  { rank: 4, telegramId: 65432109, username: 'rahim_king', firstName: 'Abdur Rahim', totalEarnedCoins: 42800, weeklyEarnedCoins: 12100, referralsCount: 29 },
  { rank: 5, telegramId: 54321098, username: 'web3_faysal', firstName: 'Faysal Ahmed', totalEarnedCoins: 38900, weeklyEarnedCoins: 10800, referralsCount: 23 },
  { rank: 6, telegramId: 43210987, username: 'mim_earn', firstName: 'Mim Akter', totalEarnedCoins: 31500, weeklyEarnedCoins: 9200, referralsCount: 18 },
  { rank: 7, telegramId: 32109876, username: 'sakib_bot', firstName: 'Sakib Al Hasan', totalEarnedCoins: 27400, weeklyEarnedCoins: 7600, referralsCount: 15 }
];
