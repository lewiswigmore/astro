import { useEffect, useState } from 'react';
import type { PilotProfile } from '../types/profile';
import { checkAndUpdateDailyLogin, getStreakMultiplier, migrateProfile } from '../utils/profileUtils';

const DailyStreakCard = () => {
  const [profile, setProfile] = useState<PilotProfile | null>(null);
  const [reward, setReward] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadProfile = () => {
      const storedProfile = localStorage.getItem('astro_pilot_profile');
      if (storedProfile) {
        let parsed = JSON.parse(storedProfile);
        
        // Migrate profile if needed
        if (!parsed.level || !parsed.experiencePoints || !parsed.dailyStreak) {
          parsed = migrateProfile(parsed);
        }
        
        const { profile: updated, reward: earnedReward, isNewStreak } = checkAndUpdateDailyLogin(parsed);

        // Persist: checkAndUpdateDailyLogin also updates activityDates.
        localStorage.setItem('astro_pilot_profile', JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('astro:profile-update', { detail: updated }));

        if (isNewStreak && earnedReward > 0) {
          setReward(earnedReward);
          setShowReward(true);
          setTimeout(() => setShowReward(false), 5000);
        }
        
        setProfile(updated);
      }
      setIsLoaded(true);
    };

    loadProfile();
    window.addEventListener('storage', loadProfile);
    return () => window.removeEventListener('storage', loadProfile);
  }, []);

  if (!isLoaded || !profile) {
    return (
      <div className="bg-space-900 border border-space-700 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-space-800 rounded w-1/2 mb-4"></div>
        <div className="h-20 bg-space-800 rounded"></div>
      </div>
    );
  }

  const multiplier = getStreakMultiplier(profile.dailyStreak);
  const daysToNextMilestone = profile.dailyStreak < 3 ? 3 - profile.dailyStreak :
                                profile.dailyStreak < 7 ? 7 - profile.dailyStreak :
                                profile.dailyStreak < 14 ? 14 - profile.dailyStreak :
                                profile.dailyStreak < 30 ? 30 - profile.dailyStreak : 0;

  return (
    <div className="bg-gradient-to-br from-thrust-500/10 to-space-900 border border-thrust-500/30 rounded-xl p-4 shadow-lg relative overflow-hidden h-full flex flex-col" data-tour="daily-streak">
      {/* Reward Notification */}
      {showReward && (
        <div className="absolute inset-0 z-20 bg-thrust-500/20 backdrop-blur-sm flex items-center justify-center animate-in fade-in zoom-in duration-500">
          <div className="bg-space-900 border-2 border-thrust-400 rounded-lg p-6 text-center shadow-2xl">
            <div className="text-thrust-400 font-black text-4xl mb-2">+{reward}</div>
            <div className="text-white font-bold text-lg mb-1">Daily Login Bonus!</div>
            <div className="text-slate-400 text-sm font-mono">Streak: {profile.dailyStreak} days</div>
          </div>
        </div>
      )}
      
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-thrust-400/5 blur-2xl rounded-full"></div>
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-mono text-thrust-400 uppercase tracking-widest font-bold">
            Daily Streak
          </h3>
          {multiplier > 1 && (
            <span className="px-2 py-1 bg-thrust-400/20 border border-thrust-400/50 rounded text-thrust-400 text-xs font-bold">
              {multiplier}x Multiplier
            </span>
          )}
        </div>

        {/* Streak Display */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-thrust-500/20 border-4 border-thrust-400 rounded-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-black text-white">{profile.dailyStreak}</div>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-white text-2xl font-bold mb-1">{profile.dailyStreak} Day{profile.dailyStreak !== 1 ? 's' : ''}</div>
            <div className="text-slate-400 text-sm font-mono">
              {profile.longestStreak > profile.dailyStreak && (
                <span>Best: {profile.longestStreak} days</span>
              )}
            </div>
          </div>
        </div>

        {/* Milestone Progress */}
        {daysToNextMilestone > 0 && (
          <div className="bg-space-800/50 border border-space-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-400 font-mono">Next Milestone</span>
              <span className="text-xs text-thrust-400 font-mono font-bold">
                {daysToNextMilestone} day{daysToNextMilestone !== 1 ? 's' : ''} to go
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {[3, 7, 14, 30].map((milestone) => (
                <div
                  key={milestone}
                  className={`flex-1 h-2 rounded-full ${
                    profile.dailyStreak >= milestone 
                      ? 'bg-thrust-400' 
                      : 'bg-space-700'
                  }`}
                  title={`${milestone} days`}
                ></div>
              ))}
            </div>
          </div>
        )}

        {/* Milestone Achieved */}
        {profile.dailyStreak >= 30 && (
          <div className="bg-gradient-to-r from-stardust/20 to-thrust-400/20 border border-stardust/50 rounded-lg p-1.5 text-center">
            <div className="text-stardust text-[10px] font-bold font-mono">🔥 LEGENDARY STREAK! 🔥</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyStreakCard;
