import { useState } from 'react';
import MissionReport from './MissionReport';

interface NavItem {
  slug: string;
  title: string;
}

interface MissionNavigationProps {
  prev: NavItem | null;
  next: NavItem | null;
  currentTitle: string;
  currentSlug: string;
  baseUrl?: string;
}

const MissionNavigation = ({ prev, next, currentTitle, currentSlug, baseUrl = '/' }: MissionNavigationProps) => {
  const [showReport, setShowReport] = useState(false);

  const handleNextClick = (e: any) => {
    e.preventDefault();
    
    // Mark current sub-mission as completed if not already
    const storedProfile = localStorage.getItem('astro_pilot_profile');
    if (storedProfile) {
      const profile = JSON.parse(storedProfile);
      profile.completedSubMissions = profile.completedSubMissions || [];
      
      if (!profile.completedSubMissions.includes(currentSlug)) {
        profile.completedSubMissions.push(currentSlug);

        // Mission economy: Award fuel and stardust for completing sub-missions
        try {
          const missionId = String(currentSlug).split('/')[0];
          const fuelRefill = 5;
          const currentFuel = typeof profile.fuel === 'number' ? profile.fuel : 0;
          
          // Refill fuel (max 100)
          profile.fuel = Math.min(100, currentFuel + fuelRefill);
          localStorage.setItem('astro:last_report_fuel_refill', String(fuelRefill));

          if (missionId === 'mission-00') {
            const stardustReward = 5;
            // Award stardust for orientation sub-missions
            profile.stardust = (profile.stardust || 0) + stardustReward;
            profile.experiencePoints = profile.stardust;
            localStorage.setItem('astro:last_report_stardust_reward', String(stardustReward));
          } else {
            localStorage.setItem('astro:last_report_stardust_reward', '0');
          }
        } catch {
          // ignore
        }

        localStorage.setItem('astro_pilot_profile', JSON.stringify(profile));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('astro:profile-update', { detail: profile }));
      } else {
        localStorage.setItem('astro:last_report_fuel_refill', '0');
        localStorage.setItem('astro:last_report_stardust_reward', '0');
      }
    }

    setShowReport(true);
  };

  return (
    <>
      <div className="mt-16 pt-8 border-t border-space-700 flex justify-between items-center not-prose">
        {prev ? (
          <a href={`${baseUrl}${prev.slug}`} data-astro-reload className="group flex items-center text-slate-400 hover:text-white transition-colors">
            <span className="mr-2 text-xl group-hover:-translate-x-1 transition-transform">←</span>
            <div className="text-left">
              <div className="text-xs font-mono text-slate-500">PREVIOUS</div>
              <div className="font-bold">{prev.title}</div>
            </div>
          </a>
        ) : (
          <div></div>
        )}
        
        {next ? (
          <a href={`${baseUrl}${next.slug}`} onClick={handleNextClick} className="group flex items-center text-thrust-400 hover:text-thrust-300 transition-colors text-right cursor-pointer">
            <div className="text-right">
              <div className="text-xs font-mono text-thrust-500/70">NEXT MISSION</div>
              <div className="font-bold">{next.title}</div>
            </div>
            <span className="ml-2 text-xl group-hover:translate-x-1 transition-transform">→</span>
          </a>
        ) : (
           <a href={baseUrl} onClick={handleNextClick} className="group flex items-center text-green-400 hover:text-green-300 transition-colors text-right cursor-pointer">
            <div className="text-right">
              <div className="text-xs font-mono text-green-500/70">COMPLETE</div>
              <div className="font-bold">Return to Hangar</div>
            </div>
            <span className="ml-2 text-xl group-hover:translate-x-1 transition-transform">✓</span>
          </a>
        )}
      </div>

      <MissionReport 
        isOpen={showReport} 
        onClose={() => setShowReport(false)}
        missionTitle={currentTitle}
        missionSlug={currentSlug}
        nextUrl={next ? `${baseUrl}${next.slug}` : null}
        isFinalMission={!next}
        baseUrl={baseUrl}
      />
    </>
  );
};

export default MissionNavigation;
