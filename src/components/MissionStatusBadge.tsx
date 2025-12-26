import { useEffect, useState } from 'react';

interface MissionStatusBadgeProps {
  slug: string;
  type?: 'sidebar' | 'card';
}

const MissionStatusBadge = ({ slug, type = 'sidebar' }: MissionStatusBadgeProps) => {
  const [status, setStatus] = useState<'not-started' | 'completed'>('not-started');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadStatus = () => {
      const storedProfile = localStorage.getItem('astro_pilot_profile');
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        
        // Check completion
        const completedSubMissions = profile.completedSubMissions || [];
        setStatus(completedSubMissions.includes(slug) ? 'completed' : 'not-started');
        
        // Check bookmark
        const bookmarks = profile.bookmarks || [];
        setIsBookmarked(bookmarks.includes(slug));
      }
      setIsLoaded(true);
    };

    loadStatus();
    window.addEventListener('storage', loadStatus);
    window.addEventListener('astro:profile-update' as any, loadStatus);
    return () => {
      window.removeEventListener('storage', loadStatus);
      window.removeEventListener('astro:profile-update' as any, loadStatus);
    };
  }, [slug]);

  if (!isLoaded) return null;

  if (type === 'sidebar') {
    return (
      <div className="flex items-center space-x-1.5 flex-shrink-0">
        {isBookmarked && (
          <span className="text-[10px] text-stardust leading-none" title="Bookmarked">★</span>
        )}
        <div className={`w-1.5 h-1.5 rounded-full ${
          status === 'completed' ? 'bg-nebula-500 shadow-[0_0_5px_rgba(139,92,246,0.5)]' : 'bg-space-700'
        }`} />
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {isBookmarked && (
        <div className="bg-stardust/10 border border-stardust/30 text-stardust text-[10px] px-1.5 py-0.5 rounded font-mono">
          ★ SAVED
        </div>
      )}
      <div className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-widest ${
        status === 'completed' 
        ? 'bg-nebula-500/10 border-nebula-500/50 text-nebula-400' 
        : 'bg-space-800 border-space-700 text-slate-500'
      }`}>
        {status === 'completed' ? 'COMPLETED' : 'INCOMPLETE'}
      </div>
    </div>
  );
};

export default MissionStatusBadge;
