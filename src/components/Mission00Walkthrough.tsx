import { useEffect, useMemo, useState } from 'react';
import GuidedTour, { type TourStep } from './GuidedTour';

type Mission00WalkthroughProps = {
  slug: string;
};

const KEY_PREFIX = 'astro:tutorial:mission-00';

const Mission00Walkthrough = ({ slug }: Mission00WalkthroughProps) => {
  const [open, setOpen] = useState(false);
  const [hasCompletedFirstSubMission, setHasCompletedFirstSubMission] = useState(false);

  useEffect(() => {
    if (!slug.startsWith('mission-00/')) {
      setHasCompletedFirstSubMission(false);
      return;
    }

    const load = () => {
      try {
        const storedProfile = localStorage.getItem('astro_pilot_profile');
        if (!storedProfile) {
          setHasCompletedFirstSubMission(false);
          return;
        }

        const profile = JSON.parse(storedProfile);
        const completed = Array.isArray(profile.completedSubMissions) ? profile.completedSubMissions : [];
        setHasCompletedFirstSubMission(completed.some((s: string) => s.startsWith('mission-00/')));
      } catch {
        setHasCompletedFirstSubMission(false);
      }
    };

    load();
    window.addEventListener('storage', load);
    window.addEventListener('astro:profile-update' as any, load);
    return () => {
      window.removeEventListener('storage', load);
      window.removeEventListener('astro:profile-update' as any, load);
    };
  }, [slug]);

  const steps = useMemo<TourStep[]>(() => {
    const baseSteps: TourStep[] = [
      {
        id: 'sidebar-submissions',
        selector: '[data-tour="mission-sidebar-submissions"]',
        title: 'Sidebar: Sub-missions',
        body:
          'This sidebar is your Mission Log. Each link is a sub-mission (a short lesson). As you move forward, your progress syncs automatically.',
        completeWhenStorageKey: `${KEY_PREFIX}:sidebar_submissions_done`,
        markCompleteOnNext: true,
      },
      {
        id: 'knowledge-sync',
        selector: '[data-tour="knowledge-sync"]',
        title: 'Knowledge Sync',
        body:
          'This is your overall progress meter. It increases as you complete sub-missions across the academy.',
        completeWhenStorageKey: `${KEY_PREFIX}:knowledge_sync_done`,
        markCompleteOnNext: true,
      },
      {
        id: 'bookmark-archives',
        selector: '[data-tour="bookmark-archives"]',
        title: 'Bookmark to Archives',
        body:
          'This saves the page into your Research Log (Archives) so you can come back later.\n\nAction: click “BOOKMARK TO ARCHIVES”.',
        completeWhenStorageKey: `${KEY_PREFIX}:bookmark_done`,
      },
      ...(hasCompletedFirstSubMission
        ? [
            {
              id: 'fuel',
              selector: '[data-tour="fuel-indicator"]',
              title: 'Fuel (Simulation Power)',
              body:
                'Fuel powers the Holodeck. Each RUN costs Fuel — when you\'re low, refuel in Settings or wait for passive regeneration (1% per minute).\n\nTip: keep an eye on this meter before simulations.',
              completeWhenStorageKey: `${KEY_PREFIX}:fuel_tip_done`,
              markCompleteOnNext: true,
            } satisfies TourStep,
          ]
        : []),
      {
        id: 'run-simulation',
        selector: '[data-tour="holodeck-run"]',
        title: 'Run a Simulation',
        body:
          'Practice queries safely in the Holodeck.\n\nAction: click RUN to execute the simulation.',
        completeWhenStorageKey: `${KEY_PREFIX}:sim_run_done`,
      },
      {
        id: 'uplink',
        selector: '[data-tour="holodeck-uplink"]',
        title: 'Uplink to Azure Data Explorer',
        body:
          'When you’re ready, open your query in Azure Data Explorer to explore real datasets.\n\nAction: click UPLINK.',
        completeWhenStorageKey: `${KEY_PREFIX}:uplink_done`,
      },
    ];

    return baseSteps;
  }, [hasCompletedFirstSubMission]);

  useEffect(() => {
    // Only run for mission-00 pages.
    if (!slug.startsWith('mission-00/')) {
      setOpen(false);
      return;
    }

    // Only show on first-time mission-00 experience.
    const alreadyCompleted = (() => {
      try {
        return localStorage.getItem(`${KEY_PREFIX}:tour_complete`) === 'true';
      } catch {
        return false;
      }
    })();

    if (alreadyCompleted) {
      setOpen(false);
      return;
    }

    // Start the guide on the first mission page (but allow it to continue on later pages).
    // We show it if at least one target exists on the page.
    const hasAnyTarget =
      document.querySelector('[data-tour="bookmark-archives"]') ||
      document.querySelector('[data-tour="holodeck-run"]') ||
      document.querySelector('[data-tour="holodeck-uplink"]');

    setOpen(Boolean(hasAnyTarget));
  }, [slug]);

  const handleComplete = () => {
    try {
      localStorage.setItem(`${KEY_PREFIX}:tour_complete`, 'true');
    } catch {
      // ignore
    }
  };

  return <GuidedTour isOpen={open} steps={steps} onClose={() => setOpen(false)} onComplete={handleComplete} />;
};

export default Mission00Walkthrough;
