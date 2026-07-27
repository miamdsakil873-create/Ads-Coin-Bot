import { 
  UserProfile, 
  SystemConfig, 
  WithdrawalRequest, 
  ReferralNode, 
  ReferralEarnings,
  LeaderboardEntry,
  AdminStats
} from '../types';

function getDeviceFingerprint(): string {
  let fp = localStorage.getItem('earnads_device_fp');
  if (!fp) {
    fp = 'fp_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    localStorage.setItem('earnads_device_fp', fp);
  }
  return fp;
}

function detectAdBlocker(): Promise<boolean> {
  return new Promise((resolve) => {
    const fakeAd = document.createElement('div');
    fakeAd.className = 'adsbygoogle ad-unit ad-zone banner-ad google-ad';
    fakeAd.style.position = 'absolute';
    fakeAd.style.top = '-9999px';
    fakeAd.style.left = '-9999px';
    fakeAd.style.width = '1px';
    fakeAd.style.height = '1px';
    document.body.appendChild(fakeAd);

    setTimeout(() => {
      const isBlocked = fakeAd.offsetHeight === 0 || fakeAd.clientHeight === 0 || window.getComputedStyle(fakeAd).display === 'none';
      fakeAd.remove();
      resolve(isBlocked);
    }, 100);
  });
}

export async function initUserProfile(
  telegramUser?: { id: number; first_name: string; username?: string; photo_url?: string },
  referrerId?: string
): Promise<{ user: UserProfile; config: SystemConfig; isNew: boolean }> {
  const fp = getDeviceFingerprint();
  const isAdBlocker = await detectAdBlocker();

  const res = await fetch('/api/user/init', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-device-fingerprint': fp,
      'x-adblocker': isAdBlocker ? 'true' : 'false'
    },
    body: JSON.stringify({
      telegramUser: telegramUser || {
        id: 123456789,
        first_name: 'Alex Earner',
        username: 'demo_earner'
      },
      referrerId,
      deviceFingerprint: fp,
      isAdBlocker
    })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to initialize user profile');
  }

  return { user: data.user, config: data.config, isNew: data.isNew };
}

export async function getUserProfile(userId: string): Promise<{ user: UserProfile; config: SystemConfig }> {
  const res = await fetch(`/api/user/${userId}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch profile');
  }
  return { user: data.user, config: data.config };
}

export async function completeAdTask(userId: string, taskId: string, captchaToken?: string) {
  const fp = getDeviceFingerprint();
  const isAdBlocker = await detectAdBlocker();

  const res = await fetch('/api/tasks/complete-ad', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-device-fingerprint': fp,
      'x-adblocker': isAdBlocker ? 'true' : 'false'
    },
    body: JSON.stringify({ userId, taskId, captchaToken, isAdBlocker })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to record ad watch reward');
  }
  return data;
}

export async function completeCpaTask(userId: string, taskId: string, proofCode?: string) {
  const res = await fetch('/api/tasks/complete-cpa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, taskId, proofCode })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to complete CPA task');
  }
  return data;
}

export async function claimDailyCheckin(userId: string) {
  const res = await fetch('/api/tasks/daily-checkin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to claim daily bonus');
  }
  return data;
}

export async function spinWheel(userId: string, isBought: boolean = false) {
  const res = await fetch('/api/games/spin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, isBought })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Spin failed');
  }
  return data;
}

export async function playScratchCard(userId: string) {
  const res = await fetch('/api/games/scratch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Scratch card failed');
  }
  return data;
}

export async function getReferrals(userId: string): Promise<{
  referralLink: string;
  webAppReferralLink: string;
  stats: ReferralEarnings;
  nodes: ReferralNode[];
}> {
  const res = await fetch(`/api/user/${userId}/referrals`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch referral network data');
  }
  return data;
}

export async function submitWithdrawal(
  userId: string, 
  paymentMethod: string, 
  accountNumber: string, 
  amountCoins: number
) {
  const res = await fetch('/api/withdrawal/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, paymentMethod, accountNumber, amountCoins })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Withdrawal submission failed');
  }
  return data;
}

export async function getWithdrawalHistory(userId: string): Promise<WithdrawalRequest[]> {
  const res = await fetch(`/api/withdrawal/history/${userId}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch withdrawal history');
  }
  return data.history;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const res = await fetch('/api/leaderboard');
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch leaderboard');
  }
  return data.leaderboard;
}

// ADMIN APIS
export async function adminLogin(password: string) {
  const res = await fetch('/api/admin/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Admin authentication failed');
  }
  return data;
}

export async function getAdminDashboard(): Promise<{
  stats: AdminStats;
  config: SystemConfig;
  users: UserProfile[];
  withdrawals: WithdrawalRequest[];
}> {
  const res = await fetch('/api/admin/dashboard');
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to load admin dashboard');
  }
  return data;
}

export async function adminUserAction(userId: string, action: 'ban' | 'unban' | 'adjust_balance', banReason?: string, balanceAdjustment?: number) {
  const res = await fetch('/api/admin/user/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, action, banReason, balanceAdjustment })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Admin user action failed');
  }
  return data;
}

export async function adminWithdrawalAction(withdrawalId: string, action: 'approve' | 'reject', rejectionReason?: string, note?: string) {
  const res = await fetch('/api/admin/withdrawal/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ withdrawalId, action, rejectionReason, note })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Admin withdrawal action failed');
  }
  return data;
}

export async function adminUpdateConfig(config: Partial<SystemConfig>) {
  const res = await fetch('/api/admin/config/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Config update failed');
  }
  return data;
}

export async function adminBroadcast(message: string) {
  const res = await fetch('/api/admin/broadcast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Broadcast failed');
  }
  return data;
}

export async function simulateBotCommand(command: string, telegramId?: number) {
  const res = await fetch('/api/bot/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command, telegramId })
  });
  const data = await res.json();
  return data;
}
