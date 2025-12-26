import React, { useMemo, useState } from 'react';
import type { PilotProfile } from '../types/profile';
import { migrateProfile } from '../utils/profileUtils';

interface StardustPickupCardProps {
  pickupId: string;
  amount?: number;
  title?: string;
  description?: string;
}

const StardustPickupCard = ({
  pickupId,
  amount = 10,
  title = 'Stardust Pickup',
  description = 'Collect a small reward for completing this briefing.',
}: StardustPickupCardProps) => {
  const [isCollecting, setIsCollecting] = useState(false);
  const [justCollected, setJustCollected] = useState(false);
  const [alreadyCollected, setAlreadyCollected] = useState(false);

  React.useEffect(() => {
    const checkStatus = () => {
      const stored = localStorage.getItem('astro_pilot_profile');
      if (stored) {
        const profile = JSON.parse(stored);
        const existing = Array.isArray(profile.achievements) ? profile.achievements : [];
        if (existing.some((a: any) => a?.id === pickupId)) {
          setAlreadyCollected(true);
        }
      }
    };

    checkStatus();
    window.addEventListener('storage', checkStatus);
    return () => window.removeEventListener('storage', checkStatus);
  }, [pickupId]);

  const particles = useMemo(
    () => Array.from({ length: 26 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 0.8}s`,
      duration: `${1 + Math.random() * 1.8}s`,
      opacity: Math.random(),
    })),
    []
  );

  const collect = () => {
    if (isCollecting || alreadyCollected) return;

    setIsCollecting(true);

    const stored = localStorage.getItem('astro_pilot_profile');
    let profile: any = stored ? JSON.parse(stored) : null;

    if (!profile) {
      profile = migrateProfile({ callsign: 'GUEST', prefix: 'PILOT', stardust: 0, fuel: 100 });
    } else if (!profile.level || !profile.experiencePoints) {
      profile = migrateProfile(profile);
    }

    const existing = Array.isArray(profile.achievements) ? profile.achievements : [];
    const hasPickup = existing.some((a: any) => a?.id === pickupId);

    if (hasPickup) {
      setAlreadyCollected(true);
      setIsCollecting(false);
      return;
    }

    profile.stardust = (profile.stardust || 0) + amount;
    profile.experiencePoints = profile.stardust;

    const todayKey = new Date().toISOString().slice(0, 10);
    profile.activityDates = Array.isArray(profile.activityDates) ? profile.activityDates : [];
    if (!profile.activityDates.includes(todayKey)) profile.activityDates.push(todayKey);

    profile.achievements = [
      ...existing,
      {
        id: pickupId,
        name: 'Briefing Pickup',
        description: `Collected +${amount} stardust from Mission 00.`,
        icon: 'stardust',
        earnedAt: new Date().toISOString(),
        category: 'special',
        rarity: 'common',
      },
    ];

    localStorage.setItem('astro_pilot_profile', JSON.stringify(profile as PilotProfile));
    window.dispatchEvent(new Event('storage'));

    setJustCollected(true);
    setTimeout(() => setJustCollected(false), 3500);
    setTimeout(() => {
      setAlreadyCollected(true);
      setIsCollecting(false);
    }, 500);
  };

  return (
    <div className={`my-6 border border-space-700 rounded-xl overflow-hidden bg-space-900 shadow-xl shadow-nebula-500/10 relative ${justCollected ? 'animate-shake' : ''} ${!alreadyCollected ? 'bg-thrust-500/5' : ''}`}>
      {justCollected && (
        <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-thrust-500/20 animate-pulse" />
          <div className="relative flex flex-col items-center animate-in zoom-in fade-in duration-300">
            <div className="w-16 h-16 mb-3 text-stardust animate-bounce drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div className="text-stardust font-black text-3xl tracking-[0.25em] text-glow animate-pop">+{amount} STARDUST</div>
            <div className="text-stardust/80 text-[10px] font-mono mt-2 uppercase tracking-[0.5em]">Pickup Secured</div>
          </div>
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute w-1 h-1 bg-stardust rounded-full animate-ping"
              style={{ top: p.top, left: p.left, animationDelay: p.delay, animationDuration: p.duration, opacity: p.opacity }}
            />
          ))}
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">Bonus</div>
            <div className="text-white font-bold text-lg mt-1">{title}</div>
            <p className="text-slate-400 mt-2 text-sm leading-relaxed">{description}</p>
          </div>

          <button
            onClick={collect}
            disabled={isCollecting || alreadyCollected}
            className={[
              'px-4 py-2 rounded-lg font-mono text-xs tracking-widest border transition-colors whitespace-nowrap',
              alreadyCollected
                ? 'bg-space-800 text-slate-500 border-space-700 cursor-not-allowed'
                : 'bg-stardust/10 text-stardust border-stardust/30 hover:bg-stardust/15',
            ].join(' ')}
          >
            {alreadyCollected ? 'COLLECTED' : isCollecting ? 'SECURING...' : 'COLLECT'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StardustPickupCard;
