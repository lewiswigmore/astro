import { useEffect, useState } from 'react';

interface ResearchLogProps {
  allDocs: Array<{
    slug: string;
    data: {
      title: string;
      order?: number;
    };
  }>;
  baseUrl?: string;
}

const ResearchLog = ({ allDocs, baseUrl = '/' }: ResearchLogProps) => {
  const [bookmarkedSlugs, setBookmarkedSlugs] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadProfile = () => {
      const storedProfile = localStorage.getItem('astro_pilot_profile');
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        setBookmarkedSlugs(profile.bookmarks || []);
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

  if (!isLoaded) return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="h-12 bg-space-800 rounded-lg" />)}
    </div>
  );

  // Filter and map bookmarked docs
  const bookmarkedDocs = allDocs
    .filter(doc => bookmarkedSlugs.includes(doc.slug))
    .sort((a, b) => {
        // Sort by mission prefix first, then by order
        const prefixA = a.slug.split('/')[0];
        const prefixB = b.slug.split('/')[0];
        if (prefixA !== prefixB) return prefixA.localeCompare(prefixB);
        return (a.data.order || 0) - (b.data.order || 0);
    });

  if (bookmarkedDocs.length === 0) {
    return (
      <div className="text-center py-8 border border-dashed border-space-700 rounded-xl">
        <div className="text-slate-500 font-mono text-xs uppercase tracking-widest mb-2">No bookmarks found</div>
        <p className="text-[10px] text-slate-600 px-4">Bookmark sectors to save them to your personal archives for quick access.</p>
      </div>
    );
  }

  // Show only the last 5 entries in the sidebar view
  const displayDocs = bookmarkedDocs.slice(-5).reverse();

  return (
    <div className="space-y-3">
      {displayDocs.map((doc) => {
        const missionPrefix = doc.slug.split('/')[0].replace('-', ' ').toUpperCase();
        return (
          <a 
            key={doc.slug}
            href={`${baseUrl}${doc.slug}`}
            data-astro-reload
            className="flex items-start space-x-3 p-3 rounded-lg bg-space-800/50 border border-space-700 hover:border-stardust/50 hover:bg-space-800 transition-all group"
          >
            <div className="mt-1.5 w-1.5 h-1.5 bg-stardust rounded-full shadow-[0_0_8px_rgba(251,191,36,0.5)] group-hover:scale-125 transition-transform"></div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white font-bold truncate group-hover:text-stardust transition-colors">{doc.data.title}</div>
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{missionPrefix} // SECTOR {doc.data.order || '?'}</div>
            </div>
            <div className="text-slate-600 group-hover:text-stardust transition-colors self-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
            </div>
          </a>
        );
      })}
      
      {bookmarkedDocs.length > 5 && (
         <div className="text-center pt-2">
            <button className="text-[10px] font-mono text-stardust hover:text-white transition-colors uppercase tracking-widest">
                VIEW ALL BOOKMARKS ({bookmarkedDocs.length})
            </button>
         </div>
      )}
    </div>
  );
};

export default ResearchLog;
