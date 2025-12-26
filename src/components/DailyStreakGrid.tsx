import { useEffect, useMemo, useRef, useState } from 'react';
import type { PilotProfile } from '../types/profile';
import { migrateProfile } from '../utils/profileUtils';

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

const DAYS_PER_WEEK = 7;
const ROWS = 7;

const DailyStreakGrid = () => {
  const [profile, setProfile] = useState<PilotProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [weeks, setWeeks] = useState(12);
  const gridWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadProfile = () => {
      const storedProfile = localStorage.getItem('astro_pilot_profile');
      if (storedProfile) {
        let parsed = JSON.parse(storedProfile);

        // Migrate profile if needed
        if (!parsed.level || !parsed.experiencePoints || !parsed.dailyStreak) {
          parsed = migrateProfile(parsed);
          localStorage.setItem('astro_pilot_profile', JSON.stringify(parsed));
          window.dispatchEvent(new Event('storage'));
        }

        // Ensure activityDates exists even if already migrated earlier
        if (!Array.isArray(parsed.activityDates)) {
          parsed.activityDates = [];
          localStorage.setItem('astro_pilot_profile', JSON.stringify(parsed));
          window.dispatchEvent(new Event('storage'));
        }

        setProfile(parsed);
      }
      setIsLoaded(true);
    };

    loadProfile();
    window.addEventListener('storage', loadProfile);
    return () => window.removeEventListener('storage', loadProfile);
  }, []);

  useEffect(() => {
    const el = gridWrapRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      
      // Minimum square size
      const minSize = 8;
      const gap = 4;
      
      // Calculate cell size that fills height
      const cellHeight = (height - gap * (ROWS - 1)) / ROWS;
      
      // Calculate how many columns fit
      const cols = Math.floor((width + gap) / (cellHeight + gap));
      
      setWeeks(Math.max(6, Math.min(52, cols)));
    };

    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  const activeSet = useMemo(() => {
    const set = new Set<string>();
    if (profile?.activityDates) {
      for (const key of profile.activityDates) set.add(key);
    }
    return set;
  }, [profile]);

  const days = useMemo(() => {
    const today = new Date();
    const totalDays = weeks * DAYS_PER_WEEK;
    const start = addDays(today, -(totalDays - 1));

    return Array.from({ length: totalDays }, (_, i) => {
      const d = addDays(start, i);
      const key = toDateKey(d);
      return { date: d, key, active: activeSet.has(key) };
    });
  }, [activeSet, weeks]);

  if (!isLoaded) {
    return (
      <div className="bg-space-900 border border-space-700 rounded-xl p-4 animate-pulse h-full flex flex-col">
        <div className="h-4 bg-space-800 rounded w-1/3 mb-4"></div>
        <div className="flex-1" />
        <div 
          className="grid gap-1"
          style={{
            gridAutoFlow: 'column',
            gridTemplateRows: `repeat(${ROWS}, 1fr)`,
          }}
        >
          {Array.from({ length: 20 * ROWS }).map((_, i) => (
            <div key={i} className="w-3 h-3 rounded bg-space-800" />
          ))}
        </div>
      </div>
    );
  }

  const activeCount = days.reduce((acc, d) => (d.active ? acc + 1 : acc), 0);

  return (
    <div className="bg-space-900 border border-space-700 rounded-xl p-6 h-full flex flex-col" data-tour="activity-grid">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-mono text-slate-300 uppercase tracking-widest font-bold">Activity</h3>
        <div className="text-xs font-mono text-slate-500">{activeCount} days / {weeks}w</div>
      </div>

      {/* Grid fills the available space */}
      <div ref={gridWrapRef} className="flex-1 min-h-0 w-full">
        <div
          className="grid w-full h-full"
          style={{
            gridAutoFlow: 'column',
            gridTemplateRows: `repeat(${ROWS}, 1fr)`,
            gridTemplateColumns: `repeat(${weeks}, 1fr)`,
            gap: '4px',
          }}
        >
          {days.map((d) => (
            <div
              key={d.key}
              title={`${d.key}${d.active ? ' • active' : ''}`}
              className={[
                'rounded-sm border',
                d.active
                  ? 'bg-thrust-400/80 border-thrust-400/40 shadow-[0_0_0_1px_rgba(45,212,191,0.15)]'
                  : 'bg-space-800 border-space-700',
              ].join(' ')}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span>older</span>
        <span>newer</span>
      </div>
    </div>
  );
};

export default DailyStreakGrid;
