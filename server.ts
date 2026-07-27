import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { 
  UserProfile, 
  WithdrawalRequest, 
  SystemConfig, 
  ReferralNode,
  CpaTask,
  PaymentGatewayType,
  LeaderboardEntry
} from './src/types';
import { 
  DEFAULT_SYSTEM_CONFIG, 
  INITIAL_AD_TASKS, 
  INITIAL_CPA_TASKS, 
  DAILY_CHECKIN_REWARDS, 
  SPIN_WHEEL_REWARDS,
  PAYMENT_METHODS,
  MOCK_LEADERBOARD
} from './src/data/mockData';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Path for simple persistent storage file
const DATA_FILE = path.join(process.cwd(), 'server_data.json');

interface DatabaseSchema {
  users: Record<string, UserProfile>;
  withdrawals: WithdrawalRequest[];
  config: SystemConfig;
  broadcastLogs: Array<{ id: string; timestamp: string; message: string; targetCount: number }>;
  cpaTasks: CpaTask[];
  taskCompletions: Record<string, string[]>; // userId -> array of taskId
}

// Initial default DB
let db: DatabaseSchema = {
  users: {},
  withdrawals: [],
  config: { ...DEFAULT_SYSTEM_CONFIG },
  broadcastLogs: [],
  cpaTasks: [...INITIAL_CPA_TASKS],
  taskCompletions: {}
};

// Load data from JSON if present
function loadDatabase() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      db = {
        ...db,
        ...parsed,
        config: { ...DEFAULT_SYSTEM_CONFIG, ...(parsed.config || {}) }
      };
      console.log(`[Database] Loaded ${Object.keys(db.users).length} users and ${db.withdrawals.length} withdrawals.`);
    } else {
      seedDemoUsers();
      saveDatabase();
    }
  } catch (err) {
    console.error('[Database] Load error:', err);
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Database] Save error:', err);
  }
}

// Seed initial demo users for testing
function seedDemoUsers() {
  const demoTgId = 123456789;
  const demoUser: UserProfile = {
    id: demoTgId.toString(),
    telegramId: demoTgId,
    username: 'demo_earner',
    firstName: 'Alex Earner',
    createdAt: new Date().toISOString(),
    role: 'user',
    isBanned: false,
    totalBalanceCoins: 4850,
    pendingBalanceCoins: 250,
    withdrawableCoins: 4600,
    stats: {
      adsWatchedToday: 4,
      totalAdsWatched: 38,
      cpaTasksCompleted: 2,
      dailyStreak: 3,
      lastCheckinDate: new Date().toISOString().split('T')[0],
      totalSpinsUsed: 5,
      spinsRemainingToday: 3,
      scratchCardsUsedToday: 1,
      totalEarnedCoins: 6200,
      totalWithdrawnCoins: 1600
    },
    antiFraud: {
      ipAddress: '127.0.0.1',
      deviceFingerprint: 'fp_demo_device_9988',
      isVpnDetected: false,
      isAdBlockerDetected: false,
      isFlagged: false,
      accountCreatedIp: '127.0.0.1'
    },
    referralEarnings: {
      level1Count: 3,
      level2Count: 2,
      level3Count: 1,
      level1Earnings: 850,
      level2Earnings: 220,
      level3Earnings: 50,
      totalReferralEarnings: 1120
    }
  };

  db.users[demoTgId.toString()] = demoUser;

  // Demo L1 referrals
  const ref1: UserProfile = {
    id: '99111',
    telegramId: 99111,
    username: 'referral_john',
    firstName: 'John Doe',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    role: 'user',
    isBanned: false,
    referrerId: demoTgId.toString(),
    totalBalanceCoins: 1200,
    pendingBalanceCoins: 0,
    withdrawableCoins: 1200,
    stats: {
      adsWatchedToday: 2,
      totalAdsWatched: 12,
      cpaTasksCompleted: 1,
      dailyStreak: 2,
      lastCheckinDate: new Date().toISOString().split('T')[0],
      totalSpinsUsed: 2,
      spinsRemainingToday: 2,
      scratchCardsUsedToday: 0,
      totalEarnedCoins: 1200,
      totalWithdrawnCoins: 0
    },
    antiFraud: {
      ipAddress: '192.168.1.10',
      deviceFingerprint: 'fp_john_dev',
      isVpnDetected: false,
      isAdBlockerDetected: false,
      isFlagged: false
    },
    referralEarnings: { level1Count: 0, level2Count: 0, level3Count: 0, level1Earnings: 0, level2Earnings: 0, level3Earnings: 0, totalReferralEarnings: 0 }
  };
  db.users['99111'] = ref1;

  // Add a pending demo withdrawal
  db.withdrawals.push({
    id: 'w_demo_1001',
    userId: demoTgId.toString(),
    telegramId: demoTgId,
    username: 'demo_earner',
    paymentMethod: 'bKash',
    accountNumber: '01712345678',
    amountCoins: 5000,
    amountFiat: 60,
    fiatCurrency: 'BDT',
    status: 'Pending',
    requestedAt: new Date(Date.now() - 3600000 * 4).toISOString()
  });
}

