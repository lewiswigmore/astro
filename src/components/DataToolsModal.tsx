import React, { useMemo, useRef, useState, useEffect } from 'react';
import Icon from './Icon';
import type { PilotProfile } from '../types/profile';
import { migrateProfile } from '../utils/profileUtils';

interface DataToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function toDateStamp(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function safeJsonParse(text: string): unknown {
  return JSON.parse(text);
}

function ensureProfileShape(imported: any): PilotProfile {
  // If the import looks like an older/partial profile, migrate it.
  if (!imported || typeof imported !== 'object') {
    return migrateProfile({ callsign: 'GUEST', prefix: 'PILOT', stardust: 0, fuel: 100 });
  }

  const hasCore = typeof imported.callsign === 'string' && typeof imported.stardust === 'number';
  const hasModern = typeof imported.level === 'number' && typeof imported.experiencePoints === 'number';

  if (!hasCore || !hasModern) {
    return migrateProfile(imported);
  }

  // Minimal normalization for arrays/fields frequently used by UI.
  const normalized: PilotProfile = {
    ...imported,
    completedMissions: Array.isArray(imported.completedMissions) ? imported.completedMissions : [],
    completedSubMissions: Array.isArray(imported.completedSubMissions) ? imported.completedSubMissions : [],
    bookmarks: Array.isArray(imported.bookmarks) ? imported.bookmarks : [],
    activityDates: Array.isArray(imported.activityDates) ? imported.activityDates : [],
    achievements: Array.isArray(imported.achievements) ? imported.achievements : [],
  };

  return normalized;
}

const DataToolsModal = ({ isOpen, onClose }: DataToolsModalProps) => {
  const [message, setMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isResetAllConfirmOpen, setIsResetAllConfirmOpen] = useState(false);
  const [resetCallsignInput, setResetCallsignInput] = useState('');
  const [currentCallsign, setCurrentCallsign] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const filename = useMemo(() => `astro_pilot_profile_${toDateStamp()}.json`, []);
  const importExportEnabled = true;

  useEffect(() => {
    const handleTriggerReset = () => {
      if (isOpen) {
        handleResetAll();
      }
    };
    
    window.addEventListener('astro:trigger-reset-all', handleTriggerReset);
    return () => window.removeEventListener('astro:trigger-reset-all', handleTriggerReset);
  }, [isOpen]);

  const persistProfile = (profile: PilotProfile | null) => {
    if (profile) {
      localStorage.setItem('astro_pilot_profile', JSON.stringify(profile));
    } else {
      localStorage.removeItem('astro_pilot_profile');
    }

    // Also reset navigation-based autosync state.
    try {
      sessionStorage.removeItem('astro:lastSlug');
    } catch {
      // ignore
    }

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('astro:profile-update', { detail: profile }));
  };

  const handleResetAll = () => {
    const stored = localStorage.getItem('astro_pilot_profile');
    if (stored) {
      try {
        const profile = JSON.parse(stored);
        setCurrentCallsign(profile.callsign || '');
      } catch (e) {
        setCurrentCallsign('');
      }
    } else {
      setCurrentCallsign('');
    }
    setResetCallsignInput('');
    setIsResetAllConfirmOpen(true);
    setIsResetting(false);
    setCountdown(3);
  };

  useEffect(() => {
    if (isResetting && countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isResetting && countdown === 0) {
      performWipe();
    }
  }, [isResetting, countdown]);

  const performWipe = () => {
    setIsResetAllConfirmOpen(false);

    // Clear all storage to ensure a fresh start
    localStorage.clear();
    sessionStorage.clear();

    // Close the modal stack, then hard-navigate to start.
    try {
      onClose();
    } catch {
      // ignore
    }

    // Use the configured base URL so this works when deployed under a sub-path.
    const baseUrl = (import.meta as any).env?.BASE_URL || '/';
    window.location.assign(baseUrl);
  };

  const confirmResetAll = () => {
    if (currentCallsign && resetCallsignInput.toUpperCase() !== currentCallsign.toUpperCase()) return;
    setIsResetting(true);
  };

  const handleExport = () => {
    if (!importExportEnabled) {
      setMessage('Export is coming soon.');
      return;
    }
    const stored = localStorage.getItem('astro_pilot_profile');
    if (!stored) {
      setMessage('No profile found to export.');
      return;
    }

    const blob = new Blob([stored], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
    setMessage(`Exported as ${filename}.`);
  };

  const handleImportClick = () => {
    if (!importExportEnabled) {
      setMessage('Import is coming soon.');
      return;
    }
    setMessage(null);
    fileInputRef.current?.click();
  };

  const handleImportFile = async (file: File) => {
    if (!importExportEnabled) {
      setMessage('Import is coming soon.');
      return;
    }
    setIsImporting(true);
    try {
      const text = await file.text();
      const parsed = safeJsonParse(text);
      const profile = ensureProfileShape(parsed);

      persistProfile(profile);
      setMessage('Import complete.');
    } catch (err: any) {
      setMessage(`Import failed: ${err?.message || 'Invalid JSON'}`);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      {isResetAllConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-space-900 border border-red-500/40 rounded-xl max-w-md w-full shadow-2xl shadow-red-500/10 relative overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
            <div className="absolute -top-24 -right-24 w-48 h-48 blur-3xl rounded-full bg-red-500/15"></div>

            <div className="relative z-10 p-6">
              {isResetting ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="text-6xl font-black text-red-500 animate-pulse font-mono">
                    {countdown}
                  </div>
                  <div className="mt-4 text-sm font-mono text-red-300 uppercase tracking-widest">
                    Resetting System...
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetting(false);
                      setCountdown(3);
                    }}
                    className="mt-6 px-4 py-2 rounded border border-red-500/40 bg-red-500/10 text-red-200 text-xs font-mono font-bold tracking-widest hover:bg-red-500/20 transition-colors"
                  >
                    ABORT SEQUENCE
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-white text-lg font-black tracking-tight">
                        Reset all local data?
                      </div>
                      <div className="mt-1 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                        Warning // Destructive Action
                      </div>
                    </div>
                    <button
                      onClick={() => setIsResetAllConfirmOpen(false)}
                      className="text-slate-500 hover:text-white"
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-200 leading-relaxed">
                    <p>This will wipe your local profile on this device.</p>
                    <p>Includes: progress, bookmarks, fuel, stardust, achievements, and unlocks.</p>
                    <p>This cannot be undone.</p>
                  </div>

                  {currentCallsign && (
                    <div className="mt-4">
                      <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-widest">
                        Type "{currentCallsign}" to confirm
                      </label>
                      <input
                        type="text"
                        value={resetCallsignInput}
                        onChange={(e) => setResetCallsignInput(e.target.value)}
                        className="w-full bg-space-800 border border-space-700 rounded px-3 py-2 text-white font-mono focus:border-red-500 focus:outline-none uppercase"
                        placeholder={currentCallsign}
                        autoFocus
                      />
                    </div>
                  )}

                  <div className="mt-6 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsResetAllConfirmOpen(false)}
                      className="px-3 py-2 rounded border border-space-700 bg-space-900/40 text-slate-200 text-xs font-mono font-bold tracking-widest hover:border-slate-500"
                    >
                      CANCEL
                    </button>
                    <button
                      type="button"
                      onClick={confirmResetAll}
                      disabled={currentCallsign ? resetCallsignInput.toUpperCase() !== currentCallsign.toUpperCase() : false}
                      className={`px-3 py-2 rounded border text-xs font-mono font-bold tracking-widest transition-colors ${
                        (currentCallsign ? resetCallsignInput.toUpperCase() === currentCallsign.toUpperCase() : true)
                          ? 'border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/15'
                          : 'border-space-800 bg-space-900/20 text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      RESET ALL
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="bg-space-900 border border-space-700 rounded-xl max-w-md w-full shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white font-mono flex items-center">
              <Icon name="monitor" className="w-5 h-5 mr-2 text-slate-400" />
              DATA TOOLS
            </h2>
            <button onClick={onClose} className="text-slate-500 hover:text-white" aria-label="Close">
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-space-700 bg-space-800/50 p-4">
              <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">Reset</div>
              <div className="text-[10px] font-mono text-slate-500 mt-1">
                Wipes your local profile on this device.
              </div>

              <button
                type="button"
                onClick={handleResetAll}
                className="mt-3 w-full px-3 py-3 rounded border border-red-500/40 bg-red-500/10 text-red-300 text-xs font-mono font-bold tracking-widest hover:bg-red-500/15"
              >
                RESET ALL
              </button>
            </div>

            <div className="rounded-lg border border-space-700 bg-space-800/50 p-4">
              <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">Backup & Restore</div>
              <div className="text-[10px] font-mono text-slate-500 mt-1">
                Save your progress to a file or restore from a backup.
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={!importExportEnabled}
                  title={importExportEnabled ? 'Export profile JSON' : 'Coming soon'}
                  className={`flex-1 px-3 py-2 rounded border text-xs font-mono font-bold tracking-widest transition-colors ${
                    importExportEnabled
                      ? 'border-space-700 bg-space-900/40 text-slate-200 hover:border-slate-500'
                      : 'border-space-800 bg-space-900/20 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  EXPORT
                </button>
                <button
                  type="button"
                  onClick={handleImportClick}
                  disabled={!importExportEnabled || isImporting}
                  title={importExportEnabled ? 'Import profile JSON' : 'Coming soon'}
                  className={`flex-1 px-3 py-2 rounded border text-xs font-mono font-bold tracking-widest transition-colors ${
                    importExportEnabled
                      ? 'border-space-700 bg-space-900/40 text-slate-200 hover:border-slate-500'
                      : 'border-space-800 bg-space-900/20 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {isImporting ? 'IMPORTING…' : 'IMPORT'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleImportFile(file);
                  }}
                />
              </div>
            </div>

            {message && <div className="text-[10px] font-mono text-slate-400">{message}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataToolsModal;
