import React, { useEffect, useMemo, useState } from 'react';
import Icon from './Icon';
import DataToolsModal from './DataToolsModal';
import { applyFuelBreakRefill, applyPassiveFuelRegen } from '../utils/profileUtils';
import ConfirmModal from './ConfirmModal';
import AlertModal from './AlertModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PREFIX_OPTIONS = [
  'PILOT',
  'COMMANDER',
  'CADET',
  'SPECIALIST',
  'ANALYST',
  'OPERATOR'
];

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const [callsign, setCallsign] = useState('');
  const [prefix, setPrefix] = useState('PILOT');
  const [saved, setSaved] = useState(false);
  const [fuel, setFuel] = useState(0);
  const [stardust, setStardust] = useState(0);
  const [refuelMessage, setRefuelMessage] = useState<string | null>(null);
  const [breakMessage, setBreakMessage] = useState<string | null>(null);
  const [breakReadyAt, setBreakReadyAt] = useState<string | null>(null);
  const [breakNowTick, setBreakNowTick] = useState(0);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [isDataToolsOpen, setIsDataToolsOpen] = useState(false);
  const [stardustAlert, setStardustAlert] = useState<null | { title: string; message: string }>(null);
  const [confirmReset, setConfirmReset] = useState<null | {
    title: string;
    message: string;
    action: 'progress' | 'bookmarks' | 'rewards';
  }>(null);

  const BREAK_COOLDOWN_MS = 10 * 60 * 1000;
  const BREAK_GAIN = 25;
  const MAX_FUEL = 100;

  const formatRemaining = (ms: number): string => {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  const remainingMs = useMemo(() => {
    if (!breakReadyAt) return 0;
    const ready = new Date(breakReadyAt).getTime();
    if (!Number.isFinite(ready)) return 0;
    return Math.max(0, ready - Date.now());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakReadyAt, breakNowTick]);

  const isBreakPending = !!breakReadyAt && remainingMs > 0;
  const isBreakReady = !!breakReadyAt && remainingMs === 0;

  useEffect(() => {
    if (isOpen) {
      const storedProfile = localStorage.getItem('astro_pilot_profile');
      if (storedProfile) {
        let profile = JSON.parse(storedProfile);

        // Apply passive fuel regeneration first
        const regenResult = applyPassiveFuelRegen(profile);
        if (regenResult.changed) {
          profile = regenResult.profile;
        }

        // Auto-claim any pending break refill when opening settings.
        const claimed = applyFuelBreakRefill(profile);
        if (claimed.changed || regenResult.changed) {
          profile = claimed.profile;
          persistProfile(profile);
        }

        setCallsign(profile.callsign || '');
        setPrefix(profile.prefix || 'PILOT');
        setFuel(typeof profile.fuel === 'number' ? profile.fuel : 0);
        setStardust(typeof profile.stardust === 'number' ? profile.stardust : 0);
        setBreakReadyAt(typeof profile.fuelBreakReadyAt === 'string' ? profile.fuelBreakReadyAt : null);
      }
      setSaved(false);
      setRefuelMessage(null);
      setBreakMessage(null);
      setResetMessage(null);
    }
  }, [isOpen]);

  // Live countdown while the modal is open.
  useEffect(() => {
    if (!isOpen) return;
    if (!breakReadyAt) return;
    const id = window.setInterval(() => setBreakNowTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [isOpen, breakReadyAt]);

  const persistProfile = (profile: any) => {
    localStorage.setItem('astro_pilot_profile', JSON.stringify(profile));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('astro:profile-update', { detail: profile }));
  };

  const handleStartBreak = () => {
    const storedProfile = localStorage.getItem('astro_pilot_profile');
    if (!storedProfile) return;

    const profile = JSON.parse(storedProfile);
    const currentFuel = typeof profile.fuel === 'number' ? profile.fuel : 0;

    if (currentFuel >= MAX_FUEL) {
      setBreakMessage('Fuel tank already full.');
      return;
    }

    const existing = typeof profile.fuelBreakReadyAt === 'string' ? profile.fuelBreakReadyAt : null;
    if (existing) {
      const existingMs = new Date(existing).getTime();
      if (Number.isFinite(existingMs) && existingMs > Date.now()) {
        setBreakReadyAt(existing);
        setBreakMessage(`Break in progress (${formatRemaining(existingMs - Date.now())}).`);
        return;
      }
    }

    const readyAt = new Date(Date.now() + BREAK_COOLDOWN_MS).toISOString();
    profile.fuelBreakReadyAt = readyAt;
    persistProfile(profile);
    setBreakReadyAt(readyAt);
    setBreakMessage(`Break started. Refill ready in ${formatRemaining(BREAK_COOLDOWN_MS)}.`);
  };

  const handleClaimBreak = () => {
    const storedProfile = localStorage.getItem('astro_pilot_profile');
    if (!storedProfile) return;

    let profile = JSON.parse(storedProfile);
    const claimed = applyFuelBreakRefill(profile);
    if (!claimed.changed) {
      setBreakMessage(isBreakPending ? `Refill in ${formatRemaining(remainingMs)}.` : 'No refill available.');
      return;
    }

    profile = claimed.profile;
    persistProfile(profile);
    setFuel(typeof profile.fuel === 'number' ? profile.fuel : 0);
    setBreakReadyAt(null);
    setBreakMessage(`Refilled +${BREAK_GAIN} (break).`);
  };

  const handleRefuel = () => {
    const COST = 25;
    const GAIN = 25;
    const MAX = 100;

    const storedProfile = localStorage.getItem('astro_pilot_profile');
    if (!storedProfile) return;

    const profile = JSON.parse(storedProfile);
    const currentFuel = typeof profile.fuel === 'number' ? profile.fuel : 0;
    const currentStardust = typeof profile.stardust === 'number' ? profile.stardust : 0;

    if (currentFuel >= MAX) {
      setRefuelMessage('Fuel tank already full.');
      return;
    }
    if (currentStardust < COST) {
      setRefuelMessage(null);
      setStardustAlert({
        title: 'Out of Stardust',
        message:
          `You need ${COST} ★ to refuel, but you only have ${currentStardust} ★.\n\nEarn more by completing missions, picking up Stardust rewards, or logging progress in the Research Log.`,
      });
      return;
    }

    profile.stardust = currentStardust - COST;
    profile.experiencePoints = profile.stardust;
    profile.fuel = Math.min(MAX, currentFuel + GAIN);

    persistProfile(profile);

    setFuel(profile.fuel);
    setStardust(profile.stardust);
    setRefuelMessage(`Refueled +${GAIN} (−${COST} ★).`);
  };

  const handleResetProgress = () => {
    const storedProfile = localStorage.getItem('astro_pilot_profile');
    if (!storedProfile) return;

    setConfirmReset({
      title: 'Reset progress?',
      message:
        'This clears completed sectors (Knowledge Sync) and streak/activity.\n\nStardust, fuel, and bookmarks stay.',
      action: 'progress',
    });
  };

  const handleResetBookmarks = () => {
    const storedProfile = localStorage.getItem('astro_pilot_profile');
    if (!storedProfile) return;

    setConfirmReset({
      title: 'Reset bookmarks?',
      message: 'This clears your Research Log bookmarks only.',
      action: 'bookmarks',
    });
  };

  const handleResetRewards = () => {
    const storedProfile = localStorage.getItem('astro_pilot_profile');
    if (!storedProfile) return;

    setConfirmReset({
      title: 'Reset rewards?',
      message:
        'This clears achievements so pickups/sim rewards can be earned again.\n\nProgress, bookmarks, stardust, and fuel stay.',
      action: 'rewards',
    });
  };

  const confirmResetAction = () => {
    if (!confirmReset) return;
    const storedProfile = localStorage.getItem('astro_pilot_profile');
    if (!storedProfile) {
      setConfirmReset(null);
      return;
    }

    const profile = JSON.parse(storedProfile);
    if (confirmReset.action === 'progress') {
      profile.completedMissions = [];
      persistProfile(profile);
      setResetMessage('Progress reset.');
    }
    if (confirmReset.action === 'bookmarks') {
      profile.bookmarks = [];
      persistProfile(profile);
      setResetMessage('Bookmarks cleared.');
    }
    if (confirmReset.action === 'rewards') {
      profile.achievements = [];
      persistProfile(profile);
      setResetMessage('Rewards reset (achievements cleared).');
    }

    setConfirmReset(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    const storedProfile = localStorage.getItem('astro_pilot_profile');
    let profile = storedProfile ? JSON.parse(storedProfile) : { fuel: 100, stardust: 0, rank: 'CADET' };
    
    profile = {
      ...profile,
      callsign: callsign.toUpperCase(),
      prefix: prefix
    };

    localStorage.setItem('astro_pilot_profile', JSON.stringify(profile));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('astro:profile-update', { detail: profile }));
    
    setSaved(true);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <AlertModal
        isOpen={Boolean(stardustAlert)}
        title={stardustAlert?.title ?? ''}
        message={stardustAlert?.message ?? ''}
        buttonText="OK"
        onClose={() => setStardustAlert(null)}
      />
      <ConfirmModal
        isOpen={Boolean(confirmReset)}
        title={confirmReset?.title ?? ''}
        message={confirmReset?.message ?? ''}
        confirmText="CONFIRM"
        cancelText="CANCEL"
        variant="danger"
        onConfirm={confirmResetAction}
        onCancel={() => setConfirmReset(null)}
      />
      <div className="bg-space-900 border border-space-700 rounded-xl max-w-md w-full shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white font-mono flex items-center">
              <Icon name="monitor" className="w-5 h-5 mr-2 text-slate-400" />
              PROFILE SETTINGS
            </h2>
            <button onClick={onClose} className="text-slate-500 hover:text-white">
              ✕
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="rounded-lg border border-space-700 bg-space-800/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">Fuel</div>
                <div className="text-xs font-mono text-slate-300">{fuel}%</div>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>Fuel powers rewards + simulations.</span>
                <span>Stardust: {stardust} ★</span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleRefuel}
                  className="px-3 py-2 rounded border border-stardust/30 bg-stardust/10 text-stardust text-xs font-mono font-bold tracking-widest hover:bg-stardust/15"
                >
                  REFUEL (−25 ★ / +25)
                </button>

                <button
                  type="button"
                  onClick={isBreakReady ? handleClaimBreak : handleStartBreak}
                  disabled={isBreakPending}
                  title={isBreakPending ? 'Break in progress' : isBreakReady ? 'Claim refill' : 'Start a 10-minute break'}
                  className={`px-3 py-2 rounded border text-xs font-mono font-bold tracking-widest transition-colors ${
                    isBreakPending
                      ? 'border-space-700 bg-space-900/40 text-slate-600 cursor-not-allowed'
                      : isBreakReady
                      ? 'border-green-500/40 bg-green-500/10 text-green-300 hover:bg-green-500/15'
                      : 'border-space-700 bg-space-900/40 text-slate-200 hover:border-slate-500'
                  }`}
                >
                  {isBreakPending
                    ? `BREAK ${formatRemaining(remainingMs)}`
                    : isBreakReady
                    ? `CLAIM +${BREAK_GAIN}`
                    : `TAKE A BREAK (+${BREAK_GAIN} / 10 MIN)`}
                </button>

                {refuelMessage && (
                  <div className="text-[10px] font-mono text-slate-400 text-right">{refuelMessage}</div>
                )}
              </div>

              {breakMessage && (
                <div className="mt-2 text-[10px] font-mono text-slate-400">{breakMessage}</div>
              )}
            </div>

            <div className="rounded-lg border border-space-700 bg-space-800/50 p-4">
              <div className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">Reset</div>
              <div className="text-[10px] font-mono text-slate-500">Use if progress was marked too early.</div>

              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <button
                  type="button"
                  onClick={handleResetProgress}
                  className="px-3 py-2 rounded border border-space-700 bg-space-900/40 text-slate-200 text-xs font-mono font-bold tracking-widest hover:border-slate-500"
                >
                  RESET PROGRESS
                </button>
                <button
                  type="button"
                  onClick={handleResetBookmarks}
                  className="px-3 py-2 rounded border border-space-700 bg-space-900/40 text-slate-200 text-xs font-mono font-bold tracking-widest hover:border-slate-500"
                >
                  RESET BOOKMARKS
                </button>
                <button
                  type="button"
                  onClick={handleResetRewards}
                  className="px-3 py-2 rounded border border-space-700 bg-space-900/40 text-slate-200 text-xs font-mono font-bold tracking-widest hover:border-slate-500"
                >
                  RESET REWARDS
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Open data tools modal and trigger reset all from there
                    const storedProfile = localStorage.getItem('astro_pilot_profile');
                    if (!storedProfile) return;
                    let callsign = '';
                    try {
                      const profile = JSON.parse(storedProfile);
                      callsign = profile.callsign || '';
                    } catch (e) {
                      callsign = '';
                    }
                    
                    // Create a temporary modal trigger by opening DataTools then triggering reset
                    setIsDataToolsOpen(true);
                    setTimeout(() => {
                      const event = new CustomEvent('astro:trigger-reset-all');
                      window.dispatchEvent(event);
                    }, 100);
                  }}
                  className="px-3 py-2 rounded border border-red-500/40 bg-red-500/10 text-red-300 text-xs font-mono font-bold tracking-widest hover:bg-red-500/15"
                >
                  RESET ALL
                </button>

                {resetMessage && (
                  <div className="text-[10px] font-mono text-slate-400 ml-auto text-right">{resetMessage}</div>
                )}
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setIsDataToolsOpen(true)}
                  className="w-full px-3 py-2 rounded border border-space-700 bg-space-900/40 text-slate-200 text-xs font-mono font-bold tracking-widest hover:border-slate-500"
                >
                  OPEN DATA TOOLS
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-widest">
                Designation (Prefix)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PREFIX_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setPrefix(opt)}
                    className={`px-3 py-2 text-xs font-mono font-bold rounded border transition-all ${
                      prefix === opt
                        ? 'bg-nebula-500/20 border-nebula-500 text-nebula-400'
                        : 'bg-space-800 border-space-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-widest">
                Callsign
              </label>
              <input
                type="text"
                value={callsign}
                onChange={(e) => setCallsign(e.target.value)}
                className="w-full bg-space-800 border border-space-700 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-nebula-500 focus:ring-1 focus:ring-nebula-500 transition-all uppercase"
                placeholder="ENTER CALLSIGN"
                maxLength={12}
                required
              />
            </div>

            <button
              type="submit"
              className={`w-full py-3 px-4 rounded-lg font-bold transition-all flex items-center justify-center ${
                saved
                  ? 'bg-green-500 text-white'
                  : 'bg-thrust-600 hover:bg-thrust-500 text-white'
              }`}
            >
              {saved ? (
                <>
                  <span className="mr-2">✓</span> PROFILE UPDATED
                </>
              ) : (
                'SAVE CHANGES'
              )}
            </button>
          </form>
        </div>
      </div>

      <DataToolsModal isOpen={isDataToolsOpen} onClose={() => setIsDataToolsOpen(false)} />
    </div>
  );
};

export default SettingsModal;