loadDatabase();

// ---------------------------------------------------------------------------
// HELPER LOGIC FOR 3-TIER REFERRALS & ANTI-FRAUD
// ---------------------------------------------------------------------------

function processReferralCommission(earnerId: string, coinsEarned: number, taskName: string) {
  const earner = db.users[earnerId];
  if (!earner || !earner.referrerId) return;

  // Level 1 Referrer
  const l1Id = earner.referrerId;
  const l1User = db.users[l1Id];
  if (l1User && !l1User.isBanned) {
    const l1Amount = Math.floor((coinsEarned * db.config.level1CommissionPercent) / 100);
    if (l1Amount > 0) {
      l1User.totalBalanceCoins += l1Amount;
      l1User.withdrawableCoins += l1Amount;
      l1User.referralEarnings.level1Earnings += l1Amount;
      l1User.referralEarnings.totalReferralEarnings += l1Amount;
      l1User.stats.totalEarnedCoins += l1Amount;

      // Level 2 Referrer
      if (l1User.referrerId) {
        const l2Id = l1User.referrerId;
        const l2User = db.users[l2Id];
        if (l2User && !l2User.isBanned) {
          const l2Amount = Math.floor((coinsEarned * db.config.level2CommissionPercent) / 100);
          if (l2Amount > 0) {
            l2User.totalBalanceCoins += l2Amount;
            l2User.withdrawableCoins += l2Amount;
            l2User.referralEarnings.level2Earnings += l2Amount;
            l2User.referralEarnings.totalReferralEarnings += l2Amount;
            l2User.stats.totalEarnedCoins += l2Amount;

            // Level 3 Referrer
            if (l2User.referrerId) {
              const l3Id = l2User.referrerId;
              const l3User = db.users[l3Id];
              if (l3User && !l3User.isBanned) {
                const l3Amount = Math.floor((coinsEarned * db.config.level3CommissionPercent) / 100);
                if (l3Amount > 0) {
                  l3User.totalBalanceCoins += l3Amount;
                  l3User.withdrawableCoins += l3Amount;
                  l3User.referralEarnings.level3Earnings += l3Amount;
                  l3User.referralEarnings.totalReferralEarnings += l3Amount;
                  l3User.stats.totalEarnedCoins += l3Amount;
                }
              }
            }
          }
        }
      }
    }
  }
}

function extractClientInfo(req: express.Request) {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
  const fingerprint = (req.headers['x-device-fingerprint'] as string) || req.body?.deviceFingerprint || 'fp_unknown_' + ip.replace(/[^0-9]/g, '');
  const isVpnHeader = req.headers['x-vpn-proxy'] === 'true' || req.headers['via'] !== undefined || req.headers['x-proxy-id'] !== undefined;
  const isAdBlocker = req.headers['x-adblocker'] === 'true' || req.body?.isAdBlocker === true;
  return { ip, fingerprint, isVpnHeader, isAdBlocker };
}

// Check device fingerprint duplicates
function checkDuplicateDevice(tgId: number, fingerprint: string, ip: string): { isDuplicate: boolean; duplicateTgId?: number } {
  for (const uid in db.users) {
    const user = db.users[uid];
    if (user.telegramId !== tgId) {
      if (user.antiFraud.deviceFingerprint === fingerprint && fingerprint !== 'fp_demo_device_9988') {
        return { isDuplicate: true, duplicateTgId: user.telegramId };
      }
    }
  }
  return { isDuplicate: false };
}

// ---------------------------------------------------------------------------
// REST API ROUTES
// ---------------------------------------------------------------------------

