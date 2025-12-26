import { useEffect, useState } from 'react';
import StardustCounter from './StardustCounter';

interface SidebarProfileProps {
  totalSectors?: number;
}

const SidebarProfile = ({ totalSectors = 20 }: SidebarProfileProps) => {
  const [name, setName] = useState('Pilot');
  const [prefix, setPrefix] = useState('Pilot');
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadProfile = () => {
      const storedProfile = localStorage.getItem('astro_pilot_profile');
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        setName(profile.callsign);
        setPrefix(profile.prefix || 'Pilot');
        
        // Calculate real progress (only for mission sectors)
        const completedSubMissions = profile.completedSubMissions || [];
        
        // Use a Set to ensure we only count unique sub-missions
        const uniqueCompleted = new Set(
          completedSubMissions.filter((s: string) => 
            s.startsWith('mission-00/') || 
            s.startsWith('mission-01/') || 
            s.startsWith('mission-02/') || 
            s.startsWith('mission-03/')
          )
        );
        
        const missionCompletedCount = uniqueCompleted.size;
        const percentage = Math.min(Math.round((missionCompletedCount / totalSectors) * 100), 100);
        setProgress(percentage);
      }
      setIsLoaded(true);
    };

    loadProfile();
    window.addEventListener('storage', loadProfile);
    window.addEventListener('astro:profile-update' as any, loadProfile);
    return () => {
      window.removeEventListener('storage', loadProfile);
      window.removeEventListener('astro:profile-update' as any, loadProfile);
    };
  }, [totalSectors]);

  if (!isLoaded) {
    return (
      <div className="mb-8 pb-6 border-b border-space-700">
        <div className="w-32 h-4 bg-space-800 rounded animate-pulse mb-2"></div>
        <div className="w-48 h-5 bg-space-800 rounded animate-pulse mb-4"></div>
        <div className="w-full h-20 bg-space-800 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="mb-8 pb-6 border-b border-space-700">
      <div className="text-xs font-mono text-slate-500 mb-2">NEURAL LINK: ACTIVE</div>
      <div className="text-sm text-slate-300 mb-4">
        Welcome to the Archives, {prefix} <span className="text-thrust-400 font-bold">{name}</span>.
      </div>
      
      <StardustCounter className="mb-4" showLabel={false} iconSize="w-3 h-3" />
      
      <div className="space-y-2" data-tour="knowledge-sync">
        <div className="flex justify-between text-xs font-mono">
            <span className="text-nebula-400">KNOWLEDGE SYNC</span>
            <span className="text-white">{progress}%</span>
        </div>
        <div className="w-full bg-space-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ease-out ${progress === 100 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-nebula-500'}`}
              style={{ width: `${progress}%` }}
            ></div>
        </div>
        <div className="text-[10px] text-slate-500 font-mono text-right">
            {progress === 100 ? (
              <span className="text-green-400 animate-pulse">★ ALL SECTORS SYNCHRONIZED ★</span>
            ) : progress > 90 ? (
              <span className="text-stardust">ALMOST THERE...</span>
            ) : (
              'DOWNLOADING TO LOCAL MEMORY...'
            )}
        </div>
      </div>
    </div>
  );
};

export default SidebarProfile;
