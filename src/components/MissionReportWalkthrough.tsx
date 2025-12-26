import { useEffect, useMemo, useState } from 'react';
import GuidedTour, { type TourStep } from './GuidedTour';

type MissionReportWalkthroughProps = {
  isOpen: boolean;
  missionSlug: string;
  awardedStardust: number;
  fuelUsedPercent: number;
};

const KEY = 'astro:tutorial:mission-00:report_intro_done';

const MissionReportWalkthrough = ({ isOpen, missionSlug, awardedStardust, fuelUsedPercent }: MissionReportWalkthroughProps) => {
  const [open, setOpen] = useState(false);

  const steps = useMemo<TourStep[]>(() => {
    const rewardLine =
      awardedStardust > 0
        ? `Reward: +${awardedStardust} ★ Stardust.`
        : 'Reward: this shows Stardust earned for this report (bigger rewards happen on full mission completion).';

    const fuelLine =
      fuelUsedPercent > 0
        ? `Fuel Refilled: +${fuelUsedPercent}% (mission bonus).`
        : 'Fuel Refilled: completing sub-missions rewards you with fuel to keep your simulations running.';

    return [
      {
        id: 'reward',
        selector: '[data-tour="mission-report-reward"]',
        title: 'Reward Summary',
        body: `${rewardLine}\n\nStardust is your progression currency — it powers rank/level growth.`,
        completeWhenStorageKey: 'astro:tutorial:mission-00:report_reward_done',
        markCompleteOnNext: true,
      },
      {
        id: 'fuel',
        selector: '[data-tour="mission-report-fuel"]',
        title: 'Fuel Summary',
        body: `${fuelLine}\n\nFuel powers your Holodeck simulations. Completing sub-missions keeps your tanks full so you can carry on without waiting.`,
        completeWhenStorageKey: 'astro:tutorial:mission-00:report_fuel_done',
        markCompleteOnNext: true,
      },
      {
        id: 'next',
        selector: '[data-tour="mission-report-next"]',
        title: 'Continue the Mission',
        body: 'Use NEXT to proceed to the next sub-mission. Your sidebar progress will sync automatically.',
        completeWhenStorageKey: 'astro:tutorial:mission-00:report_next_done',
        markCompleteOnNext: true,
      },
    ];
  }, [awardedStardust, fuelUsedPercent]);

  useEffect(() => {
    if (!isOpen) {
      setOpen(false);
      return;
    }

    if (!String(missionSlug).startsWith('mission-00/')) {
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

    // Only show after the first completed mission-00 sub-mission.
    try {
      const storedProfile = localStorage.getItem('astro_pilot_profile');
      if (!storedProfile) {
        setOpen(false);
        return;
      }

      const profile = JSON.parse(storedProfile);
      const completed = Array.isArray(profile.completedSubMissions) ? profile.completedSubMissions : [];
      const count = completed.filter((s: string) => String(s).startsWith('mission-00/')).length;
      if (count < 1) {
        setOpen(false);
        return;
      }
    } catch {
      setOpen(false);
      return;
    }

    setOpen(true);
  }, [isOpen, missionSlug]);

  const complete = () => {
    try {
      localStorage.setItem(KEY, 'true');
    } catch {
      // ignore
    }
  };

  return <GuidedTour isOpen={open} steps={steps} onClose={() => setOpen(false)} onComplete={complete} />;
};

export default MissionReportWalkthrough;