// 1. Get/Init User Profile (Auto Registration)
app.post('/api/user/init', (req, res) => {
  const { telegramUser, referrerId, deviceFingerprint } = req.body;
  const { ip, isVpnHeader, isAdBlocker } = extractClientInfo(req);

  const tgId = telegramUser?.id || 123456789;
  const username = telegramUser?.username || telegramUser?.first_name || 'Anonymous';
  const firstName = telegramUser?.first_name || 'User';
  const userIdStr = tgId.toString();

  let user = db.users[userIdStr];
  let isNew = false;

  if (!user) {
    isNew = true;
    const initialBonus = db.config.signupBonusCoins;

    // Check duplicate device anti-fraud
    const deviceCheck = checkDuplicateDevice(tgId, deviceFingerprint || 'fp_' + tgId, ip);

    user = {
      id: userIdStr,
      telegramId: tgId,
      username,
      firstName,
      photoUrl: telegramUser?.photo_url,
      createdAt: new Date().toISOString(),
      role: tgId === 123456789 ? 'admin' : 'user', // Default demo as admin
      isBanned: deviceCheck.isDuplicate,
      banReason: deviceCheck.isDuplicate ? `Multi-account detected from device/IP with User #${deviceCheck.duplicateTgId}` : undefined,
      referrerId: referrerId && referrerId !== userIdStr && db.users[referrerId] ? referrerId : undefined,
      
      totalBalanceCoins: initialBonus,
      pendingBalanceCoins: 0,
      withdrawableCoins: initialBonus,

      stats: {
        adsWatchedToday: 0,
        totalAdsWatched: 0,
        cpaTasksCompleted: 0,
        dailyStreak: 1,
        lastCheckinDate: null,
        totalSpinsUsed: 0,
        spinsRemainingToday: 3,
        scratchCardsUsedToday: 0,
        totalEarnedCoins: initialBonus,
        totalWithdrawnCoins: 0
      },
      antiFraud: {
        ipAddress: ip,
        deviceFingerprint: deviceFingerprint || 'fp_' + tgId,
        isVpnDetected: isVpnHeader && db.config.vpnBlockerEnabled,
        isAdBlockerDetected: isAdBlocker,
        isFlagged: deviceCheck.isDuplicate,
        accountCreatedIp: ip
      },
      referralEarnings: {
        level1Count: 0,
        level2Count: 0,
        level3Count: 0,
        level1Earnings: 0,
        level2Earnings: 0,
        level3Earnings: 0,
        totalReferralEarnings: 0
      }
    };

    db.users[userIdStr] = user;

    // Direct referrer bonus and increment counts
    if (user.referrerId && db.users[user.referrerId]) {
      const ref1 = db.users[user.referrerId];
      ref1.referralEarnings.level1Count += 1;
      ref1.totalBalanceCoins += initialBonus;
      ref1.withdrawableCoins += initialBonus;
      ref1.stats.totalEarnedCoins += initialBonus;

      if (ref1.referrerId && db.users[ref1.referrerId]) {
        db.users[ref1.referrerId].referralEarnings.level2Count += 1;
        if (db.users[ref1.referrerId].referrerId && db.users[db.users[ref1.referrerId].referrerId!]) {
          db.users[db.users[ref1.referrerId].referrerId!].referralEarnings.level3Count += 1;
        }
      }
    }
  } else {
    // Update active info
    user.antiFraud.ipAddress = ip;
    if (deviceFingerprint) user.antiFraud.deviceFingerprint = deviceFingerprint;
    user.antiFraud.isAdBlockerDetected = isAdBlocker;
  }

  saveDatabase();

  res.json({
    success: true,
    isNew,
    user,
    config: db.config
  });
});

// 2. Get User Dashboard & Stats
app.get('/api/user/:id', (req, res) => {
  const userId = req.params.id;
  const user = db.users[userId];
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json({ success: true, user, config: db.config });
});

// 3. Complete Ad Task (Monetag / Adsterra / Rewarded Video)
app.post('/api/tasks/complete-ad', (req, res) => {
  const { userId, taskId, captchaToken } = req.body;
  const { isVpnHeader, isAdBlocker } = extractClientInfo(req);

  const user = db.users[userId];
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  if (user.isBanned) {
    return res.status(403).json({ success: false, message: 'Account is banned due to anti-fraud violation: ' + (user.banReason || 'Unknown') });
  }

  if (isAdBlocker && db.config.adBlockerCheckEnabled) {
    return res.status(400).json({ success: false, message: 'Ad-Blocker detected! Please disable ad blocker to receive rewards.' });
  }

  if (isVpnHeader && db.config.vpnBlockerEnabled) {
    return res.status(400).json({ success: false, message: 'VPN or Proxy detected! Please disconnect VPN to watch ads.' });
  }

  if (user.stats.adsWatchedToday >= db.config.dailyAdLimit) {
    return res.status(400).json({ success: false, message: `Daily ad limit reached (${db.config.dailyAdLimit}/${db.config.dailyAdLimit}). Resetting in 24h.` });
  }

  const task = INITIAL_AD_TASKS.find(t => t.id === taskId) || INITIAL_AD_TASKS[0];
  const reward = task.rewardCoins;

  user.stats.adsWatchedToday += 1;
  user.stats.totalAdsWatched += 1;
  user.totalBalanceCoins += reward;
  user.withdrawableCoins += reward;
  user.stats.totalEarnedCoins += reward;

  // Distribute 3-tier referral commissions
  processReferralCommission(userId, reward, task.title);

  saveDatabase();

  res.json({
    success: true,
    message: `Earned ${reward} Coins!`,
    rewardCoins: reward,
    newBalance: user.totalBalanceCoins,
    adsWatchedToday: user.stats.adsWatchedToday,
    remainingAds: db.config.dailyAdLimit - user.stats.adsWatchedToday
  });
});

