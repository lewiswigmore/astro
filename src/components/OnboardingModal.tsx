import React, { useState, useEffect } from 'react';
import { calculateLevel, getRankTitle } from '../utils/profileUtils';

const OnboardingModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [step, setStep] = useState(0); // Start at 0 for Pilot Registration
  const [callsign, setCallsign] = useState('');
  const [prefix, setPrefix] = useState('PILOT');

  const INITIAL_STARDUST = 50;

  const baseUrl = (import.meta as any).env?.BASE_URL || '/';
  const normalizedBaseUrl = String(baseUrl).endsWith('/') ? String(baseUrl) : `${baseUrl}/`;
  const navigateTo = (relativePath: string) => {
    const cleaned = String(relativePath).replace(/^\/+/, '');
    window.location.assign(`${normalizedBaseUrl}${cleaned}`);
  };

  useEffect(() => {
    if (isOpen) {
      const savedProfile = localStorage.getItem('astro_pilot_profile');
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        setCallsign(profile.callsign || profile.name); // Handle legacy 'name'
        setPrefix(profile.prefix || 'PILOT');
        setStep(1); // Skip registration if already has a name
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const saveProfile = () => {
    if (!callsign.trim()) return;
    const level = calculateLevel(INITIAL_STARDUST);
    const profile = {
      callsign: callsign.toUpperCase(),
      prefix: prefix,
      rank: getRankTitle(level),
      fuel: 100,
      stardust: INITIAL_STARDUST,
      level: level,
      experiencePoints: INITIAL_STARDUST,
      queriesExecuted: 0,
      completedMissions: [],
      completedSubMissions: [],
      bookmarks: [],
      dailyStreak: 1,
      longestStreak: 1,
      lastLoginDate: new Date().toISOString(),
      totalMinutesActive: 0,
      badges: ['identity-verified'],
      achievements: [],
      unlockedThemes: ['default'],
      selectedTheme: 'default',
      personalBests: {},
      joined: new Date().toISOString()
    };
    localStorage.setItem('astro_pilot_profile', JSON.stringify(profile));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('astro:profile-update', { detail: profile }));
    setStep(1);
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const getIntroContent = () => {
    switch (prefix) {
      case 'COMMANDER':
        return {
          status: '[ SIGNAL LOCKED. CALIBRATING INSTRUMENTS... ]',
          reward: `[ +${INITIAL_STARDUST} STARDUST AWARDED // Calibration Done ]`,
          text: <>You are now operating <span className="text-nebula-400 font-bold">Astro</span>. From this terminal, you will command the flow of data. Prepare for navigating the cosmos.</>
        };
      case 'CADET':
        return {
          status: '[ BIOMETRICS CONFIRMED. LINKING TO DATA STREAM... ]',
          reward: `[ +${INITIAL_STARDUST} STARDUST AWARDED // Signing Bonus ]`,
          text: <>Welcome aboard <span className="text-nebula-400 font-bold">Astro</span>. You are now connected to the universal log stream. Your objective is to filter the cosmic noise and discover hidden signals.</>
        };
      case 'SPECIALIST':
        return {
          status: '[ CLEARANCE LEVEL: GRANTED. INITIALIZING HUD... ]',
          reward: `[ +${INITIAL_STARDUST} STARDUST AWARDED // Rank Established ]`,
          text: <>You stand on the bridge of <span className="text-nebula-400 font-bold">Astro</span>, the ultimate Kusto interceptor. We hunt data down at lightspeed. Prepare for query injection.</>
        };
      case 'ANALYST':
        return {
          status: '[ AUTHENTICATION SUCCESS. DECRYPTING ARCHIVES... ]',
          reward: `[ +${INITIAL_STARDUST} STARDUST AWARDED // Access Granted ]`,
          text: <><span className="text-nebula-400 font-bold">Astro</span> is online. You are now part of an elite crew decoding the language of the cosmos. Every query you write illuminates the dark sectors of the cloud.</>
        };
      case 'OPERATOR':
        return {
          status: '[ PROTOCOL INITIATED. WELCOME, TRAVELER... ]',
          reward: `[ +${INITIAL_STARDUST} STARDUST AWARDED // New Account Credit ]`,
          text: <><span className="text-nebula-400 font-bold">Astro</span> awaits your command. We are drifting in a sea of unstructured data. Your mission is to bring order to the galaxy, one operator at a time.</>
        };
      case 'PILOT':
      default:
        return {
          status: '[ PILOT RECOGNIZED. ENGAGING WARP DRIVE... ]',
          reward: `[ +${INITIAL_STARDUST} STARDUST AWARDED // Pre-flight Complete ]`,
          text: <>Welcome to the cockpit of <span className="text-nebula-400 font-bold">Astro</span>. Here, syntax is your fuel and logic is your navigation. Let's create a map of the universe.</>
        };
    }
  };

  const introContent = getIntroContent();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-lg border border-nebula-500 bg-space-900 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
        {/* Header / HUD Top Bar */}
        <div className="flex items-center justify-between border-b border-space-700 bg-space-800 px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 animate-pulse rounded-full bg-thrust-400"></div>
            <span className="font-mono text-sm font-bold tracking-widest text-thrust-400">
              MISSION CONTROL // {step === 0 ? 'REGISTRATION' : 'ONBOARDING'}
            </span>
          </div>
          <div className="font-mono text-xs text-slate-400">
            SEQ: 00{step}/003
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8">
          {step === 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="font-mono text-3xl font-bold text-white text-glow">
                Identity Registration
              </h2>
              <p className="text-lg leading-relaxed text-slate-300">
                Please provide your designation and callsign for the Mission Manifesto.
              </p>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                    <label className="block text-xs font-mono text-thrust-400 mb-2">DESIGNATION</label>
                    <select 
                        value={prefix}
                        onChange={(e) => setPrefix(e.target.value)}
                        className="w-full bg-space-800 border border-space-700 rounded p-4 text-white font-mono focus:border-nebula-500 focus:outline-none focus:ring-1 focus:ring-nebula-500 transition-all appearance-none"
                    >
                        <option value="PILOT">PILOT</option>
                        <option value="COMMANDER">COMMANDER</option>
                        <option value="CADET">CADET</option>
                        <option value="SPECIALIST">SPECIALIST</option>
                        <option value="ANALYST">ANALYST</option>
                        <option value="OPERATOR">OPERATOR</option>
                    </select>
                </div>
                <div className="col-span-2">
                    <label className="block text-xs font-mono text-thrust-400 mb-2">CALLSIGN</label>
                    <input 
                    type="text" 
                    value={callsign}
                    onChange={(e) => setCallsign(e.target.value)}
                    placeholder="e.g. Maverick"
                    className="w-full bg-space-800 border border-space-700 rounded p-4 text-white font-mono focus:border-nebula-500 focus:outline-none focus:ring-1 focus:ring-nebula-500 transition-all uppercase"
                    onKeyDown={(e) => e.key === 'Enter' && saveProfile()}
                    autoFocus
                    />
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={saveProfile}
                  disabled={!callsign.trim()}
                  className="group relative inline-flex items-center justify-center overflow-hidden rounded bg-nebula-500 px-8 py-3 font-mono font-bold text-white transition-all hover:bg-nebula-400 hover:shadow-[0_0_20px_rgba(167,139,250,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="mr-2">CONFIRM IDENTITY</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="font-mono text-3xl font-bold text-white text-glow">
                Welcome back, {prefix} {callsign}.
              </h2>
              <div className="relative overflow-hidden bg-stardust/10 border border-stardust/30 rounded-lg p-3 mb-4 shadow-[0_0_18px_rgba(251,191,36,0.20)]">
                {/* Subtle "collection" shimmer like Holodeck */}
                <div className="pointer-events-none absolute inset-0 bg-stardust/10 animate-pulse"></div>
                <div className="pointer-events-none absolute left-[15%] top-[30%] w-1 h-1 bg-stardust rounded-full animate-ping"></div>
                <div className="pointer-events-none absolute left-[78%] top-[55%] w-1 h-1 bg-stardust/80 rounded-full animate-ping [animation-delay:250ms]"></div>
                <div className="pointer-events-none absolute left-[52%] top-[18%] w-1 h-1 bg-stardust/70 rounded-full animate-ping [animation-delay:450ms]"></div>

                <div className="relative flex items-center justify-center space-x-2 text-stardust font-mono text-sm">
                  <svg className="w-5 h-5 animate-bounce drop-shadow-[0_0_12px_rgba(251,191,36,0.65)]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="font-bold tracking-wide">+{INITIAL_STARDUST} STARDUST</span>
                  <span className="text-stardust/60 text-xs">// Identity Registered</span>
                </div>
              </div>
              <p className="text-lg leading-relaxed text-slate-300">
                <span className="font-mono text-green-400 text-sm block mb-2">{introContent.status}</span>
                <span className="font-mono text-stardust text-sm block mb-4 animate-pulse">{introContent.reward}</span>
                {introContent.text}
              </p>
              <p className="text-lg font-bold text-white">
                Are you ready to break atmosphere?
              </p>
              <div className="pt-4">
                <button
                  onClick={nextStep}
                  className="group relative inline-flex items-center justify-center overflow-hidden rounded bg-nebula-500 px-8 py-3 font-mono font-bold text-white transition-all hover:bg-nebula-400 hover:shadow-[0_0_20px_rgba(167,139,250,0.5)]"
                >
                  <span className="mr-2">INITIATE PRE-FLIGHT CHECK</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="font-mono text-3xl font-bold text-white text-glow">
                Chart Your Course
              </h2>
              <div className="space-y-4">
                <div className="rounded border border-space-700 bg-space-800 p-4">
                  <h3 className="mb-2 font-bold text-stardust">★ Stardust (XP)</h3>
                  <p className="text-sm text-slate-300">Earned for every query you optimize. Build your legacy.</p>
                </div>
                <div className="rounded border border-space-700 bg-space-800 p-4">
                  <h3 className="mb-2 font-bold text-thrust-400">⚡ Thrust</h3>
                  <p className="text-sm text-slate-300">Log in daily to keep your momentum high and multiply your rewards.</p>
                </div>
              </div>
              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={prevStep}
                  className="group relative inline-flex items-center justify-center overflow-hidden rounded border border-space-700 bg-space-800 px-6 py-3 font-mono font-bold text-slate-400 transition-all hover:bg-space-700 hover:text-white hover:border-slate-500"
                >
                  <span className="transition-transform group-hover:-translate-x-1">←</span>
                  <span className="ml-2">BACK</span>
                </button>
                <button
                  onClick={nextStep}
                  className="group relative inline-flex items-center justify-center overflow-hidden rounded bg-thrust-500 px-8 py-3 font-mono font-bold text-white transition-all hover:bg-thrust-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.5)]"
                >
                  <span className="mr-2">CONFIGURE SENSORS</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="font-mono text-3xl font-bold text-white text-glow">
                Zero-G Ready
              </h2>
              <p className="text-lg leading-relaxed text-slate-300">
                Every great explorer needs a record of their journey. Complete your first module to earn the <span className="text-stardust font-bold">"First Contact"</span> mission patch.
              </p>
              
              <div className="relative bg-gradient-to-br from-stardust/25 to-stardust/5 border-2 border-stardust/50 rounded-lg p-6 mb-6 text-center overflow-hidden shadow-[0_0_24px_rgba(251,191,36,0.35)]">
                {/* Stardust Burst */}
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-stardust/10 blur-2xl animate-pulse" />

                  <span className="absolute left-[12%] top-[18%] text-stardust/80 text-sm animate-in fade-in zoom-in duration-500">★</span>
                  <span className="absolute left-[22%] top-[62%] text-stardust/70 text-xs animate-in fade-in zoom-in duration-700 delay-150">★</span>
                  <span className="absolute left-[35%] top-[30%] text-stardust/60 text-xs animate-in fade-in zoom-in duration-700 delay-200">✦</span>
                  <span className="absolute left-[64%] top-[22%] text-stardust/80 text-sm animate-in fade-in zoom-in duration-700 delay-100">★</span>
                  <span className="absolute left-[78%] top-[58%] text-stardust/70 text-xs animate-in fade-in zoom-in duration-700 delay-200">✦</span>
                  <span className="absolute left-[86%] top-[32%] text-stardust/60 text-xs animate-in fade-in zoom-in duration-700 delay-150">★</span>

                  <div className="absolute left-[20%] top-[40%] h-2 w-2 rounded-full bg-stardust/40 animate-ping" />
                  <div className="absolute left-[72%] top-[42%] h-2 w-2 rounded-full bg-stardust/30 animate-ping [animation-delay:250ms]" />
                  <div className="absolute left-[48%] top-[18%] h-1.5 w-1.5 rounded-full bg-stardust/35 animate-ping [animation-delay:450ms]" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-center mb-2">
                    <svg className="w-8 h-8 text-stardust animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>

                  <div className="text-stardust/80 font-mono text-xs mb-2 uppercase tracking-widest">Mission Launch Bonus</div>

                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-stardust/60 text-sm font-mono animate-pulse">★</span>
                    <div className="text-stardust font-black text-4xl tracking-tight animate-in fade-in zoom-in duration-500">+25 STARDUST</div>
                    <span className="text-stardust/60 text-sm font-mono animate-pulse [animation-delay:200ms]">★</span>
                  </div>

                  <div className="text-stardust/60 text-xs font-mono">Claimed when you launch now</div>
                </div>
              </div>
              
              <div className="flex justify-center py-6">
                <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-4 border-stardust bg-space-800 shadow-[0_0_30px_rgba(251,191,36,0.4)]">
                  <span className="text-4xl">🚀</span>
                  <div className="absolute -bottom-4 rounded bg-stardust px-3 py-1 text-xs font-bold text-black">
                    FIRST CONTACT
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={prevStep}
                    className="group relative inline-flex items-center justify-center overflow-hidden rounded border border-space-700 bg-space-800 px-6 py-4 font-mono font-bold text-slate-400 transition-all hover:bg-space-700 hover:text-white hover:border-slate-500"
                  >
                    <span className="transition-transform group-hover:-translate-x-1">←</span>
                    <span className="ml-2">BACK</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      try {
                        localStorage.removeItem('astro_onboarding_launch_bonus');
                        localStorage.setItem('astro:tutorial:cockpit:intro_pending', 'true');
                      } catch {
                        // ignore
                      }
                      onClose();
                      setTimeout(() => navigateTo(''), 50);
                    }}
                    className="group relative inline-flex items-center justify-center overflow-hidden rounded border border-space-700 bg-space-900/40 px-6 py-4 font-mono font-bold text-slate-200 transition-all hover:border-slate-500"
                  >
                    VISIT COCKPIT
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.setItem('astro_onboarding_launch_bonus', 'true');
                    } catch {
                      // ignore
                    }
                    onClose();
                    setTimeout(() => navigateTo('mission-00/introduction/'), 50);
                  }}
                  className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded bg-green-600 px-8 py-4 font-mono text-xl font-bold text-white transition-all hover:bg-green-500 hover:shadow-[0_0_20px_rgba(34,197,94,0.5)]"
                >
                  <span className="mr-2">LAUNCH MISSION (+25 ★)</span>
                  <span className="transition-transform group-hover:-translate-y-1">🚀</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer / HUD Bottom Bar */}
        <div className="flex justify-between border-t border-space-700 bg-space-800 px-6 py-2 text-[10px] text-slate-500">
          <span>SYSTEM: ONLINE</span>
          <span>V.1.0.0 // ASTRO-KQL</span>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
