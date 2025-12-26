import { useEffect, useState } from 'react';
import Icon from './Icon';
import SettingsModal from './SettingsModal';
import SearchModal from './SearchModal';
import StardustCounter from './StardustCounter';
import { migrateProfile, calculateLevel, getRankTitle, applyFuelBreakRefill } from '../utils/profileUtils';

interface PilotProfile {
  callsign: string;
  rank: string;
  fuel: number;
  stardust: number;
  prefix?: string;
  activityDates?: string[];
  level?: number;
  completedMissions?: string[];
}

interface MissionControlHeaderProps {
  docs?: Array<{
    slug: string;
    data: {
      title: string;
      description: string;
      order?: number;
    };
  }>;
}

export const MissionControlHeader = ({ docs = [] }: MissionControlHeaderProps) => {
  const [profile, setProfile] = useState<PilotProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const rawBase = import.meta.env.BASE_URL;
  const baseUrl = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

  const loadProfile = () => {
    const storedProfile = localStorage.getItem('astro_pilot_profile');
    if (storedProfile) {
      let parsed = JSON.parse(storedProfile);
      
      // Migrate if needed
      if (!parsed.level || !parsed.experiencePoints) {
        parsed = migrateProfile(parsed);
        localStorage.setItem('astro_pilot_profile', JSON.stringify(parsed));
      }

      // Ensure rank is correct based on stardust
      const currentLevel = calculateLevel(parsed.stardust || 0);
      parsed.rank = getRankTitle(currentLevel);

      // Auto-claim any pending "take a break" fuel refill.
      const claimed = applyFuelBreakRefill(parsed);
      if (claimed.changed) {
        parsed = claimed.profile;
        localStorage.setItem('astro_pilot_profile', JSON.stringify(parsed));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('astro:profile-update', { detail: parsed }));
      }
      
      setProfile(parsed);
    } else {
        // Default for guests or if not yet registered
        setProfile({
            callsign: 'GUEST',
            rank: 'CADET',
            fuel: 100,
            stardust: 0,
            prefix: 'PILOT'
        } as any);
    }
    setIsLoaded(true);
  };

  useEffect(() => {
    loadProfile();
    
    const handleStorageChange = () => {
      loadProfile();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('astro:profile-update' as any, handleStorageChange);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('astro:profile-update' as any, handleStorageChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!isLoaded || !profile) {
    return (
      <header className="bg-space-900 border-b border-space-700 h-14 flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center space-x-8">
          <a href={baseUrl} className="flex items-center group">
              <div className="text-nebula-400 mr-2 group-hover:text-white transition-colors">
                  <Icon name="astro" className="w-6 h-6" />
              </div>
              <span className="font-bold text-white tracking-wider text-sm hidden sm:block">ASTRO<span className="text-nebula-400">KQL</span></span>
          </a>
        </div>
        <div className="flex items-center space-x-6">
          <div className="w-24 h-4 bg-space-800 rounded animate-pulse"></div>
          <div className="w-20 h-4 bg-space-800 rounded animate-pulse hidden md:block"></div>
          <div className="w-16 h-4 bg-space-800 rounded animate-pulse"></div>
        </div>
      </header>
    );
  }

  return (
    <>
    <header className="bg-space-900 border-b border-space-700 h-14 flex items-center justify-between px-4 sticky top-0 z-50">
      <div className="flex items-center space-x-8">
        <a href={baseUrl} className="flex items-center group">
            <div className="text-nebula-400 mr-2 group-hover:text-white transition-colors">
                <Icon name="astro" className="w-6 h-6" />
            </div>
            <span className="font-bold text-white tracking-wider text-sm hidden sm:block">ASTRO<span className="text-nebula-400">KQL</span></span>
        </a>

        <nav className="hidden md:flex items-center space-x-6">
          <a href={baseUrl} data-tour="nav-cockpit" className="text-xs font-mono font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Cockpit
          </a>
          <a href={`${baseUrl}observatory`} data-tour="nav-observatory" className="text-xs font-mono font-bold text-slate-400 hover:text-nebula-400 transition-colors uppercase tracking-widest flex items-center">
            <span className="w-2 h-2 bg-nebula-500 rounded-full mr-2"></span>
            Observatory
          </a>
        </nav>
      </div>

      <div className="flex items-center space-x-6 font-mono text-xs md:text-sm">
        <div className="flex items-center text-slate-400">
          <span className="text-slate-600 mr-2">{profile.prefix || 'PILOT'}:</span>
          <span className="text-thrust-400 font-bold uppercase">{profile.callsign}</span>
        </div>
        <div className="hidden md:flex items-center text-slate-400" data-tour="rank-indicator">
          <span className="text-slate-600 mr-2">RANK:</span>
          <span className="text-white font-bold uppercase">{profile.rank}</span>
        </div>
        <div className="flex items-center text-slate-400" data-tour="fuel-indicator">
          <span className="text-slate-600 mr-2">FUEL:</span>
          <span className={`font-bold ${profile.fuel < 20 ? 'text-red-500 animate-pulse' : 'text-green-400'}`}>
            {profile.fuel}%
          </span>
        </div>
        <StardustCounter className="text-slate-400" />
        <button
          onClick={() => setIsSearchOpen(true)}
          className="text-slate-500 hover:text-thrust-400 transition-colors"
          title="Search Missions (Ctrl+K)"
          data-tour="search-button"
        >
          <Icon name="search" className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          data-tour="settings-button"
          className="text-slate-500 hover:text-white transition-colors"
          title="Settings"
        >
          <Icon name="monitor" className="w-4 h-4" />
        </button>
      </div>
    </header>
    <SearchModal 
      isOpen={isSearchOpen} 
      onClose={() => setIsSearchOpen(false)} 
      docs={docs} 
      completedMissions={profile?.completedMissions || []}
    />
    <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
};

export default MissionControlHeader;
