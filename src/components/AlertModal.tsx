import { useEffect } from 'react';

type AlertModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  buttonText?: string;
  variant?: 'danger' | 'default';
  onClose: () => void;
};

const splitLines = (text: string) =>
  text
    .split(/\n+/g)
    .map((line) => line.trim())
    .filter(Boolean);

const AlertModal = ({
  isOpen,
  title,
  message,
  buttonText = 'OK',
  variant = 'default',
  onClose,
}: AlertModalProps) => {
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

  const lines = splitLines(message);
  const isDanger = variant === 'danger';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-space-900 border rounded-xl max-w-md w-full shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200 ${
          isDanger ? 'border-red-500/40 shadow-red-500/10' : 'border-space-700 shadow-nebula-500/10'
        }`}
      >
        <div
          className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${
            isDanger ? 'via-red-500' : 'via-nebula-500'
          } to-transparent`}
        ></div>
        <div
          className={`absolute -top-24 -right-24 w-48 h-48 blur-3xl rounded-full ${
            isDanger ? 'bg-red-500/15' : 'bg-nebula-500/15'
          }`}
        ></div>

        <div className="relative z-10 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-white text-lg font-black tracking-tight">{title}</div>
              <div className="mt-1 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                {isDanger ? 'Alert' : 'Notice'}
              </div>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white" aria-label="Close">
              ✕
            </button>
          </div>

          <div className="mt-4 space-y-2 text-sm text-slate-200 leading-relaxed">
            {lines.map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`px-3 py-2 rounded border text-xs font-mono font-bold tracking-widest transition-colors ${
                isDanger
                  ? 'border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/15'
                  : 'border-space-700 bg-space-800/50 text-slate-200 hover:border-slate-500'
              }`}
            >
              {buttonText}
            </button>
          </div>

          <div className="mt-4 text-[10px] font-mono text-slate-600">Press ESC to close.</div>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
