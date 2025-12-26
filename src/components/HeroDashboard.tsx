import { useEffect, useState } from 'react';
import type { PilotProfile } from '../types/profile';
import { calculateLevel, getNextLevelProgress, getRankTitle, migrateProfile, applyPassiveFuelRegen } from '../utils/profileUtils';
import Icon from './Icon';
import LoreModal from './LoreModal';
import { getAchievementLore, getBadgeLore, getBadgeIcon, type LoreEntry } from '../utils/lore';

const HeroDashboard = () => {
  const [profile, setProfile] = useState<PilotProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedLore, setSelectedLore] = useState<LoreEntry | null>(null);

  useEffect(() => {
    const loadProfile = () => {
      const storedProfile = localStorage.getItem('astro_pilot_profile');
      if (storedProfile) {
        let parsed = JSON.parse(storedProfile);
        
        // Check if profile needs migration (missing new fields)
        if (!parsed.level || !parsed.experiencePoints || !parsed.dailyStreak) {
          parsed = migrateProfile(parsed);
          localStorage.setItem('astro_pilot_profile', JSON.stringify(parsed));
          window.dispatchEvent(new Event('storage'));
        }

        // Apply passive fuel regeneration
        const regenResult = applyPassiveFuelRegen(parsed);
        if (regenResult.changed) {
          parsed = regenResult.profile;
          localStorage.setItem('astro_pilot_profile', JSON.stringify(parsed));
          window.dispatchEvent(new Event('storage'));
        }

        // Always ensure level and rank are synced with stardust
        const currentLevel = calculateLevel(parsed.stardust || 0);
        if (parsed.level !== currentLevel) {
          parsed.level = currentLevel;
          parsed.rank = getRankTitle(currentLevel);
          localStorage.setItem('astro_pilot_profile', JSON.stringify(parsed));
          // No need to dispatch storage here as we're just syncing local state
        }

        setProfile(parsed);
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
  }, []);

  if (!isLoaded || !profile) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="col-span-2 bg-space-900 border border-space-700 rounded-xl p-8 animate-pulse">
          <div className="h-12 bg-space-800 rounded w-3/4 mb-4"></div>
          <div className="h-6 bg-space-800 rounded w-1/2"></div>
        </div>
        <div className="bg-space-900 border border-space-700 rounded-xl p-6 animate-pulse">
          <div className="h-32 bg-space-800 rounded"></div>
        </div>
      </div>
    );
  }

  const levelProgress = getNextLevelProgress(profile.stardust);
  const currentLevel = levelProgress.current;
  const rankTitle = getRankTitle(currentLevel);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <LoreModal
        isOpen={Boolean(selectedLore)}
        onClose={() => setSelectedLore(null)}
        title={selectedLore?.title ?? ''}
        subtitle={selectedLore?.subtitle}
        icon={selectedLore?.icon}
        story={selectedLore?.story ?? ''}
      />
      {/* Hero Card */}
      <div className="col-span-2 bg-gradient-to-br from-space-900 to-space-800 border border-space-700 rounded-xl p-8 shadow-2xl relative overflow-hidden" data-tour="cockpit-hero">
        {/* Background Glow Effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-nebula-500/10 blur-3xl rounded-full"></div>
        
        <div className="relative z-10">
          {/* Pilot Info */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-slate-500 text-xs font-mono uppercase tracking-widest mb-2">
                {profile.prefix}
              </div>
              <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
                {profile.callsign}
              </h1>
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 bg-nebula-500/20 border border-nebula-500/50 rounded-full text-nebula-400 text-sm font-mono font-bold" data-tour="cockpit-rank">
                  {rankTitle}
                </span>
                <span className="text-slate-400 text-sm font-mono">
                  Level {currentLevel}
                </span>
              </div>
            </div>
            
            {/* Stardust Display */}
            <div className="text-right">
              <div className="text-slate-500 text-xs font-mono uppercase tracking-widest mb-1">
                Stardust
              </div>
              <div className="flex items-center justify-end space-x-2">
                <Icon name="stardust" className="w-8 h-8 text-stardust" />
                <span className="text-5xl font-black text-stardust">
                  {profile.stardust.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Level Progress */}
          <div className="mb-6" data-tour="cockpit-level">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-mono text-slate-400">
                Level {levelProgress.current} → {levelProgress.next}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {levelProgress.percentage.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-space-800 h-3 rounded-full overflow-hidden border border-space-700">
              <div 
                className="bg-gradient-to-r from-nebula-500 to-thrust-400 h-full transition-all duration-500 relative"
                style={{ width: `${levelProgress.percentage}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-space-800/50 border border-space-700 rounded-lg p-3">
              <div className="text-2xl font-bold text-white mb-1">
                {profile.queriesExecuted || 0}
              </div>
              <div className="text-xs text-slate-400 font-mono uppercase">Queries</div>
            </div>
            <div className="bg-space-800/50 border border-space-700 rounded-lg p-3">
              <div className="text-2xl font-bold text-white mb-1">
                {profile.completedMissions.length}
              </div>
              <div className="text-xs text-slate-400 font-mono uppercase">Missions</div>
            </div>
            <div className="bg-space-800/50 border border-space-700 rounded-lg p-3">
              <div className="text-2xl font-bold text-thrust-400 mb-1">
                {profile.dailyStreak}
              </div>
              <div className="text-xs text-slate-400 font-mono uppercase">Streak</div>
            </div>
            <div className="bg-space-800/50 border border-space-700 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {profile.fuel}%
              </div>
              <div className="text-xs text-slate-400 font-mono uppercase">Fuel</div>
            </div>
          </div>

          <button 
            onClick={() => document.getElementById('mission-control')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center space-x-2 px-4 py-2 bg-thrust-500/20 border border-thrust-500/50 rounded-lg text-thrust-400 font-mono text-sm font-bold hover:bg-thrust-500/30 transition-all group"
          >
            <span>[ GO TO MISSION CONTROL ]</span>
            <span className="group-hover:translate-y-1 transition-transform">↓</span>
          </button>
        </div>
      </div>

      {/* Badges Showcase */}
      <div className="bg-space-900 border border-space-700 rounded-xl p-6" data-tour="cockpit-achievements">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest">
            Recent Achievements
          </h3>
          <a href="/observatory" className="text-xs font-mono text-nebula-400 hover:text-nebula-300 transition-colors">
            VIEW ALL →
          </a>
        </div>
        <div className="space-y-3">
          {profile.achievements && profile.achievements.length > 0 ? (
            profile.achievements.slice(-3).reverse().map((achievement, index) => (
            <div 
              key={index}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedLore(getAchievementLore(achievement))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelectedLore(getAchievementLore(achievement));
              }}
              className="flex items-center space-x-3 p-3 bg-space-800 border border-space-700 rounded-lg hover:border-nebula-500/50 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 bg-stardust/10 border border-stardust/30 rounded-full flex items-center justify-center flex-shrink-0 text-xl">
                {achievement.icon === 'stardust' ? (
                  <Icon name="stardust" className="w-5 h-5 text-stardust" />
                ) : (
                  achievement.icon || '🏆'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-bold truncate">
                  {achievement.name}
                </div>
                <div className="text-xs text-slate-500 font-mono truncate">{achievement.description}</div>
              </div>
            </div>
          ))
          ) : profile.badges && profile.badges.length > 0 ? (
            profile.badges.slice(0, 3).map((badge, index) => (
            <div 
              key={index}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedLore(getBadgeLore(badge))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelectedLore(getBadgeLore(badge));
              }}
              className="flex items-center space-x-3 p-3 bg-space-800 border border-space-700 rounded-lg hover:border-nebula-500/50 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 bg-stardust/10 border border-stardust/30 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl">{getBadgeIcon(badge)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-bold truncate">
                  {badge.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
                <div className="text-xs text-slate-500 font-mono">Unlocked</div>
              </div>
            </div>
          ))
          ) : (
            <div className="text-center py-8 text-slate-500">
              <div className="text-4xl mb-2">🏆</div>
              <div className="text-sm font-mono">Complete missions to earn badges</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroDashboard;
