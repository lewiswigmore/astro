import type { PilotProfile } from '../types/profile';
import { RANK_TITLES } from '../types/profile';

function toDateKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function calculateLevel(stardust: number): number {
  return Math.floor(Math.sqrt(stardust / 25));
}

export function getStardustForLevel(level: number): number {
  return level * level * 25;
}

export function getRankTitle(level: number): string {
  for (let i = RANK_TITLES.length - 1; i >= 0; i--) {
    if (level >= RANK_TITLES[i].level) {
      return RANK_TITLES[i].title;
    }
  }
  return 'Cadet';
}

export function getNextLevelProgress(stardust: number): { current: number; next: number; percentage: number } {
  const currentLevel = calculateLevel(stardust);
  const currentLevelStardust = getStardustForLevel(currentLevel);
  const nextLevelStardust = getStardustForLevel(currentLevel + 1);
  const progress = stardust - currentLevelStardust;
  const required = nextLevelStardust - currentLevelStardust;
  const percentage = (progress / required) * 100;
  
  return {
    current: currentLevel,
    next: currentLevel + 1,
    percentage: Math.min(percentage, 100)
  };
}

export function calculateDailyStreak(lastLoginDate: string, currentDate: Date = new Date()): { streak: number; isNewDay: boolean } {
  const lastLogin = new Date(lastLoginDate);
  const daysSince = Math.floor((currentDate.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSince === 0) {
    // Same day - maintain streak
    return { streak: 0, isNewDay: false };
  } else if (daysSince === 1) {
    // Next day - increment streak
    return { streak: 1, isNewDay: true };
  } else {
    // Missed days - reset streak
    return { streak: 0, isNewDay: true };
  }
}

export function getStreakMultiplier(streak: number): number {
  if (streak >= 30) return 2.0;
  if (streak >= 14) return 1.5;
  if (streak >= 7) return 1.25;
  if (streak >= 3) return 1.1;
  return 1.0;
}

export function getStreakReward(streak: number): number {
  if (streak === 30) return 250;
  if (streak === 14) return 100;
  if (streak === 7) return 50;
  if (streak === 3) return 25;
  return 10;
}

export function migrateProfile(oldProfile: any): PilotProfile {
  const stardust = oldProfile.stardust || 0;
  const level = calculateLevel(stardust);
  const todayKey = toDateKey();
  
  return {
    // Existing fields
    callsign: oldProfile.callsign || oldProfile.name || 'PILOT',
    prefix: oldProfile.prefix || 'PILOT',
    rank: getRankTitle(level),
    fuel: typeof oldProfile.fuel === 'number' ? oldProfile.fuel : 85,
    fuelLastRegenAt: oldProfile.fuelLastRegenAt || new Date().toISOString(),
    stardust: stardust,
    completedMissions: oldProfile.completedMissions || [],
    completedSubMissions: Array.isArray(oldProfile.completedSubMissions)
      ? oldProfile.completedSubMissions
      : [],
    bookmarks: Array.isArray(oldProfile.bookmarks)
      ? oldProfile.bookmarks
      : [],
    badges: oldProfile.badges || [],
    joined: oldProfile.joined || new Date().toISOString(),
    
    // New fields
    level: level,
    experiencePoints: stardust,
    queriesExecuted: 0,
    dailyStreak: 1,
    longestStreak: 1,
    lastLoginDate: new Date().toISOString(),
    activityDates: Array.isArray(oldProfile.activityDates)
      ? oldProfile.activityDates
      : (oldProfile.lastLoginDate ? [String(oldProfile.lastLoginDate).slice(0, 10)] : [todayKey]),
    totalMinutesActive: 0,
    achievements: [],
    unlockedThemes: ['default'],
    selectedTheme: 'default',
    personalBests: {}
  };
}

export function checkAndUpdateDailyLogin(profile: PilotProfile): { profile: PilotProfile; reward: number; isNewStreak: boolean } {
  // Ensure activity log exists for older profiles
  if (!Array.isArray(profile.activityDates)) {
    (profile as any).activityDates = [];
  }

  const todayKey = toDateKey();
  if (!profile.activityDates.includes(todayKey)) {
    profile.activityDates = [...profile.activityDates, todayKey];
  }

  const streakData = calculateDailyStreak(profile.lastLoginDate);
  let reward = 0;
  let isNewStreak = false;
  
  if (streakData.isNewDay) {
    if (streakData.streak > 0) {
      // Continued streak
      profile.dailyStreak += streakData.streak;
      if (profile.dailyStreak > profile.longestStreak) {
        profile.longestStreak = profile.dailyStreak;
      }
      reward = getStreakReward(profile.dailyStreak);
      isNewStreak = true;
    } else {
      // Reset streak
      profile.dailyStreak = 1;
      reward = 10;
      isNewStreak = true;
    }
    
    profile.lastLoginDate = new Date().toISOString();
    profile.stardust += reward;
    profile.experiencePoints = profile.stardust;
    profile.level = calculateLevel(profile.stardust);
    profile.rank = getRankTitle(profile.level);

    // Daily refuel: Fuel represents daily ship compute budget.
    // Keep it simple and predictable: every new day refills to full.
    profile.fuel = 100;
  }
  
  return { profile, reward, isNewStreak };
}

const FUEL_BREAK_GAIN = 25;
const FUEL_BREAK_MAX = 100;
const PASSIVE_REGEN_RATE = 1; // 1% per minute
const PASSIVE_REGEN_INTERVAL_MS = 60 * 1000; // 1 minute

export function applyPassiveFuelRegen(profile: any, now: Date = new Date()): { profile: any; changed: boolean } {
  const currentFuel = typeof profile.fuel === 'number' ? profile.fuel : 0;
  if (currentFuel >= FUEL_BREAK_MAX) {
    // Already at max, just update timestamp
    const updated = { ...profile, fuelLastRegenAt: now.toISOString() };
    return { profile: updated, changed: false };
  }

  const lastRegenRaw = profile?.fuelLastRegenAt;
  if (!lastRegenRaw) {
    // First time - initialize timestamp
    const updated = { ...profile, fuelLastRegenAt: now.toISOString() };
    return { profile: updated, changed: true };
  }

  const lastRegenMs = new Date(String(lastRegenRaw)).getTime();
  if (!Number.isFinite(lastRegenMs)) {
    // Corrupt value: reset timestamp
    const updated = { ...profile, fuelLastRegenAt: now.toISOString() };
    return { profile: updated, changed: true };
  }

  const elapsedMs = now.getTime() - lastRegenMs;
  if (elapsedMs < PASSIVE_REGEN_INTERVAL_MS) {
    // Not enough time has passed
    return { profile, changed: false };
  }

  // Calculate how many minutes have passed
  const minutesPassed = Math.floor(elapsedMs / PASSIVE_REGEN_INTERVAL_MS);
  const fuelToAdd = minutesPassed * PASSIVE_REGEN_RATE;
  const newFuel = Math.min(FUEL_BREAK_MAX, currentFuel + fuelToAdd);

  // Update timestamp to now (not by exact minutes to avoid drift)
  const updated = {
    ...profile,
    fuel: newFuel,
    fuelLastRegenAt: now.toISOString()
  };

  return { profile: updated, changed: newFuel !== currentFuel };
}

export function applyFuelBreakRefill(profile: any, now: Date = new Date()): { profile: any; changed: boolean } {
  // First apply passive regeneration
  const regenResult = applyPassiveFuelRegen(profile, now);
  profile = regenResult.profile;
  let changed = regenResult.changed;

  const readyAtRaw = profile?.fuelBreakReadyAt;
  if (!readyAtRaw) return { profile, changed };

  const readyAtMs = new Date(String(readyAtRaw)).getTime();
  if (!Number.isFinite(readyAtMs)) {
    // Corrupt value: clear it.
    const cleared = { ...profile };
    delete cleared.fuelBreakReadyAt;
    return { profile: cleared, changed: true };
  }

  if (readyAtMs > now.getTime()) return { profile, changed };

  const currentFuel = typeof profile.fuel === 'number' ? profile.fuel : 0;
  const updatedFuel = Math.min(FUEL_BREAK_MAX, currentFuel + FUEL_BREAK_GAIN);

  const updated = { ...profile, fuel: updatedFuel };
  delete updated.fuelBreakReadyAt;
  // Changed because we clear the pending refill marker and/or added fuel.
  return { profile: updated, changed: true };
}
