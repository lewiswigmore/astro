import { useEffect, useState } from 'react';
import Icon from './Icon';

interface GlobalKnowledgeSyncProps {
  totalSectors: number;
}

const GlobalKnowledgeSync = ({ totalSectors }: GlobalKnowledgeSyncProps) => {
  const [progress, setProgress] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const loadProgress = () => {
      const storedProfile = localStorage.getItem('astro_pilot_profile');
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        const completedSubMissions = profile.completedSubMissions || [];
        
        const uniqueCompleted = new Set(
          completedSubMissions.filter((s: string) => 
            s.startsWith('mission-00/') || 
            s.startsWith('mission-01/') || 
            s.startsWith('mission-02/') || 
            s.startsWith('mission-03/')
          )
        );
        
        const count = uniqueCompleted.size;
        const percentage = Math.min(Math.round((count / totalSectors) * 100), 100);
        setCompletedCount(count);
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
  }, [totalSectors]);

  // Animation effect for the percentage number and bar
  useEffect(() => {
    if (isLoaded && !isAnimating) {
      setIsAnimating(true);
      let start = 0;
      const duration = 1500; // 1.5 seconds
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progressRatio = Math.min(elapsed / duration, 1);
        
        // Easing function (easeOutQuart)
        const easeOutQuart = 1 - Math.pow(1 - progressRatio, 4);
        const currentProgress = Math.round(easeOutQuart * progress);
        
        setDisplayProgress(currentProgress);

        if (progressRatio < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [isLoaded, progress]);

  if (!isLoaded) return <div className="h-32 bg-space-900 border border-space-700 rounded-xl animate-pulse mb-8" />;

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center uppercase tracking-tight">
          <Icon name="kusto" className="w-5 h-5 mr-2 text-nebula-400" />
          Global Knowledge Sync
        </h2>
        <span className="text-xs font-mono text-slate-500 uppercase">Neural Link: {progress === 100 ? 'Synchronized' : 'Active'}</span>
      </div>

      <div className="bg-space-900 border border-space-700 rounded-xl p-6 relative overflow-hidden group shadow-2xl">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-nebula-500/5 blur-3xl rounded-full -mr-32 -mt-32 transition-colors group-hover:bg-nebula-500/10"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-white tracking-tight leading-none">{displayProgress}%</span>
              <span className="text-xs font-mono text-nebula-400 uppercase tracking-widest">Complete</span>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Data Integrity</div>
              <div className="text-xs font-bold text-white font-mono">{completedCount} / {totalSectors} SECTORS</div>
            </div>
          </div>

          <div className="w-full bg-space-800 h-3 rounded-full overflow-hidden border border-space-700">
            <div 
              className={`h-full transition-all duration-[1500ms] ease-out relative ${progress === 100 ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-gradient-to-r from-nebula-600 to-nebula-400'}`}
              style={{ width: `${isAnimating ? progress : 0}%` }}
            >
              {progress > 0 && progress < 100 && (
                <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalKnowledgeSync;
