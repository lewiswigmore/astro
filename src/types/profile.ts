export interface PilotProfile {
  // Core Identity
  callsign: string;
  prefix: string;
  rank: string;
  
  // Resources
  fuel: number;
  stardust: number;
  fuelBreakReadyAt?: string;
  fuelLastRegenAt?: string;
  
  // Progression
  level: number;
  experiencePoints: number;
  
  // Activity Tracking
  queriesExecuted: number;
  completedMissions: string[];
  completedSubMissions: string[];
  bookmarks: string[];
  dailyStreak: number;
  longestStreak: number;
  lastLoginDate: string;
  activityDates: string[];
  totalMinutesActive: number;
  
  // Achievements & Customization
  badges: string[];
  achievements: Achievement[];
  unlockedThemes: string[];
  selectedTheme: string;
  
  // Personal Bests
  personalBests: PersonalBests;
  
  // Metadata
  joined: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  category: 'query' | 'mission' | 'streak' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface PersonalBests {
  longestStreak?: number;
  mostStardustInDay?: number;
  fastestMissionTime?: number;
  mostQueriesInSession?: number;
  highestComplexityQuery?: number;
}

export const RANK_TITLES = [
  { level: 1, title: 'Cadet' },
  { level: 5, title: 'Navigator' },
  { level: 10, title: 'Explorer' },
  { level: 15, title: 'Pathfinder' },
  { level: 20, title: 'Commander' },
  { level: 30, title: 'Ace Pilot' },
  { level: 50, title: 'Fleet Captain' },
  { level: 75, title: 'Admiral' },
  { level: 100, title: 'Legendary' },
];

export const MILESTONE_REWARDS = [
  { stardust: 100, badge: 'rising-star', reward: 'Rising Star Badge + Theme Slot #2' },
  { stardust: 500, badge: 'cosmic-navigator', reward: 'Cosmic Navigator Badge + Profile Border' },
  { stardust: 1000, badge: 'query-master', reward: 'Query Master Badge + Title Unlock' },
  { stardust: 2500, badge: 'stellar-analyst', reward: 'Stellar Analyst Badge + Exclusive Theme' },
  { stardust: 5000, badge: 'legend-of-nebula', reward: 'Legend of the Nebula Badge + All Themes' },
  { stardust: 10000, badge: 'astro-elite', reward: 'Astro Elite Badge + Golden Profile Effect' },
];
