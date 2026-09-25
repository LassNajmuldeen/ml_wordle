"use client";

import { useEffect, useRef } from "react";

/** Native <dialog>: real focus trap, real Esc, no portal, no library. */
export function Dialog({
  open, onClose, title, label, className, children,
}: {
  open: boolean;
  onClose: () => void;
  /** visible heading; without one, `label` names the dialog for screen readers */
  title?: string;
  label?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={className}
      aria-label={title ? undefined : label}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="dlg-head">
        {title ? <h2>{title}</h2> : <span />}
        <button className="icon" onClick={onClose} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="dlg-body">{children}</div>
    </dialog>
  );
}
