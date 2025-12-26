import { useEffect, useMemo, useRef, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { ensureKQL, initMonaco } from '../utils/monacoConfig';
import Icon from './Icon';
import { applyFuelBreakRefill, applyPassiveFuelRegen } from '../utils/profileUtils';

interface HolodeckProps {
  initialCode?: string;
  title?: string;
  /** Fuel cost to run a simulation. Defaults to 5. */
  runFuelCost?: number;
}

type TelemetryStatus = 'SUCCESS' | 'FAILURE' | 'LOCKOUT' | 'TIMEOUT';
interface TelemetryRow {
  timestamp: string;
  eventId: number;
  source: string;
  status: TelemetryStatus;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function statusColor(status: TelemetryStatus): string {
  switch (status) {
    case 'SUCCESS':
      return 'text-green-500/50';
    case 'FAILURE':
      return 'text-red-500/50';
    case 'LOCKOUT':
      return 'text-amber-500/60';
    case 'TIMEOUT':
      return 'text-slate-400/70';
    default:
      return 'text-slate-500/70';
  }
}

function generateTelemetryRows(count: number): TelemetryRow[] {
  const eventPool = [4624, 4625, 4634, 4648, 4672, 4688, 4768, 4771, 4776, 1102, 4104];
  const sourcePool = ['AUTH_SRV_01', 'AUTH_SRV_02', 'DC01', 'DC02', 'KQL_GW_01', 'SENTINEL_BRIDGE', 'PROC_MON_01'];
  const statusPool: TelemetryStatus[] = ['SUCCESS', 'SUCCESS', 'SUCCESS', 'FAILURE', 'LOCKOUT', 'TIMEOUT'];

  const now = new Date();
  const start = new Date(now.getTime() - randomInt(60, 240) * 1000);
  const rows: TelemetryRow[] = [];
  let cursor = start.getTime();

  for (let i = 0; i < count; i++) {
    cursor += randomInt(1, 6) * 1000;
    const status = statusPool[randomInt(0, statusPool.length - 1)];

    rows.push({
      timestamp: new Date(cursor).toISOString(),
      eventId: eventPool[randomInt(0, eventPool.length - 1)],
      source: sourcePool[randomInt(0, sourcePool.length - 1)],
      status,
    });
  }

  return rows;
}

const stableHashHex = (input: string): string => {
  // FNV-1a 32-bit
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  // Convert to unsigned hex
  return (hash >>> 0).toString(16).padStart(8, '0');
};

const Holodeck = ({ initialCode, title = "Tactical Console // Holodeck Simulation", runFuelCost = 5 }: HolodeckProps) => {
  const [output, setOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [stardustAwarded, setStardustAwarded] = useState(false);
  const [totalStardust, setTotalStardust] = useState(0);
  const [fuel, setFuel] = useState(0);
  const [fuelMessage, setFuelMessage] = useState<string | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [code, setCode] = useState('');
  const [telemetryRows, setTelemetryRows] = useState<TelemetryRow[]>([]);
  const editorRef = useRef<any>(null);
  const editorWrapRef = useRef<HTMLDivElement | null>(null);
  const monacoRef = useRef<any>(null);
  const lastRemountAtRef = useRef<number>(0);

  const defaultCode = useMemo(
    () =>
      initialCode ||
      `// Try running a query...
AuthenticationEvents
| take 10`,
    [initialCode]
  );

  const RUN_FUEL_COST = useMemo(() => {
    const value = typeof runFuelCost === 'number' && Number.isFinite(runFuelCost) ? runFuelCost : 5;
    return Math.max(0, Math.min(100, Math.round(value)));
  }, [runFuelCost]);

  useEffect(() => {
    // Initialize or update the controlled value when the MDX-provided initialCode changes.
    setCode(defaultCode);
  }, [defaultCode]);

  useEffect(() => {
    setIsEditorReady(false);
    initMonaco().then(monaco => {
      monacoRef.current = monaco;
    });
  }, [editorKey]);

  useEffect(() => {
    const loadStardust = () => {
      const storedProfile = localStorage.getItem('astro_pilot_profile');
      if (storedProfile) {
        let profile = JSON.parse(storedProfile);

        // Apply passive fuel regeneration
        const regenResult = applyPassiveFuelRegen(profile);
        if (regenResult.changed) {
          profile = regenResult.profile;
        }

        const claimed = applyFuelBreakRefill(profile);
        if (claimed.changed || regenResult.changed) {
          profile = claimed.profile;
          localStorage.setItem('astro_pilot_profile', JSON.stringify(profile));
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new CustomEvent('astro:profile-update', { detail: profile }));
        }
        setTotalStardust(profile.stardust || 0);
        setFuel(typeof profile.fuel === 'number' ? profile.fuel : 0);
      }
    };

    loadStardust();
    window.addEventListener('storage', loadStardust);
    const onProfileUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail as any;
      if (!detail) return;
      setTotalStardust(detail.stardust || 0);
      setFuel(typeof detail.fuel === 'number' ? detail.fuel : 0);
    };
    window.addEventListener('astro:profile-update', onProfileUpdate as EventListener);
    return () => {
      window.removeEventListener('storage', loadStardust);
      window.removeEventListener('astro:profile-update', onProfileUpdate as EventListener);
    };
  }, []);

  const handleUplink = () => {
    try {
      localStorage.setItem('astro:tutorial:mission-00:uplink_done', 'true');
    } catch {
      // ignore
    }

    const query = editorRef.current?.getValue() || '';
    const encodedQuery = encodeURIComponent(query);
    const adxUrl = `https://dataexplorer.azure.com/clusters/help/databases/SecurityLogs?query=${encodedQuery}`;
    window.open(adxUrl, '_blank', 'noopener,noreferrer');
  };

  const layoutEditor = () => {
    const editor = editorRef.current;
    if (!editor) return;
    requestAnimationFrame(() => {
      try {
        if (monacoRef.current) {
          ensureKQL(monacoRef.current);
          monacoRef.current.editor.setTheme('kql-dark');
        }
        editor.layout();
      } catch {
        // noop
      }
    });
  };

  useEffect(() => {
    const remountEditor = () => {
      const now = Date.now();
      if (now - lastRemountAtRef.current < 500) return;
      lastRemountAtRef.current = now;
      setEditorKey((k) => k + 1);
    };

    const onSwap = () => {
      // Monaco sometimes needs 2 passes after swaps/transitions.
      layoutEditor();
      setTimeout(layoutEditor, 50);
      setTimeout(layoutEditor, 250);

      // If formatting still breaks under client routing, remount
      setTimeout(remountEditor, 250);
    };

    document.addEventListener('astro:page-load', onSwap as any);
    document.addEventListener('astro:after-swap', onSwap as any);
    window.addEventListener('resize', onSwap);
    document.addEventListener('visibilitychange', onSwap);

    const ro = editorWrapRef.current ? new ResizeObserver(() => onSwap()) : null;
    if (ro && editorWrapRef.current) ro.observe(editorWrapRef.current);

    return () => {
      document.removeEventListener('astro:page-load', onSwap as any);
      document.removeEventListener('astro:after-swap', onSwap as any);
      window.removeEventListener('resize', onSwap);
      document.removeEventListener('visibilitychange', onSwap);
      ro?.disconnect();
    };
  }, []);

  const canRun = !isRunning && fuel >= RUN_FUEL_COST;

  const persistProfile = (profile: any) => {
    localStorage.setItem('astro_pilot_profile', JSON.stringify(profile));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('astro:profile-update', { detail: profile }));
  };

  const handleRun = () => {
    setFuelMessage(null);

    const storedProfile = localStorage.getItem('astro_pilot_profile');
    if (!storedProfile) return;
    const startingProfile = JSON.parse(storedProfile);

    const currentFuel = typeof startingProfile.fuel === 'number' ? startingProfile.fuel : 0;
    if (currentFuel < RUN_FUEL_COST) {
      setFuelMessage('Insufficient Fuel. Refuel in Settings or wait for daily refuel.');
      return;
    }

    // Spend fuel immediately when a run starts.
    const spentProfile = {
      ...startingProfile,
      fuel: Math.max(0, currentFuel - RUN_FUEL_COST),
    };
    persistProfile(spentProfile);
    setFuel(spentProfile.fuel);

    try {
      localStorage.setItem('astro:tutorial:mission-00:sim_run_done', 'true');
    } catch {
      // ignore
    }

    setIsRunning(true);
    setOutput(null);
    setStardustAwarded(false);
    setTelemetryRows([]);

    // Simulate network delay
    setTimeout(() => {
      setIsRunning(false);
      setOutput('SIMULATION_COMPLETE: 15_RECORDS_INTERCEPTED');
      setTelemetryRows(generateTelemetryRows(15));
      
      // Update stardust in localStorage
      const storedProfileAfterSpend = localStorage.getItem('astro_pilot_profile');
      if (storedProfileAfterSpend) {
        const profile = JSON.parse(storedProfileAfterSpend);
        
        // Prevent farming: reward once per unique exercise.
        // Key the reward by the exercise definition (defaultCode) rather than the title,
        // so each embedded Holodeck across missions can award once.
        const simId = `sim-${stableHashHex(`${title}|${defaultCode}`)}`;
        profile.achievements = profile.achievements || [];
        const alreadyRewarded = profile.achievements.some((a: any) => a.id === simId);

        if (!alreadyRewarded) {
          const award = 5;
          profile.stardust = (profile.stardust || 0) + award;
          
          // Record the achievement to prevent re-awarding
          profile.achievements.push({
            id: simId,
            name: 'Simulation Synchronized',
            description: `Completed simulation: ${title}`,
            icon: 'stardust',
            earnedAt: new Date().toISOString(),
            category: 'query',
            rarity: 'common'
          });

          setStardustAwarded(true);
          // Reset the award animation after a few seconds
          setTimeout(() => setStardustAwarded(false), 4000);
        }

        profile.queriesExecuted = (profile.queriesExecuted || 0) + 1;
        const todayKey = new Date().toISOString().slice(0, 10);
        profile.activityDates = Array.isArray(profile.activityDates) ? profile.activityDates : [];
        if (!profile.activityDates.includes(todayKey)) {
          profile.activityDates.push(todayKey);
        }
        
        persistProfile(profile);
        setTotalStardust(profile.stardust);
        setFuel(typeof profile.fuel === 'number' ? profile.fuel : 0);
      }
    }, 1500);
  };

  return (
    <div className={`my-8 border border-space-700 rounded-xl overflow-hidden bg-space-900 shadow-2xl shadow-nebula-500/5 relative group/holodeck ${stardustAwarded ? 'animate-shake' : ''}`}>
      {/* Stardust Collection Overlay */}
      {stardustAwarded && (
        <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-stardust/10 animate-pulse"></div>
            <div className="relative flex flex-col items-center animate-in zoom-in fade-in duration-300">
                <div className="w-20 h-20 mb-4 text-stardust animate-bounce drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3l1.912 5.885h6.188l-5.006 3.638 1.912 5.885-5.006-3.638-5.006 3.638 1.912-5.885-5.006-3.638h6.188z" fill="currentColor" />
                    </svg>
                </div>
                <div className="text-stardust font-black text-4xl tracking-[0.3em] text-glow animate-pop">+5 STARDUST</div>
                <div className="text-stardust/80 text-xs font-mono mt-2 uppercase tracking-[0.5em]">Neural Link Synchronized</div>
            </div>
            {/* Particle effects (simulated with dots) */}
            {[...Array(30)].map((_, i) => (
                <div 
                    key={i}
                    className="absolute w-1 h-1 bg-stardust rounded-full animate-ping"
                    style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 1}s`,
                        animationDuration: `${1 + Math.random() * 2}s`,
                        opacity: Math.random()
                    }}
                ></div>
            ))}
        </div>
      )}

      {/* Header */}
      <div className="bg-space-900 border-b border-space-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-red-500/30"></div>
          <div className="w-2 h-2 rounded-full bg-yellow-500/30"></div>
          <div className="w-2 h-2 rounded-full bg-green-500/30"></div>
          <span className="ml-2 text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em]">{title}</span>
        </div>
        <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-2 py-0.5 bg-stardust/5 border border-stardust/20 rounded">
                <Icon name="stardust" className="w-2.5 h-2.5 text-stardust" />
                <span className="text-[9px] font-mono text-stardust/80 uppercase tracking-wider">{totalStardust}</span>
            </div>
            <div className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 bg-nebula-500 rounded-full animate-pulse"></span>
                <span className="text-[9px] font-mono text-nebula-500/70 uppercase tracking-wider">Sim Active</span>
            </div>
        </div>
      </div>

      {/* Editor */}
      <div ref={editorWrapRef} className="h-56 relative bg-space-900">
        <Editor
          key={editorKey}
          height="100%"
          defaultLanguage="kql"
          value={code}
          onChange={(value) => setCode(value ?? '')}
          theme="kql-dark"
          onMount={(editor, monaco) => {
            editorRef.current = editor;
            monacoRef.current = monaco;
            
            ensureKQL(monaco);
            
            const model = editor.getModel();
            if (model) {
              monaco.editor.setModelLanguage(model, 'kql');
            }
            monaco.editor.setTheme('kql-dark');
            
            setIsEditorReady(true);
            layoutEditor();
            setTimeout(layoutEditor, 50);
          }}
          loading={
            <div className="absolute inset-0 flex items-center justify-center bg-space-900">
              <div className="flex items-center gap-3 text-slate-400 font-mono text-xs tracking-widest">
                <div className="w-3 h-3 border border-nebula-400/30 border-t-nebula-400 rounded-full animate-spin" />
                <span>INITIALIZING HOLODECK…</span>
              </div>
            </div>
          }
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            fontSize: 14,
            lineHeight: 20,
            padding: { top: 16, bottom: 16 },
            fontFamily: "'JetBrains Mono', monospace",
          }}
        />

        {!isEditorReady && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-space-900">
            <div className="flex items-center gap-3 text-slate-400 font-mono text-xs tracking-widest">
              <div className="w-3 h-3 border border-nebula-400/30 border-t-nebula-400 rounded-full animate-spin" />
              <span>INITIALIZING HOLODECK…</span>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="absolute bottom-4 right-4 z-10 flex items-center space-x-3">
            <button 
                onClick={handleUplink}
            data-tour="holodeck-uplink"
                className="flex items-center space-x-2 px-3 py-1.5 bg-space-900/80 backdrop-blur-sm hover:bg-space-800 text-thrust-400 border border-thrust-500/20 rounded text-[10px] font-bold transition-all group"
                title="Open in Azure Data Explorer"
            >
                <div className="w-3 h-3 group-hover:scale-110 transition-transform">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" />
                    </svg>
                </div>
                <span className="tracking-widest">UPLINK</span>
            </button>

            <button 
                onClick={handleRun}
              data-tour="holodeck-run"
              disabled={!canRun}
                className={`flex items-center space-x-2 px-4 py-1.5 rounded text-[10px] font-bold transition-all ${
                !canRun 
                    ? 'bg-space-800 text-slate-600 cursor-wait' 
                    : 'bg-nebula-600/20 hover:bg-nebula-600/30 text-nebula-400 border border-nebula-500/30'
                }`}
            >
                {isRunning ? (
                    <>
                        <div className="w-3 h-3 border border-nebula-400/30 border-t-nebula-400 rounded-full animate-spin" />
                        <span className="tracking-widest uppercase">Simulating...</span>
                    </>
                ) : (
                    <>
                  <span className="tracking-widest uppercase">Run Simulation</span>
                  <span className="text-[9px] text-slate-500 font-mono">−{RUN_FUEL_COST} FUEL</span>
                    </>
                )}
            </button>
        </div>
      </div>

          {fuelMessage && (
          <div className="px-4 py-2 border-t border-space-700/50 bg-space-900 text-[10px] font-mono text-slate-500 tracking-wider">
            {fuelMessage}
          </div>
          )}

      {/* Output Console (Vibes Only) */}
      <div className="bg-black/40 border-t border-space-700/50 p-4 font-mono text-[10px] min-h-[80px] relative overflow-hidden">
        {/* Scanline effect */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,118,0.02))] bg-[length:100%_2px,3px_100%]"></div>
        
        <div className="text-slate-600 mb-2 uppercase tracking-[0.3em] flex justify-between items-center">
            <span>Telemetry_Output</span>
            <span className="text-[8px] opacity-50">SEC_LEVEL: 4</span>
        </div>
        
        {output ? (
            <div className="animate-in fade-in duration-500">
                <div className="text-nebula-400 mb-3 flex items-center">
                    <span className="mr-2">{'>>'}</span> {output}
                </div>
                <div className="grid grid-cols-4 gap-4 text-slate-500 opacity-80">
                    <div className="space-y-1">
                        <div className="text-[8px] uppercase text-slate-700">Timestamp</div>
                        {telemetryRows.slice(0, 6).map((r, idx) => (
                          <div key={`ts-${idx}`} className="truncate">{r.timestamp}</div>
                        ))}
                    </div>
                    <div className="space-y-1">
                        <div className="text-[8px] uppercase text-slate-700">Event_ID</div>
                        {telemetryRows.slice(0, 6).map((r, idx) => (
                          <div key={`eid-${idx}`}>{r.eventId}</div>
                        ))}
                    </div>
                    <div className="space-y-1">
                        <div className="text-[8px] uppercase text-slate-700">Source</div>
                        {telemetryRows.slice(0, 6).map((r, idx) => (
                          <div key={`src-${idx}`} className="truncate">{r.source}</div>
                        ))}
                    </div>
                    <div className="space-y-1">
                        <div className="text-[8px] uppercase text-slate-700">Status</div>
                        {telemetryRows.slice(0, 6).map((r, idx) => (
                          <div key={`st-${idx}`} className={statusColor(r.status)}>
                            {r.status}
                          </div>
                        ))}
                    </div>
                </div>

                {telemetryRows.length > 6 && (
                  <div className="mt-3 text-[8px] uppercase tracking-[0.3em] text-slate-700">
                    Showing 6/{telemetryRows.length} records
                  </div>
                )}
            </div>
        ) : (
            <div className="text-slate-700 italic flex items-center">
                <span className="mr-2">{'>>'}</span> 
                <span className="animate-pulse">Awaiting tactical input...</span>
            </div>
        )}

        {stardustAwarded && (
            <div className="mt-4 flex items-center text-stardust/60 text-[9px] tracking-widest animate-in slide-in-from-left duration-700">
                <div className="w-2.5 h-2.5 mr-2 text-stardust/60">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                </div>
                <span>+5 STARDUST_SYNC_COMPLETE</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default Holodeck;

