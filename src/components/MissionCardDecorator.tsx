import { useEffect } from 'react';

interface MissionCardDecoratorProps {
  targetId: string;
  missionId: string;
  totalSectors: number;
}

function isMissionComplete(profile: any, missionId: string, totalSectors: number): boolean {
  const completed: string[] = Array.isArray(profile?.completedSubMissions) ? profile.completedSubMissions : [];
  const count = completed.filter((slug) => typeof slug === 'string' && slug.startsWith(`${missionId}/`)).length;
  return count >= totalSectors;
}

const MissionCardDecorator = ({ targetId, missionId, totalSectors }: MissionCardDecoratorProps) => {
  useEffect(() => {
    const apply = () => {
      const el = document.getElementById(targetId);
      if (!el) return;

      try {
        const stored = localStorage.getItem('astro_pilot_profile');
        const profile = stored ? JSON.parse(stored) : null;
        const complete = profile ? isMissionComplete(profile, missionId, totalSectors) : false;

        el.setAttribute('data-mission-complete', complete ? 'true' : 'false');
      } catch {
        // If storage is blocked / corrupted, fail closed.
        el.setAttribute('data-mission-complete', 'false');
      }
    };

    apply();

    const onStorage = () => apply();
    const onProfileUpdate = () => apply();

    window.addEventListener('storage', onStorage);
    window.addEventListener('astro:profile-update' as any, onProfileUpdate);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('astro:profile-update' as any, onProfileUpdate);
    };
  }, [targetId, missionId, totalSectors]);

  return null;
};

export default MissionCardDecorator;
