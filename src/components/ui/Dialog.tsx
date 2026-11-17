"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/format";

/**
 * Modal built on the native <dialog>: Esc closes it, focus stays inside,
 * clicking the dark backdrop closes it. Children are only mounted while open.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** width / extra classes for the panel */
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // a click on the backdrop lands on the <dialog> element itself
        if (e.target === ref.current) onClose();
      }}
      className={cx(
        "m-auto max-h-[88dvh] w-[calc(100%-2rem)] max-w-[420px] overflow-hidden rounded-2xl border border-line-slate bg-white p-0 text-ink shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop:bg-black/50",
        className,
      )}
    >
      {open && (
        <div className="flex max-h-[88dvh] flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-line-slate px-5 py-4">
            <h2 className="text-[16px] font-semibold leading-[1.55] text-ink-slate">{title}</h2>
            <button type="button" onClick={onClose} aria-label="ปิด" className="flex size-8 items-center justify-center rounded-full transition hover:bg-surface-muted">
              <Icon name="a-x" size={18} />
            </button>
          </div>
          <div className="overflow-y-auto p-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}
