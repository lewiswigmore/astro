import { useEffect, useState } from 'react';
import Icon from './Icon';

interface KnowledgeSyncCardProps {
  missionId: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  totalSectors: number;
  baseUrl?: string;
}

const KnowledgeSyncCard = ({ 
  missionId, 
  title, 
  subtitle,
  description, 
  icon, 
  color, 
  totalSectors, 
  baseUrl = '/' 
}: KnowledgeSyncCardProps) => {
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadProgress = () => {
      const storedProfile = localStorage.getItem('astro_pilot_profile');
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        const completedSubMissions = profile.completedSubMissions || [];
        
        // Use a Set to ensure we only count unique sub-missions for THIS mission
        const uniqueCompleted = new Set(
          completedSubMissions.filter((s: string) => s.startsWith(`${missionId}/`))
        );
        
        const missionCompletedCount = uniqueCompleted.size;
        const percentage = Math.min(Math.round((missionCompletedCount / totalSectors) * 100), 100);
        setProgress(percentage);
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
  }, [missionId, totalSectors]);

  if (!isLoaded) return <div className="h-48 bg-space-900 border border-space-700 rounded-xl animate-pulse" />;

  const isComplete = progress === 100;
  const isStarted = progress > 0;

  return (
    <a href={`${baseUrl}${missionId}/introduction`} className={`group block bg-space-900 border border-space-700 rounded-xl p-6 hover:bg-space-800 transition-all hover:border-${color}/50`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 bg-${color}/10 rounded-lg text-${color} group-hover:text-white transition-colors`}>
          <Icon name={icon as any} className="w-6 h-6" />
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-widest ${
          isComplete 
          ? 'bg-green-500/10 border-green-500/50 text-green-400' 
          : isStarted
          ? `bg-${color}/10 border-${color}/50 text-${color}`
          : 'bg-space-800 border-space-700 text-slate-500'
        }`}>
          {isComplete ? 'SYNC COMPLETE' : isStarted ? 'SYNC IN PROGRESS' : subtitle}
        </span>
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 mb-4">{description}</p>
      <div className="w-full bg-space-800 h-1.5 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ease-out ${isComplete ? 'bg-green-500' : `bg-${color}`}`} 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className={`mt-2 text-[10px] font-mono ${isComplete ? 'text-green-400' : `text-${color}`}`}>
        {isComplete ? '★ ALL SECTORS SYNCHRONIZED ★' : `SYNC: ${progress}% COMPLETE`}
      </div>
    </a>
  );
};

export default KnowledgeSyncCard;
