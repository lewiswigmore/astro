import { useEffect, useState } from 'react';
import MissionReportWalkthrough from './MissionReportWalkthrough';

interface MissionReportProps {
  isOpen: boolean;
  onClose: () => void;
  missionTitle: string;
  missionSlug: string;
  nextUrl: string | null;
  isFinalMission: boolean;
  baseUrl?: string;
}

const MissionReport = ({ isOpen, onClose, missionTitle, missionSlug, nextUrl, isFinalMission, baseUrl = '/' }: MissionReportProps) => {
  const [awardedStardust, setAwardedStardust] = useState(0);
  const [fuelRefillPercent, setFuelRefillPercent] = useState(0);

  useEffect(() => {
    if (isOpen) {
      // Pull the most recent fuel refill (set by MissionNavigation) for display.
      try {
        const rawFuel = localStorage.getItem('astro:last_report_fuel_refill');
        const parsedFuel = rawFuel ? Number(rawFuel) : 0;
        setFuelRefillPercent(Number.isFinite(parsedFuel) ? parsedFuel : 0);
        localStorage.removeItem('astro:last_report_fuel_refill');

        const rawStardust = localStorage.getItem('astro:last_report_stardust_reward');
        const parsedStardust = rawStardust ? Number(rawStardust) : 0;
        if (parsedStardust > 0) {
          setAwardedStardust(parsedStardust);
          localStorage.removeItem('astro:last_report_stardust_reward');
        } else {
          setAwardedStardust(0);
        }
      } catch {
        setFuelRefillPercent(0);
        setAwardedStardust(0);
      }

      const storedProfile = localStorage.getItem('astro_pilot_profile');
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        const completed = profile.completedMissions || [];

        const missionId = String(missionSlug).split('/')[0];
        
        // Only award mission completion bonus if this is the final step of the mission
        if (isFinalMission && missionId && !completed.includes(missionId)) {
          const award = 50;
          profile.stardust = (profile.stardust || 0) + award;
          profile.completedMissions = [...completed, missionId];
          localStorage.setItem('astro_pilot_profile', JSON.stringify(profile));
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new CustomEvent('astro:profile-update', { detail: profile }));
          setAwardedStardust(prev => prev + award);
        }
      }
    }
  }, [isOpen, missionSlug, isFinalMission]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 not-prose">
      <MissionReportWalkthrough
        isOpen={isOpen}
        missionSlug={missionSlug}
        awardedStardust={awardedStardust}
        fuelUsedPercent={fuelRefillPercent}
      />
      <div className="bg-space-900 border border-nebula-500/50 rounded-xl max-w-md w-full shadow-2xl shadow-nebula-500/20 relative overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-nebula-500 to-transparent"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-nebula-500/20 blur-3xl rounded-full"></div>
        
        <div className="p-8 text-center relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-nebula-500/10 border border-nebula-500/30 mb-6">
            <svg className="w-8 h-8 text-nebula-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">MISSION ACCOMPLISHED</h2>
          <p className="text-slate-400 mb-6 font-mono text-sm">
            REPORT: {missionTitle}
          </p>
          
          <div className="bg-space-800 rounded-lg p-4 mb-8 border border-space-700">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-slate-500 font-mono mb-1">STATUS</div>
                <div className="text-green-400 font-bold">COMPLETE</div>
              </div>
              <div data-tour="mission-report-reward">
                <div className="text-xs text-slate-500 font-mono mb-1">REWARD</div>
                <div className="text-stardust font-bold flex items-center justify-center">
                  {awardedStardust > 0 ? `+${awardedStardust}` : '0'} <span className="ml-1">★</span>
                </div>
              </div>
              <div data-tour="mission-report-fuel">
                <div className="text-xs text-slate-500 font-mono mb-1">FUEL REFILLED</div>
                <div className="text-thrust-400 font-bold">+{fuelRefillPercent}%</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {nextUrl ? (
              <a 
                href={nextUrl}
                data-astro-reload
                data-tour="mission-report-next"
                className="block w-full py-3 px-4 bg-nebula-600 hover:bg-nebula-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-nebula-500/20"
              >
                NEXT MISSION
              </a>
            ) : (
               <a 
                href={baseUrl}
                data-astro-reload
                data-tour="mission-report-next"
                className="block w-full py-3 px-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-green-500/20"
              >
                RETURN TO HANGAR
              </a>
            )}
            
            <button 
              onClick={onClose}
              className="block w-full py-3 px-4 bg-transparent hover:bg-space-800 text-slate-400 hover:text-white font-mono text-sm rounded-lg transition-colors"
            >
              STAY ON THIS FREQUENCY
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionReport;