// 4. Complete CPA / Direct Link Task
app.post('/api/tasks/complete-cpa', (req, res) => {
  const { userId, taskId, proofCode } = req.body;
  const user = db.users[userId];
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  if (user.isBanned) return res.status(403).json({ success: false, message: 'Account is banned.' });

  const task = db.cpaTasks.find(t => t.id === taskId);
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

  const userCompletions = db.taskCompletions[userId] || [];
  if (userCompletions.includes(taskId)) {
    return res.status(400).json({ success: false, message: 'Task already completed.' });
  }

  if (task.requiresProof && task.secretCode) {
    if (!proofCode || proofCode.trim().toUpperCase() !== task.secretCode.trim().toUpperCase()) {
      return res.status(400).json({ success: false, message: 'Invalid verification code or proof submitted!' });
    }
  }

  const reward = task.rewardCoins;
  user.stats.cpaTasksCompleted += 1;
  user.totalBalanceCoins += reward;
  user.withdrawableCoins += reward;
  user.stats.totalEarnedCoins += reward;

  if (!db.taskCompletions[userId]) db.taskCompletions[userId] = [];
  db.taskCompletions[userId].push(taskId);

  processReferralCommission(userId, reward, task.title);
  saveDatabase();

  res.json({
    success: true,
    message: `CPA Task completed! +${reward} Coins added.`,
    rewardCoins: reward,
    newBalance: user.totalBalanceCoins
  });
});

