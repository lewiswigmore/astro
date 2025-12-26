import { useEffect, useMemo, useState } from 'react';

export type TourStep = {
  id: string;
  selector: string;
  title: string;
  body: string;
  /** If provided, the step is considered complete when localStorage[key] === value (default 'true'). */
  completeWhenStorageKey?: string;
  completeWhenStorageValue?: string;
  /** If true, clicking NEXT/DONE marks completeWhenStorageKey as completeWhenStorageValue (default 'true'). */
  markCompleteOnNext?: boolean;
};

type GuidedTourProps = {
  isOpen: boolean;
  steps: TourStep[];
  onClose: () => void;
  onComplete?: () => void;
  storageNamespace?: string;
};

type Rect = { top: number; left: number; width: number; height: number };

const readStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
};

const GuidedTour = ({ isOpen, steps, onClose, onComplete }: GuidedTourProps) => {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [resolvedIndex, setResolvedIndex] = useState(0);
  const [tick, setTick] = useState(0);

  const activeStep = useMemo(() => steps[resolvedIndex] ?? null, [steps, resolvedIndex]);

  useEffect(() => {
    if (!isOpen) return;
    // Reset to first step on open.
    setIndex(0);
    setResolvedIndex(0);
    setTick((t) => t + 1);
  }, [isOpen]);

  // Keep a small poller to detect completion and element availability.
  useEffect(() => {
    if (!isOpen) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 250);
    return () => window.clearInterval(id);
  }, [isOpen]);

  // Resolve index by skipping already-completed steps.
  useEffect(() => {
    if (!isOpen) return;

    let next = index;
    while (next < steps.length) {
      const step = steps[next];
      if (step?.completeWhenStorageKey) {
        const desired = step.completeWhenStorageValue ?? 'true';
        const value = readStorage(step.completeWhenStorageKey);
        if (value === desired) {
          next += 1;
          continue;
        }
      }
      break;
    }

    if (next !== index) setIndex(next);
    setResolvedIndex(next);

    if (next >= steps.length) {
      onComplete?.();
      onClose();
    }
  }, [isOpen, index, steps, tick, onClose, onComplete]);

  // Compute highlight rect.
  useEffect(() => {
    if (!isOpen) return;
    if (!activeStep) {
      setRect(null);
      return;
    }

    const el = document.querySelector(activeStep.selector) as HTMLElement | null;
    if (!el) {
      setRect(null);
      return;
    }

    const update = () => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    update();

    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isOpen, activeStep, tick]);

  // Ensure the active step target is visible by auto-scrolling it into view.
  // This avoids “off-screen” highlights, especially inside overflow containers.
  useEffect(() => {
    if (!isOpen) return;
    if (!activeStep) return;

    const el = document.querySelector(activeStep.selector) as HTMLElement | null;
    if (!el) return;

    const margin = 140;
    const r = el.getBoundingClientRect();
    const needsScroll =
      r.top < margin ||
      r.left < 12 ||
      r.bottom > window.innerHeight - margin ||
      r.right > window.innerWidth - 12;

    if (!needsScroll) return;

    // Delay slightly so Astro/React layout has settled.
    const t = window.setTimeout(() => {
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      } catch {
        // ignore
      }
    }, 50);

    return () => window.clearTimeout(t);
  }, [isOpen, activeStep?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInteractiveTarget = (() => {
        if (!target) return false;
        if (target.isContentEditable) return true;

        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
        if (target.getAttribute('role') === 'textbox') return true;

        // Don't hijack Enter on focused buttons/links inside the tooltip.
        if (target.closest('button, a')) return true;

        return false;
      })();

      const advance = () => {
        if (activeStep?.markCompleteOnNext && activeStep.completeWhenStorageKey) {
          writeStorage(activeStep.completeWhenStorageKey, activeStep.completeWhenStorageValue ?? 'true');
        }

        setIndex((i) => (resolvedIndex >= steps.length - 1 ? steps.length : Math.min(steps.length - 1, i + 1)));
      };

      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') {
        advance();
      }
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));

      if (e.key === 'Enter' && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
        if (isInteractiveTarget) return;
        e.preventDefault();
        advance();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose, steps.length, resolvedIndex, activeStep]);

  if (!isOpen || !activeStep) return null;

  const isLastStep = resolvedIndex >= steps.length - 1;

  const pad = 10;
  const highlight = rect
    ? {
        top: Math.max(8, rect.top - pad),
        left: Math.max(8, rect.left - pad),
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  const tooltipStyle: React.CSSProperties = (() => {
    if (!highlight) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    const preferredTop = highlight.top + highlight.height + 12;
    const fitsBelow = preferredTop + 220 < viewportH;

    const top = fitsBelow ? preferredTop : Math.max(12, highlight.top - 220);
    const left = Math.min(Math.max(12, highlight.left), Math.max(12, viewportW - 420));

    return { top, left };
  })();

  return (
    <div className="fixed inset-0 z-[80]">
      {/* Dim overlay (spotlight cutout) - allow clicks through except tooltip */}
      {highlight ? (
        <>
          {/* Top */}
          <div
            className="fixed left-0 right-0 top-0 pointer-events-none bg-space-black/50"
            style={{ height: highlight.top }}
          />
          {/* Bottom */}
          <div
            className="fixed left-0 right-0 pointer-events-none bg-space-black/50"
            style={{ top: highlight.top + highlight.height, bottom: 0 }}
          />
          {/* Left */}
          <div
            className="fixed left-0 pointer-events-none bg-space-black/50"
            style={{ top: highlight.top, width: highlight.left, height: highlight.height }}
          />
          {/* Right */}
          <div
            className="fixed right-0 pointer-events-none bg-space-black/50"
            style={{
              top: highlight.top,
              left: highlight.left + highlight.width,
              height: highlight.height,
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-space-black/55 pointer-events-none" />
      )}

      {/* Highlight */}
      {highlight && (
        <>
          <div
            className="fixed rounded-xl border border-nebula-500/60 shadow-[0_0_18px_rgba(139,92,246,0.25)] pointer-events-none"
            style={{ top: highlight.top, left: highlight.left, width: highlight.width, height: highlight.height }}
          />
          <div
            className="fixed rounded-xl border border-stardust/50 pointer-events-none opacity-40"
            style={{ top: highlight.top, left: highlight.left, width: highlight.width, height: highlight.height }}
          />
        </>
      )}

      {/* Tooltip */}
      <div
        className="fixed pointer-events-auto max-w-[400px] w-[min(400px,calc(100vw-24px))] bg-space-900 border border-space-700 rounded-xl shadow-2xl overflow-hidden"
        style={tooltipStyle}
      >
        <div className="px-4 py-3 border-b border-space-700 bg-space-800/50">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            Guidance // {resolvedIndex + 1} of {steps.length}
          </div>
          <div className="text-white font-black mt-1">{activeStep.title}</div>
        </div>
        <div className="px-4 py-3 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{activeStep.body}</div>
        <div className="px-4 py-3 border-t border-space-700 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded border border-space-700 bg-space-900/40 text-slate-200 text-xs font-mono font-bold tracking-widest hover:border-slate-500"
          >
            SKIP
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={resolvedIndex === 0}
              className={`px-3 py-2 rounded border text-xs font-mono font-bold tracking-widest transition-colors ${
                resolvedIndex === 0
                  ? 'border-space-800 bg-space-900/20 text-slate-600 cursor-not-allowed'
                  : 'border-space-700 bg-space-900/40 text-slate-200 hover:border-slate-500'
              }`}
            >
              BACK
            </button>
            <button
              type="button"
              onClick={() =>
                setIndex((i) => {
                  if (activeStep?.markCompleteOnNext && activeStep.completeWhenStorageKey) {
                    writeStorage(activeStep.completeWhenStorageKey, activeStep.completeWhenStorageValue ?? 'true');
                  }

                  return isLastStep ? steps.length : Math.min(steps.length - 1, i + 1);
                })
              }
              className={`px-3 py-2 rounded border text-xs font-mono font-bold tracking-widest transition-colors ${
                isLastStep
                  ? 'border-stardust/50 bg-stardust/10 text-stardust hover:bg-stardust/15'
                  : 'border-nebula-500/40 bg-nebula-500/10 text-nebula-200 hover:bg-nebula-500/15'
              }`}
            >
              {isLastStep ? 'DONE' : 'NEXT'}
            </button>
          </div>
        </div>
        <div className="px-4 pb-3 text-[10px] font-mono text-slate-600">
          Tip: press Enter for NEXT (or click the highlighted control).
        </div>
      </div>
    </div>
  );
};

export default GuidedTour;
