import { useState, useEffect } from 'react';
import Icon from './Icon';

interface SaveToLogButtonProps {
  slug: string;
  reward?: number;
}

const SaveToLogButton = ({ slug, reward = 10 }: SaveToLogButtonProps) => {
  const [saved, setSaved] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const storedProfile = localStorage.getItem('astro_pilot_profile');
    if (storedProfile) {
      const profile = JSON.parse(storedProfile);
      const bookmarks = profile.bookmarks || [];
      if (bookmarks.includes(slug)) {
        setSaved(true);
      }
    }
    setIsLoaded(true);
  }, [slug]);

  const handleSave = () => {
    if (saved || isSyncing) return;

    setIsSyncing(true);

    // Simulate a brief sync delay for effect
    setTimeout(() => {
      const storedProfile = localStorage.getItem('astro_pilot_profile');
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        profile.bookmarks = profile.bookmarks || [];
        
        if (!profile.bookmarks.includes(slug)) {
          profile.bookmarks.push(slug);
          
          // Award stardust for bookmarking (optional, but keeping it as a small bonus)
          if (reward > 0) {
            profile.stardust = (profile.stardust || 0) + reward;
            profile.experiencePoints = profile.stardust;
          }

          localStorage.setItem('astro_pilot_profile', JSON.stringify(profile));
          
          // Dispatch both standard storage event (for other tabs) 
          // and a custom event for real-time same-window updates
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new CustomEvent('astro:profile-update', { detail: profile }));

          // Tutorial: mission-00 first-time guidance (bookmark to archives).
          try {
            const missionId = String(slug).split('/')[0];
            if (missionId === 'mission-00') {
              localStorage.setItem('astro:tutorial:mission-00:bookmark_done', 'true');
            }
          } catch {
            // ignore
          }
          
          setSaved(true);
        }
      } else {
        // Fallback: Create profile if it doesn't exist
        const newProfile = {
          callsign: 'PILOT',
          prefix: 'PILOT',
          stardust: reward,
          bookmarks: [slug],
          completedSubMissions: [],
          joined: new Date().toISOString()
        };
        localStorage.setItem('astro_pilot_profile', JSON.stringify(newProfile));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('astro:profile-update', { detail: newProfile }));

        try {
          const missionId = String(slug).split('/')[0];
          if (missionId === 'mission-00') {
            localStorage.setItem('astro:tutorial:mission-00:bookmark_done', 'true');
          }
        } catch {
          // ignore
        }
        setSaved(true);
      }
      setIsSyncing(false);
    }, 800);
  };

  if (!isLoaded) return <div className="w-32 h-8 bg-space-800 rounded animate-pulse" />;

  return (
    <button 
        onClick={handleSave}
        disabled={saved || isSyncing}
      data-tour="bookmark-archives"
        className={`flex items-center space-x-2 px-3 py-1.5 rounded border transition-all text-xs font-mono font-bold ${
            saved 
            ? 'bg-stardust/20 border-stardust text-stardust cursor-default' 
            : isSyncing
            ? 'bg-space-800 border-nebula-500 text-nebula-400 cursor-wait'
            : 'bg-space-800 border-space-700 text-slate-400 hover:border-slate-500 hover:text-white'
        }`}
    >
        {isSyncing ? (
            <>
                <div className="w-3 h-3 border-2 border-nebula-500 border-t-transparent rounded-full animate-spin"></div>
                <span>BOOKMARKING...</span>
            </>
        ) : (
            <>
                <span>{saved ? 'BOOKMARKED TO ARCHIVES' : 'BOOKMARK TO ARCHIVES'}</span>
                {saved ? (
                <span className="text-lg leading-none">★</span>
                ) : (
                reward > 0 && <span className="text-stardust ml-1">+{reward} ★</span>
                )}
            </>
        )}
    </button>
  );
};

export default SaveToLogButton;