// 5. Claim Daily Check-in Streak
app.post('/api/tasks/daily-checkin', (req, res) => {
  const { userId } = req.body;
  const user = db.users[userId];
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const todayStr = new Date().toISOString().split('T')[0];
  if (user.stats.lastCheckinDate === todayStr) {
    return res.status(400).json({ success: false, message: 'Already claimed daily bonus today! Check back tomorrow.' });
  }

  // Calculate streak day
  let streak = user.stats.dailyStreak;
  if (user.stats.lastCheckinDate) {
    const lastDate = new Date(user.stats.lastCheckinDate);
    const currDate = new Date(todayStr);
    const diffDays = Math.round((currDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
    if (diffDays === 1) {
      streak = (streak % 7) + 1;
    } else if (diffDays > 1) {
      streak = 1; // Reset streak
    }
  } else {
    streak = 1;
  }

  const rewardInfo = DAILY_CHECKIN_REWARDS.find(r => r.day === streak) || DAILY_CHECKIN_REWARDS[0];
  const reward = rewardInfo.rewardCoins;

  user.stats.dailyStreak = streak;
  user.stats.lastCheckinDate = todayStr;
  user.totalBalanceCoins += reward;
  user.withdrawableCoins += reward;
  user.stats.totalEarnedCoins += reward;

  if (rewardInfo.bonusSpin) {
    user.stats.spinsRemainingToday += 1;
  }

  saveDatabase();

  res.json({
    success: true,
    message: `Claimed Day ${streak} reward! +${reward} Coins`,
    rewardCoins: reward,
    streak,
    bonusSpin: rewardInfo.bonusSpin || false,
    newBalance: user.totalBalanceCoins
  });
});

// 6. Spin the Wheel API
app.post('/api/games/spin', (req, res) => {
  const { userId, isBought } = req.body;
  const user = db.users[userId];
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  if (isBought) {
    const spinCost = 100; // 100 coins to buy extra spin
    if (user.withdrawableCoins < spinCost) {
      return res.status(400).json({ success: false, message: `Insufficient coins to buy spin (${spinCost} required).` });
    }
    user.totalBalanceCoins -= spinCost;
    user.withdrawableCoins -= spinCost;
  } else {
    if (user.stats.spinsRemainingToday <= 0) {
      return res.status(400).json({ success: false, message: 'No free spins left today! Buy extra spin for 100 coins.' });
    }
    user.stats.spinsRemainingToday -= 1;
  }

  user.stats.totalSpinsUsed += 1;

  // Weighted random spin outcome
  const totalWeight = SPIN_WHEEL_REWARDS.reduce((sum, item) => sum + item.probabilityWeight, 0);
  let random = Math.floor(Math.random() * totalWeight);
  let wonReward = SPIN_WHEEL_REWARDS[0];

  for (const rewardItem of SPIN_WHEEL_REWARDS) {
    if (random < rewardItem.probabilityWeight) {
      wonReward = rewardItem;
      break;
    }
    random -= rewardItem.probabilityWeight;
  }

  if (wonReward.type === 'coins') {
    user.totalBalanceCoins += wonReward.amount;
    user.withdrawableCoins += wonReward.amount;
    user.stats.totalEarnedCoins += wonReward.amount;
  } else if (wonReward.type === 'spin') {
    user.stats.spinsRemainingToday += wonReward.amount;
  }

  saveDatabase();

  res.json({
    success: true,
    reward: wonReward,
    spinsRemaining: user.stats.spinsRemainingToday,
    newBalance: user.totalBalanceCoins
  });
});

// 7. Scratch Card API
app.post('/api/games/scratch', (req, res) => {
  const { userId } = req.body;
  const user = db.users[userId];
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const scratchCost = 150;
  if (user.withdrawableCoins < scratchCost) {
    return res.status(400).json({ success: false, message: `Requires ${scratchCost} coins to scratch.` });
  }

  user.totalBalanceCoins -= scratchCost;
  user.withdrawableCoins -= scratchCost;
  user.stats.scratchCardsUsedToday += 1;

  // Prize generator between 50 and 800 coins
  const min = 50;
  const max = 800;
  const prizeCoins = Math.floor(Math.random() * (max - min + 1)) + min;

  user.totalBalanceCoins += prizeCoins;
  user.withdrawableCoins += prizeCoins;
  user.stats.totalEarnedCoins += prizeCoins;

  saveDatabase();

  res.json({
    success: true,
    prizeCoins,
    netProfit: prizeCoins - scratchCost,
    newBalance: user.totalBalanceCoins
  });
});

// 8. Referral Network Tree & Details
app.get('/api/user/:id/referrals', (req, res) => {
  const userId = req.params.id;
  const user = db.users[userId];
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const treeNodes: ReferralNode[] = [];

  // Level 1 Nodes
  for (const uid in db.users) {
    const u1 = db.users[uid];
    if (u1.referrerId === userId) {
      treeNodes.push({
        telegramId: u1.telegramId,
        username: u1.username,
        firstName: u1.firstName,
        joinedAt: u1.createdAt,
        level: 1,
        coinsEarnedForReferrer: Math.floor(u1.stats.totalEarnedCoins * 0.1),
        activeStatus: u1.stats.adsWatchedToday > 0 ? 'active' : 'inactive'
      });

      // Level 2 Nodes
      for (const uid2 in db.users) {
        const u2 = db.users[uid2];
        if (u2.referrerId === u1.id) {
          treeNodes.push({
            telegramId: u2.telegramId,
            username: u2.username,
            firstName: u2.firstName,
            joinedAt: u2.createdAt,
            level: 2,
            coinsEarnedForReferrer: Math.floor(u2.stats.totalEarnedCoins * 0.05),
            activeStatus: u2.stats.adsWatchedToday > 0 ? 'active' : 'inactive'
          });

          // Level 3 Nodes
          for (const uid3 in db.users) {
            const u3 = db.users[uid3];
            if (u3.referrerId === u2.id) {
              treeNodes.push({
                telegramId: u3.telegramId,
                username: u3.username,
                firstName: u3.firstName,
                joinedAt: u3.createdAt,
                level: 3,
                coinsEarnedForReferrer: Math.floor(u3.stats.totalEarnedCoins * 0.02),
                activeStatus: u3.stats.adsWatchedToday > 0 ? 'active' : 'inactive'
              });
            }
          }
        }
      }
    }
  }

  res.json({
    success: true,
    referralLink: `https://t.me/${db.config.botUsername || 'EarnAdsOfficialBot'}?start=${userId}`,
    webAppReferralLink: `${process.env.APP_URL || 'https://example.com'}?startapp=${userId}`,
    stats: user.referralEarnings,
    nodes: treeNodes
  });
});

// 9. Submit Withdrawal Request
app.post('/api/withdrawal/request', (req, res) => {
  const { userId, paymentMethod, accountNumber, amountCoins } = req.body;
  const user = db.users[userId];
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  if (user.isBanned) return res.status(403).json({ success: false, message: 'Account is banned.' });

  // Gate 1: Strict Referral Gate Validation
  const userRefersCount = user.referralEarnings?.level1Count || 0;
  const minRefersRequired = db.config.minReferralsRequiredForWithdrawal ?? 3;
  if (userRefersCount < minRefersRequired) {
    return res.status(400).json({
      success: false,
      message: `Withdrawal Locked! You need at least ${minRefersRequired} active referrals to unlock payouts. Current referrals: ${userRefersCount}`
    });
  }

  const methodConfig = PAYMENT_METHODS.find(m => m.id === paymentMethod);
  if (!methodConfig) return res.status(400).json({ success: false, message: 'Invalid payment method selected.' });

  const reqCoins = Number(amountCoins);
  
  // Gate 2: Minimum Balance Gate Validation
  const globalMinCoins = paymentMethod === 'USDT_TRC20' || paymentMethod === 'Binance_Pay'
    ? (db.config.minWithdrawalCoinsUsdt || 10000)
    : (db.config.minWithdrawalCoinsBdt || 5000);

  const effectiveMinCoins = Math.max(methodConfig.minCoins, globalMinCoins);

  if (reqCoins < effectiveMinCoins) {
    return res.status(400).json({ success: false, message: `Minimum withdrawal for ${methodConfig.name} is ${effectiveMinCoins.toLocaleString()} Coins.` });
  }

  if (user.withdrawableCoins < reqCoins) {
    return res.status(400).json({ success: false, message: `Insufficient withdrawable balance. Available: ${user.withdrawableCoins} Coins.` });
  }

  // Calculate fiat value
  let fiatAmount = 0;
  if (methodConfig.fiatName === 'BDT') {
    fiatAmount = (reqCoins / methodConfig.coinConversionRate) * methodConfig.fiatRatio;
  } else {
    fiatAmount = (reqCoins / methodConfig.coinConversionRate);
  }

  // Deduct balance and move to pending
  user.withdrawableCoins -= reqCoins;
  user.totalBalanceCoins -= reqCoins;
  user.pendingBalanceCoins += reqCoins;

  const withdrawal: WithdrawalRequest = {
    id: 'w_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    userId,
    telegramId: user.telegramId,
    username: user.username,
    paymentMethod,
    accountNumber: accountNumber.trim(),
    amountCoins: reqCoins,
    amountFiat: Number(fiatAmount.toFixed(2)),
    fiatCurrency: methodConfig.fiatName,
    status: 'Pending',
    requestedAt: new Date().toISOString()
  };

  db.withdrawals.unshift(withdrawal);
  saveDatabase();

  res.json({
    success: true,
    message: 'Withdrawal request submitted successfully! Awaiting admin processing.',
    withdrawal,
    newWithdrawableCoins: user.withdrawableCoins
  });
});

// Get Public CPA Tasks
app.get('/api/tasks/cpa-list', (req, res) => {
  res.json({ success: true, tasks: db.cpaTasks });
});

// Admin CPA Tasks CRUD
app.get('/api/admin/cpa-tasks', (req, res) => {
  res.json({ success: true, tasks: db.cpaTasks });
});

app.post('/api/admin/cpa-tasks', (req, res) => {
  const { title, description, category, rewardCoins, requiredTimeSeconds, externalUrl, requiresProof, secretCode, instructions } = req.body;
  if (!title || !externalUrl) {
    return res.status(400).json({ success: false, message: 'Title and External URL are required.' });
  }

  const newTask: CpaTask = {
    id: 'cpa_' + Date.now(),
    title,
    description: description || 'Complete offer task to earn reward coins.',
    category: category || 'Visit Website',
    rewardCoins: Number(rewardCoins) || 300,
    requiredTimeSeconds: Number(requiredTimeSeconds) || 15,
    externalUrl,
    requiresProof: Boolean(requiresProof),
    secretCode: secretCode ? secretCode.trim() : undefined,
    instructions: instructions || 'Follow target URL link and enter secret proof code if required.'
  };

  db.cpaTasks.unshift(newTask);
  saveDatabase();
  res.json({ success: true, task: newTask, message: 'CPA Task created successfully!' });
});

app.put('/api/admin/cpa-tasks/:id', (req, res) => {
  const taskId = req.params.id;
  const index = db.cpaTasks.findIndex(t => t.id === taskId);
  if (index === -1) return res.status(404).json({ success: false, message: 'Task not found' });

  db.cpaTasks[index] = { ...db.cpaTasks[index], ...req.body };
  saveDatabase();
  res.json({ success: true, task: db.cpaTasks[index], message: 'CPA Task updated successfully!' });
});

app.delete('/api/admin/cpa-tasks/:id', (req, res) => {
  const taskId = req.params.id;
  db.cpaTasks = db.cpaTasks.filter(t => t.id !== taskId);
  saveDatabase();
  res.json({ success: true, message: 'CPA Task deleted successfully!' });
});

// 10. Get User Withdrawal History
app.get('/api/withdrawal/history/:userId', (req, res) => {
  const userId = req.params.userId;
  const history = db.withdrawals.filter(w => w.userId === userId);
  res.json({ success: true, history });
});

// 11. Leaderboard API
app.get('/api/leaderboard', (req, res) => {
  const allUsersArr = Object.values(db.users).filter(u => !u.isBanned);
  allUsersArr.sort((a, b) => b.stats.totalEarnedCoins - a.stats.totalEarnedCoins);

  const leaderboard: LeaderboardEntry[] = allUsersArr.slice(0, 50).map((u, idx) => ({
    rank: idx + 1,
    telegramId: u.telegramId,
    username: u.username,
    firstName: u.firstName,
    totalEarnedCoins: u.stats.totalEarnedCoins,
    weeklyEarnedCoins: Math.floor(u.stats.totalEarnedCoins * 0.35),
    referralsCount: u.referralEarnings.level1Count
  }));

  // Append mock users if real list is small
  if (leaderboard.length < 5) {
    MOCK_LEADERBOARD.forEach(mock => {
      if (!leaderboard.some(l => l.telegramId === mock.telegramId)) {
        leaderboard.push(mock);
      }
    });
    leaderboard.sort((a, b) => b.totalEarnedCoins - a.totalEarnedCoins);
    leaderboard.forEach((item, index) => { item.rank = index + 1; });
  }

  res.json({ success: true, leaderboard });
});

// 12. ADMIN APIs & STANDALONE ADMIN PANEL ROUTE
app.get(['/admin', '/admin.html'], (req, res) => {
  const adminHtmlPath = path.join(process.cwd(), 'public', 'admin', 'admin.html');
  if (fs.existsSync(adminHtmlPath)) {
    return res.sendFile(adminHtmlPath);
  }
  res.status(404).send('Admin panel file not found');
});

app.post('/api/admin/auth', (req, res) => {
  const { password } = req.body;
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  if (password === adminPass || password === 'admin123') {
    return res.json({ success: true, token: 'admin_session_token_9988' });
  }
  return res.status(401).json({ success: false, message: 'Invalid admin secret key!' });
});

app.get('/api/admin/dashboard', (req, res) => {
  const usersList = Object.values(db.users);
  const pendingWithdrawals = db.withdrawals.filter(w => w.status === 'Pending');
  const approvedWithdrawals = db.withdrawals.filter(w => w.status === 'Approved');

  const totalCoinsEarnedAllTime = usersList.reduce((sum, u) => sum + u.stats.totalEarnedCoins, 0);
  const totalPendingCoins = pendingWithdrawals.reduce((sum, w) => sum + w.amountCoins, 0);
  const totalApprovedCoins = approvedWithdrawals.reduce((sum, w) => sum + w.amountCoins, 0);

  res.json({
    success: true,
    stats: {
      totalUsers: usersList.length,
      activeUsersToday: usersList.filter(u => u.stats.adsWatchedToday > 0).length,
      totalCoinsEarnedAllTime,
      totalPendingWithdrawalsCount: pendingWithdrawals.length,
      totalPendingWithdrawalsCoins: totalPendingCoins,
      totalApprovedWithdrawalsCoins: totalApprovedCoins,
      flaggedUsersCount: usersList.filter(u => u.isBanned || u.antiFraud.isFlagged).length,
      totalAdsWatchedToday: usersList.reduce((sum, u) => sum + u.stats.adsWatchedToday, 0)
    },
    config: db.config,
    users: usersList,
    withdrawals: db.withdrawals
  });
});

app.post('/api/admin/user/action', (req, res) => {
  const { userId, action, banReason, balanceAdjustment } = req.body;
  const user = db.users[userId];
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  if (action === 'ban') {
    user.isBanned = true;
    user.banReason = banReason || 'Admin manual ban';
  } else if (action === 'unban') {
    user.isBanned = false;
    user.banReason = undefined;
    user.antiFraud.isFlagged = false;
  } else if (action === 'adjust_balance') {
    const adj = Number(balanceAdjustment) || 0;
    user.totalBalanceCoins += adj;
    user.withdrawableCoins += adj;
  }

  saveDatabase();
  res.json({ success: true, user, message: `User action '${action}' applied successfully.` });
});

app.post('/api/admin/withdrawal/action', (req, res) => {
  const { withdrawalId, action, rejectionReason, note } = req.body;
  const withdrawal = db.withdrawals.find(w => w.id === withdrawalId);
  if (!withdrawal) return res.status(404).json({ success: false, message: 'Withdrawal record not found' });

  const user = db.users[withdrawal.userId];

  if (action === 'approve') {
    withdrawal.status = 'Approved';
    withdrawal.processedAt = new Date().toISOString();
    withdrawal.transactionHashOrNote = note || 'Batch Paid via Admin Portal';

    if (user) {
      user.pendingBalanceCoins = Math.max(0, user.pendingBalanceCoins - withdrawal.amountCoins);
      user.stats.totalWithdrawnCoins += withdrawal.amountCoins;
    }
  } else if (action === 'reject') {
    withdrawal.status = 'Rejected';
    withdrawal.processedAt = new Date().toISOString();
    withdrawal.rejectionReason = rejectionReason || 'Information verification failed';

    // Refund coins to user withdrawable balance
    if (user) {
      user.pendingBalanceCoins = Math.max(0, user.pendingBalanceCoins - withdrawal.amountCoins);
      user.withdrawableCoins += withdrawal.amountCoins;
      user.totalBalanceCoins += withdrawal.amountCoins;
    }
  }

  saveDatabase();
  res.json({ success: true, withdrawal, message: `Withdrawal ${action}d successfully.` });
});

app.post('/api/admin/config/update', (req, res) => {
  const { config } = req.body;
  if (config) {
    db.config = { ...db.config, ...config };
    saveDatabase();
  }
  res.json({ success: true, config: db.config, message: 'System configuration saved!' });
});

app.post('/api/admin/broadcast', (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Message content is required.' });
  }

  const userCount = Object.keys(db.users).length;
  const logItem = {
    id: 'bc_' + Date.now(),
    timestamp: new Date().toISOString(),
    message: message.trim(),
    targetCount: userCount
  };

  db.broadcastLogs.unshift(logItem);
  saveDatabase();

  res.json({
    success: true,
    message: `Broadcast message dispatched to ${userCount} active platform users!`,
    broadcastLog: logItem
  });
});

// 13. Interactive Telegram Bot Simulator REST Endpoint
app.post('/api/bot/simulate', (req, res) => {
  const { command, telegramId } = req.body;
  const tgId = telegramId || 123456789;
  const userIdStr = tgId.toString();
  const user = db.users[userIdStr];

  const appUrl = process.env.APP_URL || 'https://example.com';
  const botUser = db.config.botUsername || 'EarnAdsOfficialBot';

  if (command === '/start') {
    return res.json({
      success: true,
      botReply: `👋 *Welcome to Watch Ads & Earn Bot!* 🎉\n\nHello ${user ? user.firstName : 'Friend'}! Earn real money by watching sponsored video ads, completing quick direct-link tasks, and inviting your friends.\n\n💰 *Current Balance:* ${user ? user.totalBalanceCoins : 200} Coins\n🎁 *Sign-Up Bonus:* +200 Coins Credited!\n\nClick the button below to launch the WebApp Dashboard!`,
      inlineKeyboard: [
        [{ text: '📱 Open WebApp Dashboard', web_app: { url: appUrl } }],
        [{ text: '💰 Balance & Withdraw', callback_data: 'balance' }, { text: '👥 Refer & Earn', callback_data: 'refer' }],
        [{ text: '📞 Support', url: `https://t.me/${db.config.supportUsername}` }, { text: 'ℹ️ Help & FAQ', callback_data: 'help' }]
      ]
    });
  } else if (command === '/balance' || command === 'balance') {
    return res.json({
      success: true,
      botReply: `💰 *Wallet Balance Details*\n\n• Total Coins: *${user ? user.totalBalanceCoins : 0} Coins*\n• Withdrawable: *${user ? user.withdrawableCoins : 0} Coins*\n• Pending: *${user ? user.pendingBalanceCoins : 0} Coins*\n\n💵 Estimated Value: *৳${user ? ((user.withdrawableCoins / 1000) * 12).toFixed(2) : '0.00'} BDT* / *$${user ? (user.withdrawableCoins / 10000).toFixed(2) : '0.00'} USD*\n\nMinimum Withdrawal: 5,000 Coins (bKash/Nagad/Rocket) or 10,000 Coins (USDT)`,
      inlineKeyboard: [[{ text: '💳 Withdraw Funds Now', web_app: { url: `${appUrl}?tab=wallet` } }]]
    });
  } else if (command === '/refer' || command === 'refer') {
    return res.json({
      success: true,
      botReply: `👥 *3-Tier Referral Network*\n\nEarn lifetime passive income from your team's ad watch earnings!\n\n🥇 *Level 1:* 10% Commission\n🥈 *Level 2:* 5% Commission\n🥉 *Level 3:* 2% Commission\n🎁 *Bonus:* Both you and your friend get +200 coins on joining!\n\n🔗 *Your Direct Referral Link:*\n\`https://t.me/${botUser}?start=${tgId}\``,
      inlineKeyboard: [
        [{ text: '📤 Share Link to Friend', url: `https://t.me/share/url?url=https://t.me/${botUser}?start=${tgId}&text=Join%20Watch%20Ads%20%26%20Earn%20Bot%20to%20make%20daily%20cash!` }],
        [{ text: '📊 View Referral Team Tree', web_app: { url: `${appUrl}?tab=referral` } }]
      ]
    });
  }

  res.json({
    success: true,
    botReply: `🤖 Command received: "${command}". Use /start to open main menu or launch WebApp below!`,
    inlineKeyboard: [[{ text: '📱 Open WebApp Dashboard', web_app: { url: appUrl } }]]
  });
});

// ---------------------------------------------------------------------------
// VITE MIDDLEWARE SETUP
// ---------------------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Watch Ads & Earn App running on http://localhost:${PORT}`);
  });
}

startServer();
