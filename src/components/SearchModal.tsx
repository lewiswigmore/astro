import { useEffect, useState, useMemo } from 'react';
import Icon from './Icon';

interface SearchResult {
  slug: string;
  title: string;
  description: string;
  mission: string;
  order?: number;
  matchType: 'title' | 'description' | 'mission';
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  docs: Array<{
    slug: string;
    data: {
      title: string;
      description: string;
      order?: number;
    };
  }>;
  completedMissions?: string[];
}

const SearchModal = ({ isOpen, onClose, docs, completedMissions = [] }: SearchModalProps) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const isMissionUnlocked = (mission: string) => {
    // Permanently lock missions in development
    if (mission === 'mission-03' || mission === 'mission-04') return false;

    if (mission === 'mission-00') return true;
    const missionNum = parseInt(mission.replace('mission-', ''));
    if (isNaN(missionNum)) return true;
    const prevMissionId = `mission-${String(missionNum - 1).padStart(2, '0')}`;
    return completedMissions.includes(prevMissionId);
  };

  const results = useMemo(() => {
    if (!query.trim()) return [];

    const searchTerm = query.toLowerCase();
    const matches: SearchResult[] = [];

    docs.forEach((doc) => {
      const mission = doc.slug.split('/')[0];
      
      // Security Protocol: Filter out locked mission content
      if (!isMissionUnlocked(mission)) return;

      const titleMatch = doc.data.title.toLowerCase().includes(searchTerm);
      const descMatch = doc.data.description.toLowerCase().includes(searchTerm);
      const slugMatch = doc.slug.toLowerCase().includes(searchTerm);

      if (titleMatch || descMatch || slugMatch) {
        matches.push({
          slug: doc.slug,
          title: doc.data.title,
          description: doc.data.description,
          mission,
          order: doc.data.order,
          matchType: titleMatch ? 'title' : descMatch ? 'description' : 'mission',
        });
      }
    });

    // Sort: title matches first, then by mission and order
    return matches
      .sort((a, b) => {
        if (a.matchType === 'title' && b.matchType !== 'title') return -1;
        if (a.matchType !== 'title' && b.matchType === 'title') return 1;
        if (a.mission !== b.mission) return a.mission.localeCompare(b.mission);
        return (a.order ?? 0) - (b.order ?? 0);
      })
      .slice(0, 10);
  }, [query, docs]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        navigateToResult(results[selectedIndex]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const navigateToResult = (result: SearchResult) => {
    const base = (import.meta as any).env?.BASE_URL || '/';
    const url = base.endsWith('/') ? `${base}${result.slug}` : `${base}/${result.slug}`;
    window.location.assign(url);
  };

  const getMissionBadge = (mission: string) => {
    const num = mission.replace('mission-', '');
    return `M${num}`;
  };

  const getMissionColor = (mission: string) => {
    const colors: Record<string, string> = {
      'mission-00': 'bg-thrust-500/20 text-thrust-400 border-thrust-500/30',
      'mission-01': 'bg-nebula-500/20 text-nebula-400 border-nebula-500/30',
      'mission-02': 'bg-stardust/20 text-stardust border-stardust/30',
      'mission-03': 'bg-green-500/20 text-green-400 border-green-500/30',
      'mission-04': 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return colors[mission] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 pt-[10vh]"
      onClick={onClose}
    >
      <div
        className="bg-space-900 border border-space-700 rounded-xl max-w-2xl w-full shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top gradient accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-thrust-500 to-transparent"></div>

        {/* Decorative blur orb */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-thrust-500/15 blur-3xl rounded-full"></div>

        <div className="relative z-10">
          {/* Search Input */}
          <div className="p-6 border-b border-space-700">
            <div className="flex items-center gap-3">
              <Icon name="search" className="w-5 h-5 text-thrust-400 flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="SEARCH MISSIONS // Type to scan..."
                className="flex-1 bg-transparent border-none outline-none text-white font-mono text-lg placeholder:text-slate-600"
                autoFocus
              />
              <kbd className="hidden sm:block px-2 py-1 text-xs font-mono text-slate-500 bg-space-800 border border-space-700 rounded">
                ESC
              </kbd>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {query && results.length === 0 && (
              <div className="p-12 text-center">
                <div className="text-4xl mb-3 text-slate-600">📡</div>
                <div className="text-sm font-mono text-slate-500 uppercase tracking-widest">
                  NO SIGNALS DETECTED
                </div>
                <div className="text-xs text-slate-600 mt-2">Try different search terms</div>
              </div>
            )}

            {!query && (
              <div className="p-6">
                {completedMissions.length > 0 ? (
                  <>
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] mb-4 px-2">
                      Recently Completed
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {completedMissions.slice(-3).reverse().map((slug) => {
                        const doc = docs.find(d => d.slug === slug);
                        if (!doc) return null;
                        return (
                          <button
                            key={slug}
                            onClick={() => navigateToResult({
                              slug: doc.slug,
                              title: doc.data.title,
                              description: doc.data.description,
                              mission: doc.slug.split('/')[0],
                              matchType: 'title'
                            })}
                            className="w-full text-left p-3 rounded-lg bg-space-800/30 border border-space-700 hover:border-thrust-500/50 hover:bg-thrust-500/5 transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`px-1.5 py-0.5 text-[10px] font-mono rounded border ${getMissionColor(doc.slug.split('/')[0])}`}>
                                {getMissionBadge(doc.slug.split('/')[0])}
                              </div>
                              <div className="text-sm text-slate-300 group-hover:text-thrust-400 transition-colors">
                                {doc.data.title}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="p-6 text-center">
                    <div className="text-4xl mb-3 text-thrust-400/50">🔍</div>
                    <div className="text-sm font-mono text-slate-500 uppercase tracking-widest">
                      READY TO SCAN
                    </div>
                    <div className="text-xs text-slate-600 mt-2">Search across all missions and topics</div>
                  </div>
                )}
              </div>
            )}

            {results.length > 0 && (
              <div className="p-3">
                {results.map((result, index) => (
                  <button
                    key={result.slug}
                    onClick={() => navigateToResult(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full text-left p-4 rounded-lg mb-2 transition-all group ${
                      index === selectedIndex
                        ? 'bg-thrust-500/10 border border-thrust-500/30'
                        : 'bg-space-800/50 border border-space-700 hover:bg-space-800 hover:border-space-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`px-2 py-1 text-xs font-mono font-bold rounded border flex-shrink-0 ${getMissionColor(
                          result.mission
                        )}`}
                      >
                        {getMissionBadge(result.mission)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-sm font-bold mb-1 transition-colors ${
                            index === selectedIndex ? 'text-thrust-400' : 'text-white group-hover:text-thrust-400'
                          }`}
                        >
                          {result.order !== undefined && `${String(result.order).padStart(2, '0')}. `}
                          {result.title}
                        </div>
                        <div className="text-xs text-slate-500 line-clamp-2">{result.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer hint */}
          {results.length > 0 && (
            <div className="p-3 border-t border-space-700 bg-space-900/50">
              <div className="flex items-center justify-between text-xs font-mono text-slate-600">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>ESC Close</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
