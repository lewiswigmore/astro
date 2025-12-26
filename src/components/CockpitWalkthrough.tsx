import { useEffect, useMemo, useState } from 'react';
import GuidedTour, { type TourStep } from './GuidedTour';

const KEY_COMPLETE = 'astro:tutorial:cockpit:intro_complete';
const KEY_PENDING = 'astro:tutorial:cockpit:intro_pending';
const KEY_FIRST_SEEN = 'astro:tutorial:cockpit:first_seen';

const CockpitWalkthrough = () => {
  const [open, setOpen] = useState(false);
  const [isMission00Complete, setIsMission00Complete] = useState(false);

  const steps = useMemo<TourStep[]>(() => {
    return [
      {
        id: 'where-you-are',
        selector: '[data-tour="nav-cockpit"]',
        title: 'You are in the Cockpit',
        body:
          'This is your command center dashboard. It shows your status, progression, and what to do next.',
      },
      {
        id: 'where-to-go',
        selector: '[data-tour="nav-observatory"]',
        title: 'Where you can go',
        body:
          'The Observatory is your study bay: Research Log (bookmarks), skill constellation, and earned patches.',
      },
      {
        id: 'settings',
        selector: '[data-tour="settings-button"]',
        title: 'Settings',
        body:
          'Open Settings to refuel, adjust your profile, and access data tools like resets when you need a clean slate.',
      },
      {
        id: 'search',
        selector: '[data-tour="search-button"]',
        title: 'Global Search',
        body:
          'Need to find a specific topic or mission? Use the search tool (or press Ctrl+K) to scan the entire Academy database.',
      },
      {
        id: 'rank-level',
        selector: '[data-tour="cockpit-rank"]',
        title: 'Rank & Level',
        body:
          'Rank is your title, Level is your progression tier. Both are driven by Stardust you earn from missions and simulations.',
      },
      {
        id: 'level-progress',
        selector: '[data-tour="cockpit-level"]',
        title: 'Level Progress',
        body: 'This bar shows how close you are to the next level.',
      },
      {
        id: 'recent-achievements',
        selector: '[data-tour="cockpit-achievements"]',
        title: 'Recent Achievements',
        body:
          'Your latest wins show up here. Click an item to read its lore and see what you earned it for.',
      },
      {
        id: 'daily-streak',
        selector: '[data-tour="daily-streak"]',
        title: 'Daily Streak',
        body:
          'Log in and do at least a little each day. Streaks help you build momentum and can boost rewards.',
      },
      {
        id: 'activity',
        selector: '[data-tour="activity-grid"]',
        title: 'Activity Counter',
        body:
          'This grid tracks your recent active days. More filled squares = more consistency.',
      },
      {
        id: 'mission-control',
        selector: '[data-tour="mission-control"]',
        title: 'Mission Control',
        body:
          'Pick a mission to start training. Mission 00 is the recommended first launch.',
      },
      {
        id: 'mission-00-card',
        selector: '[data-tour="mission-card-mission-00"]',
        title: isMission00Complete ? 'Continue Your Training' : 'Start Mission 00',
        body: isMission00Complete
          ? 'You have already completed the orientation. Select another mission to continue your training.'
          : 'Click here to begin the Orientation mission. It will guide you through Bookmark → Run Simulation → Uplink.',
      },
    ];
  }, [isMission00Complete]);

  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem('astro_pilot_profile');
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        if (
          profile.completedMissions &&
          profile.completedMissions.includes('mission-00')
        ) {
          setIsMission00Complete(true);
        }
      }
    } catch {
      // ignore
    }

    const hasOnboarded = (() => {
      try {
        return localStorage.getItem('astro_kql_onboarded') === 'true';
      } catch {
        return false;
      }
    })();

    // Don't trigger hangar/cockpit guidance while the user is still registering/onboarding
    // (including right after a reset when onboarding reappears).
    if (!hasOnboarded) {
      setOpen(false);
      return;
    }

    const alreadyDone = (() => {
      try {
        return localStorage.getItem(KEY_COMPLETE) === 'true';
      } catch {
        return false;
      }
    })();

    if (alreadyDone) {
      setOpen(false);
      return;
    }

    const pending = (() => {
      try {
        return localStorage.getItem(KEY_PENDING) === 'true';
      } catch {
        return false;
      }
    })();

    const firstSeen = (() => {
      try {
        const seen = localStorage.getItem(KEY_FIRST_SEEN) === 'true';
        if (!seen) localStorage.setItem(KEY_FIRST_SEEN, 'true');
        return !seen;
      } catch {
        // If storage is blocked, fall back to old behavior (pending only)
        return false;
      }
    })();

    // Only show if we have at least one target on the page.
    const hasAnyTarget =
      document.querySelector('[data-tour="nav-cockpit"]') ||
      document.querySelector('[data-tour="cockpit-rank"]') ||
      document.querySelector('[data-tour="mission-control"]');

    // Open when:
    // - Onboarding explicitly asked for cockpit tour (pending), OR
    // - This is the first time the user has ever viewed the hangar.
    setOpen(Boolean(hasAnyTarget) && (pending || firstSeen));
  }, []);

  const markComplete = () => {
    try {
      localStorage.setItem(KEY_COMPLETE, 'true');
      localStorage.removeItem(KEY_PENDING);
    } catch {
      // ignore
    }
  };

  const handleClose = () => {
    setOpen(false);
    markComplete();
  };

  return <GuidedTour isOpen={open} steps={steps} onClose={handleClose} onComplete={markComplete} />;
};

export default CockpitWalkthrough;
