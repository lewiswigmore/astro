import { useEffect, useMemo, useState } from 'react';
import GuidedTour, { type TourStep } from './GuidedTour';

const KEY = 'astro:tutorial:observatory:intro_complete';
const KEY_FIRST_SEEN = 'astro:tutorial:observatory:first_seen';

const ObservatoryWalkthrough = () => {
  const [open, setOpen] = useState(false);

  const steps = useMemo<TourStep[]>(() => {
    return [
      {
        id: 'stardust',
        selector: '[data-tour="stardust-counter"]',
        title: 'Stardust (XP)',
        body:
          'Stardust is your progression currency. You earn it by completing missions, running simulations, and logging discoveries.\n\nMore Stardust = higher rank and more unlocks.',
      },
      {
        id: 'patches',
        selector: '[data-tour="observatory-patches"]',
        title: 'Badges & Patches',
        body:
          'These are your earned patches. Click one to read its lore and track your accomplishments.',
      },
      {        id: 'achievements',
        selector: '[data-tour="observatory-achievements"]',
        title: 'Recent Achievements',
        body:
          'Your most recent achievements appear here. Achievements are milestones you earn by completing missions, running simulations, and discovering new things.\n\nClick any achievement to see its story and what you earned it for.',
      },
      {        id: 'skill',
        selector: '[data-tour="observatory-skill"]',
        title: 'Skill Constellation',
        body:
          'This is your skill constellation tree — a visual map of what you’ve learned and what’s next.',
      },
      {
        id: 'log',
        selector: '[data-tour="observatory-log"]',
        title: 'Research Log (Archives)',
        body:
          'Your Research Log holds bookmarked pages. Use it as your personal “field notes” while you learn.',
      },
    ];
  }, []);

  useEffect(() => {
    const hasOnboarded = (() => {
      try {
        return localStorage.getItem('astro_kql_onboarded') === 'true';
      } catch {
        return false;
      }
    })();

    // Don't trigger observatory guidance while the user is still registering/onboarding.
    if (!hasOnboarded) {
      setOpen(false);
      return;
    }

    const alreadyDone = (() => {
      try {
        return localStorage.getItem(KEY) === 'true';
      } catch {
        return false;
      }
    })();

    if (alreadyDone) {
      setOpen(false);
      return;
    }

    const firstSeen = (() => {
      try {
        const seen = localStorage.getItem(KEY_FIRST_SEEN) === 'true';
        if (!seen) localStorage.setItem(KEY_FIRST_SEEN, 'true');
        return !seen;
      } catch {
        return false;
      }
    })();

    // Only show if the page has the target elements.
    const hasTargets =
      document.querySelector('[data-tour="observatory-patches"]') &&
      document.querySelector('[data-tour="observatory-skill"]') &&
      document.querySelector('[data-tour="observatory-log"]');

    // Open on first visit OR after completing mission-00.
    setOpen(Boolean(hasTargets) && firstSeen);
  }, []);

  const complete = () => {
    try {
      localStorage.setItem(KEY, 'true');
    } catch {
      // ignore
    }
  };

  return <GuidedTour isOpen={open} steps={steps} onClose={() => setOpen(false)} onComplete={complete} />;
};

export default ObservatoryWalkthrough;
