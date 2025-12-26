import { useEffect, useState } from 'react';

const ObservatoryGreeting = () => {
  const [name, setName] = useState('Pilot');
  const [prefix, setPrefix] = useState('Pilot');
  const [logCount, setLogCount] = useState(0);

  useEffect(() => {
    const loadProfile = () => {
      const storedProfile = localStorage.getItem('astro_pilot_profile');
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        setName(profile.callsign);
        setPrefix(profile.prefix || 'Pilot');
        setLogCount(profile.completedSubMissions?.length || 0);
      }
    };

    loadProfile();
    window.addEventListener('storage', loadProfile);
    return () => window.removeEventListener('storage', loadProfile);
  }, []);

  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2 font-mono tracking-tighter">
          THE OBSERVATORY
        </h1>
        <p className="text-slate-400 font-mono text-sm max-w-2xl">
          Welcome to the Archives, {prefix} <span className="text-thrust-400 font-bold">{name}</span>. Your neural link is active. Which sector shall we analyze today?
        </p>
      </div>
      
      <div className="flex items-center space-x-6 bg-space-900/50 border border-space-700 px-6 py-3 rounded-xl backdrop-blur-sm">
        <div className="text-center">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Logs Synced</div>
            <div className="text-2xl font-bold text-nebula-400 font-mono">{logCount}</div>
        </div>
        <div className="w-px h-8 bg-space-700"></div>
        <div className="text-center">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">System Status</div>
            <div className="text-xs font-bold text-green-500 font-mono flex items-center">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                NOMINAL
            </div>
        </div>
      </div>
    </div>
  );
};

export default ObservatoryGreeting;

