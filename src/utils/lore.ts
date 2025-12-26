import type { Achievement } from '../types/profile';

export type LoreEntry = {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  story: string;
};

const titleize = (value: string) =>
  value
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (l) => l.toUpperCase());

const BADGE_LORE: Record<string, LoreEntry> = {
  'identity-verified': {
    id: 'identity-verified',
    title: 'Identity Verified',
    subtitle: 'Academy Registry // Greenlight',
    icon: '🪪',
    story:
      'The Academy’s scanners don’t just read a name — they read intent.\n\nWhen your callsign locked into the Manifest, the hull lights pulsed once: recognition, not approval. The ship doesn’t care who you were planetside. It only cares that you showed up.\n\nIn the archives, your record now carries a quiet stamp: VERIFIED. A small thing. A dangerous thing. A doorway that only opens for pilots who commit.',
  },
  'first-steps': {
    id: 'first-steps',
    title: 'First Steps',
    subtitle: 'Hangar Deck // Initial Ignition',
    icon: '👣',
    story:
      'Everyone remembers the first time the deck plates hum.\n\nYou didn’t solve the Nebula. You didn’t conquer the void. You simply took the first clean step into unfamiliar gravity — and the ship noticed.\n\nAstro logs the moment as a minor event. But pilots know better: the first step is how every legend gets started.',
  },
  'first-contact': {
    id: 'first-contact',
    title: 'First Contact',
    subtitle: 'KQL Nebula // Signal Handshake',
    icon: '📡',
    story:
      'The Nebula answers in patterns, not words.\n\nYour first query was a ping into a cloud of ancient telemetry — and something pinged back. A shape. A structure. Proof that the chaos can be navigated.\n\nMission Control recorded it as CONTACT ESTABLISHED. The rest of us call it the moment you stopped looking at data… and started listening to it.',
  },
  'rising-star': {
    id: 'rising-star',
    title: 'Rising Star',
    subtitle: 'Stardust Milestone // 100',
    icon: '⭐',
    story:
      'A hundred stardust isn’t wealth — it’s velocity.\n\nYou earned it the hard way: small optimizations, cleaner joins, queries that stop wasting oxygen.\n\nSomewhere above the hangar, a new light appears on the board. Not bright yet. But unmistakable. A star on the rise.',
  },
  'cosmic-navigator': {
    id: 'cosmic-navigator',
    title: 'Cosmic Navigator',
    subtitle: 'Stardust Milestone // 500',
    icon: '🧭',
    story:
      'The difference between drifting and navigating is knowing what to ignore.\n\nAt five hundred stardust, you’ve learned to read the sky of telemetry — to choose the constellation that matters and let the noise burn away behind you.\n\nYour course is no longer luck. It’s a plan.',
  },
  'query-master': {
    id: 'query-master',
    title: 'Query Master',
    subtitle: 'Stardust Milestone // 1000',
    icon: '🧠',
    story:
      'A thousand stardust is where technique becomes instinct.\n\nYou stop writing queries and start shaping outcomes: bending time windows, folding aggregations, stitching signals into a story that holds under pressure.\n\nThe Nebula doesn’t get simpler. You just get sharper.',
  },
  'stellar-analyst': {
    id: 'stellar-analyst',
    title: 'Stellar Analyst',
    subtitle: 'Stardust Milestone // 2500',
    icon: '🔭',
    story:
      'Most pilots glance at the stars. You measure them.\n\nAt this altitude, you don’t chase results — you predict them. You can feel anomalies before they appear, like the ship is whispering warnings through the instrumentation.\n\nAnalysis becomes astronomy: patient, exact, and just a little haunted.',
  },
  'legend-of-nebula': {
    id: 'legend-of-nebula',
    title: 'Legend of the Nebula',
    subtitle: 'Stardust Milestone // 5000',
    icon: '🌌',
    story:
      'Five thousand stardust isn’t a number. It’s a rumor.\n\nThey say the Nebula changes for pilots like you — that it stops resisting and starts revealing.\n\nWhether that’s true or not, the logs show a simple fact: you’ve stayed in the storm long enough to learn its weather.',
  },
  'astro-elite': {
    id: 'astro-elite',
    title: 'Astro Elite',
    subtitle: 'Stardust Milestone // 10000',
    icon: '🏅',
    story:
      'Ten thousand stardust is the point where Mission Control stops giving advice.\n\nNot because they don’t care — because they know you’re already charting routes they haven’t mapped yet.\n\nElite isn’t a badge. It’s a responsibility. The kind that makes the ship feel… heavier.',
  },
};

const ACHIEVEMENT_LORE: Record<string, Pick<LoreEntry, 'title' | 'subtitle' | 'icon' | 'story'>> = {
  'orientation-complete': {
    title: 'Orientation Complete',
    subtitle: 'Academy Corridor // Doors Unlocked',
    icon: '🚀',
    story:
      'Orientation is where the Academy tells you the rules.\n\nCompletion is where you prove you can follow them — and when to break them.\n\nThe corridor lights shift from warning amber to mission green. Somewhere, a terminal updates your status from GUEST to PILOT.',
  },
  'neural-link-established': {
    title: 'Neural Link Established',
    subtitle: 'Archive Sync // Memory Bound',
    icon: '🧠',
    story:
      'The Neural Link isn’t comfortable. It’s never meant to be.\n\nWhen the sync completes, you feel the archives settle into place behind your eyes: schemas, operators, patterns you can’t yet name.\n\nFrom now on, every mission leaves a trace — and every trace can become a weapon.',
  },
  'first-contact': {
    title: 'First Contact',
    subtitle: 'Deep Space // Signal Received',
    icon: '📡',
    story:
      'First Contact is not the first time you send a signal.\n\nIt’s the first time you realize something is listening.\n\nThe KQL Nebula shifts as your query threads through it. For a moment, the void feels… curious.',
  },
};

export const getBadgeLore = (badgeId: string): LoreEntry => {
  const found = BADGE_LORE[badgeId];
  if (found) return found;

  return {
    id: badgeId,
    title: titleize(badgeId),
    subtitle: 'Patch Archive // Uncatalogued',
    icon: '🏷️',
    story:
      'Some patches arrive without paperwork.\n\nThe fabric still holds heat from the last mission, the stitching still smells faintly of ozone. Nobody in the hangar can tell you exactly who issued it — only that you earned it.\n\nAstro files it under: UNCATEGORIZED. The crew files it under: PROOF.',
  };
};

export const getAchievementLore = (achievement: Achievement): LoreEntry => {
  const found = ACHIEVEMENT_LORE[achievement.id];

  return {
    id: achievement.id,
    title: found?.title ?? achievement.name,
    subtitle: found?.subtitle ?? `Achievement // ${titleize(achievement.category)} • ${titleize(achievement.rarity)}`,
    icon: found?.icon ?? achievement.icon ?? '🏆',
    story:
      found?.story ??
      `${achievement.description}\n\nThe ship logs it as a clean event — just another entry in a long list of milestones.\n\nBut pilots know every achievement is a breadcrumb trail through the dark: a reminder that you were here, and you learned something the void can’t take back.`,
  };
};

export const getBadgeIcon = (badgeId: string): string => {
  const found = BADGE_LORE[badgeId];
  if (found?.icon) return found.icon;

  // Light heuristic fallback
  if (badgeId.includes('star')) return '⭐';
  if (badgeId.includes('navigator')) return '🧭';
  if (badgeId.includes('query')) return '🧠';
  if (badgeId.includes('stellar')) return '🔭';
  if (badgeId.includes('nebula')) return '🌌';

  return '📜';
};
