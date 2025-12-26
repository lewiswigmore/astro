import { useEffect } from 'react';
import Icon from './Icon';

type LoreModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: string;
  story: string;
};

const splitParagraphs = (text: string) =>
  text
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);

const LoreModal = ({ isOpen, onClose, title, subtitle, icon, story }: LoreModalProps) => {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const paragraphs = splitParagraphs(story);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        // Close only when clicking the overlay, not the dialog itself
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-space-900 border border-nebula-500/50 rounded-xl max-w-xl w-full shadow-2xl shadow-nebula-500/20 relative overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-nebula-500 to-transparent"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-nebula-500/20 blur-3xl rounded-full"></div>

        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-12 h-12 rounded-full bg-stardust/10 border border-stardust/30 flex items-center justify-center flex-shrink-0 text-2xl">
                {icon === 'stardust' ? (
                  <Icon name="stardust" className="w-6 h-6 text-stardust" />
                ) : (
                  icon || '🏆'
                )}
              </div>
              <div className="min-w-0">
                <div className="text-white text-xl sm:text-2xl font-black tracking-tight truncate">
                  {title}
                </div>
                {subtitle ? (
                  <div className="text-xs font-mono text-slate-400 uppercase tracking-widest mt-1">
                    {subtitle}
                  </div>
                ) : null}
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg border border-space-700 bg-space-800 px-3 py-2 text-slate-300 hover:text-white hover:border-slate-500 hover:bg-space-700 transition-colors font-mono text-xs"
            >
              CLOSE
            </button>
          </div>

          <div className="mt-6 space-y-4 text-slate-200 leading-relaxed">
            {paragraphs.map((p, idx) => (
              <p key={idx} className="text-sm sm:text-base">
                {p}
              </p>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-space-700 flex items-center justify-between">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              Patch Archive // Lore Channel
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              Press ESC to close
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoreModal;
