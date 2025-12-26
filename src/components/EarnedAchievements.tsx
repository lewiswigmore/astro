import { useEffect, useMemo, useState } from 'react';
import type { PilotProfile } from '../types/profile';
import LoreModal from './LoreModal';
import Icon from './Icon';
import { getAchievementLore, type LoreEntry } from '../utils/lore';

const EarnedAchievements = () => {
  const [profile, setProfile] = useState<PilotProfile | null>(null);
  const [selectedLore, setSelectedLore] = useState<LoreEntry | null>(null);
  const [showAllModal, setShowAllModal] = useState(false);

  useEffect(() => {
    const loadProfile = () => {
      const stored = localStorage.getItem('astro_pilot_profile');
      if (!stored) {
        setProfile(null);
        return;
      }
      try {
        setProfile(JSON.parse(stored));
      } catch {
        setProfile(null);
      }
    };

    loadProfile();
    window.addEventListener('storage', loadProfile);
    window.addEventListener('astro:profile-update' as any, loadProfile);
    return () => {
      window.removeEventListener('storage', loadProfile);
      window.removeEventListener('astro:profile-update' as any, loadProfile);
    };
  }, []);

  const achievements = useMemo(() => {
    const list = profile?.achievements ?? [];
    // Show newest first
    return [...list].reverse();
  }, [profile]);

  return (
    <>
      <LoreModal
        isOpen={Boolean(selectedLore)}
        onClose={() => setSelectedLore(null)}
        title={selectedLore?.title ?? ''}
        subtitle={selectedLore?.subtitle}
        icon={selectedLore?.icon}
        story={selectedLore?.story ?? ''}
      />

      {achievements.length > 0 ? (
        <>
          <div className="space-y-3">
            {achievements.slice(0, 3).map((achievement, index) => (
              <div 
                key={index}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedLore(getAchievementLore(achievement))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setSelectedLore(getAchievementLore(achievement));
                }}
                className="flex items-center space-x-3 p-3 bg-space-800 border border-space-700 rounded-lg hover:border-nebula-500/50 transition-colors cursor-pointer group"
              >
                <div className="w-10 h-10 bg-stardust/10 border border-stardust/30 rounded-full flex items-center justify-center flex-shrink-0 text-xl">
                  {achievement.icon === 'stardust' ? (
                    <Icon name="stardust" className="w-5 h-5 text-stardust" />
                  ) : (
                    achievement.icon || '🏆'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-bold truncate group-hover:text-nebula-400 transition-colors">
                    {achievement.name}
                  </div>
                  <div className="text-xs text-slate-500 font-mono truncate">{achievement.description}</div>
                </div>
              </div>
            ))}
          </div>
          {achievements.length > 3 && (
            <button
              onClick={() => setShowAllModal(true)}
              className="w-full mt-3 py-2 px-4 bg-space-800 border border-space-700 rounded-lg text-slate-300 text-xs font-mono hover:border-nebula-500/50 hover:text-white transition-colors"
            >
              VIEW ALL ({achievements.length})
            </button>
          )}
        </>
      ) : (
        <div className="text-center py-6 text-slate-500">
          <div className="text-3xl mb-2">🏆</div>
          <div className="text-xs font-mono">No achievements yet. Complete missions to earn them.</div>
        </div>
      )}

      {/* View All Modal */}
      {showAllModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAllModal(false)}>
          <div 
            className="bg-space-900 border border-space-700 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-space-700">
              <h2 className="text-xl font-bold text-white">All Achievements</h2>
              <button
                onClick={() => setShowAllModal(false)}
                className="text-slate-400 hover:text-white transition-colors text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto p-6 space-y-3">
              {achievements.map((achievement, index) => (
                <div 
                  key={index}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setSelectedLore(getAchievementLore(achievement));
                    setShowAllModal(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedLore(getAchievementLore(achievement));
                      setShowAllModal(false);
                    }
                  }}
                  className="flex items-center space-x-3 p-3 bg-space-800 border border-space-700 rounded-lg hover:border-nebula-500/50 transition-colors cursor-pointer group"
                >
                  <div className="w-10 h-10 bg-stardust/10 border border-stardust/30 rounded-full flex items-center justify-center flex-shrink-0 text-xl">
                    {achievement.icon === 'stardust' ? (
                      <Icon name="stardust" className="w-5 h-5 text-stardust" />
                    ) : (
                      achievement.icon || '🏆'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-bold truncate group-hover:text-nebula-400 transition-colors">
                      {achievement.name}
                    </div>
                    <div className="text-xs text-slate-500 font-mono truncate">{achievement.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EarnedAchievements;
