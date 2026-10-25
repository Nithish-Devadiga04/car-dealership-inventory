import { ReactNode, useEffect } from 'react';
import { XIcon } from './Icons';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Accessible dialog: closes on Escape / backdrop click, locks background scroll. */
export function Modal({ title, onClose, children }: ModalProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md animate-pop-in rounded-2xl bg-white p-6 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="btn-ghost !p-2" aria-label="Close dialog">
            <XIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
