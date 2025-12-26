import { useEffect, useState } from 'react';

interface MissionProgressBadgeProps {
  missionId: string; // e.g. 'mission-00'
  totalSectors: number;
}

const MissionProgressBadge = ({ missionId, totalSectors }: MissionProgressBadgeProps) => {
  const [completedCount, setCompletedCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadProgress = () => {
      const storedProfile = localStorage.getItem('astro_pilot_profile');
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        const completedSubMissions = profile.completedSubMissions || [];
        
        // Use a Set to ensure we only count unique sub-missions for this mission
        const uniqueCompleted = new Set(
          completedSubMissions
            .filter((slug: string) => slug.startsWith(`${missionId}/`))
        );
        
        const count = Math.min(uniqueCompleted.size, totalSectors);
        setCompletedCount(count);
      }
      setIsLoaded(true);
    };

    loadProgress();
    window.addEventListener('storage', loadProgress);
    window.addEventListener('astro:profile-update' as any, loadProgress);
    return () => {
      window.removeEventListener('storage', loadProgress);
      window.removeEventListener('astro:profile-update' as any, loadProgress);
    };
  }, [missionId]);

  if (!isLoaded) return <div className="h-4 w-16 bg-space-800 rounded animate-pulse" />;

  const isComplete = completedCount >= totalSectors && totalSectors > 0;

  return (
    <div className="flex flex-col items-end">
        <div className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-widest mb-1 ${
            isComplete 
            ? 'bg-green-500/10 border-green-500/50 text-green-400' 
            : completedCount > 0
            ? 'bg-thrust-500/10 border-thrust-500/50 text-thrust-400'
            : 'bg-space-800 border-space-700 text-slate-500'
        }`}>
          {isComplete ? 'COMPLETE' : completedCount > 0 ? 'IN PROGRESS' : 'NOT STARTED'}
        </div>
        <div className="text-[9px] font-mono text-slate-500 uppercase tracking-tighter">
            {completedCount} / {totalSectors} SECTORS
        </div>
    </div>
  );
};

export default MissionProgressBadge;
