import { useEffect, useMemo, useState } from 'react';
import type { PilotProfile } from '../types/profile';
import LoreModal from './LoreModal';
import { getBadgeIcon, getBadgeLore, type LoreEntry } from '../utils/lore';

const EarnedPatches = () => {
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

  const badges = useMemo(() => {
    const list = profile?.badges ?? [];
    // Keep stable ordering but show newest-ish first if user tends to push new ones
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

      {badges.length > 0 ? (
        <>
          <div className="grid grid-cols-3 gap-2">
            {badges.slice(0, 3).map((badgeId) => (
              <button
                key={badgeId}
                type="button"
                onClick={() => setSelectedLore(getBadgeLore(badgeId))}
                className="aspect-square bg-space-800 rounded-lg border border-space-700 flex items-center justify-center group relative hover:border-nebula-500/50 transition-colors"
                title="Open patch lore"
              >
                <div className="text-2xl">{getBadgeIcon(badgeId)}</div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-space-700 text-xs text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                  {badgeId.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </div>
              </button>
            ))}
          </div>
          {badges.length > 3 && (
            <button
              onClick={() => setShowAllModal(true)}
              className="w-full mt-3 py-2 px-4 bg-space-800 border border-space-700 rounded-lg text-slate-300 text-xs font-mono hover:border-nebula-500/50 hover:text-white transition-colors"
            >
              VIEW ALL ({badges.length})
            </button>
          )}
        </>
      ) : (
        <div className="text-center py-6 text-slate-500">
          <div className="text-3xl mb-2">🏷️</div>
          <div className="text-xs font-mono">No patches yet. Complete missions to earn them.</div>
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
              <h2 className="text-xl font-bold text-white">All Patches</h2>
              <button
                onClick={() => setShowAllModal(false)}
                className="text-slate-400 hover:text-white transition-colors text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              <div className="grid grid-cols-4 gap-3">
                {badges.map((badgeId) => (
                  <button
                    key={badgeId}
                    type="button"
                    onClick={() => {
                      setSelectedLore(getBadgeLore(badgeId));
                      setShowAllModal(false);
                    }}
                    className="aspect-square bg-space-800 rounded-lg border border-space-700 flex items-center justify-center group relative hover:border-nebula-500/50 transition-colors"
                    title="Open patch lore"
                  >
                    <div className="text-2xl">{getBadgeIcon(badgeId)}</div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-space-700 text-xs text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                      {badgeId.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EarnedPatches;
