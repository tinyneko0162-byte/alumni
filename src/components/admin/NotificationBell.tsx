"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

export type NotificationItem = { label: string; note: string; count: number; href: string };

/** Bell in the admin top bar. Opens a small list of work queues that need attention. */
export function NotificationBell({ items }: { items: NotificationItem[] }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const total = items.reduce((s, i) => s + i.count, 0);

  // close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-label={total > 0 ? `การแจ้งเตือน ${total} รายการ` : "การแจ้งเตือน"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative flex size-9 items-center justify-center rounded-full transition hover:bg-admin-head"
      >
        <Icon name="a-bell" size={19} />
        {total > 0 && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-brand" />}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 flex w-[300px] max-w-[calc(100vw-2rem)] flex-col gap-1 rounded-xl border border-admin-line bg-white p-2 shadow-[0_10px_30px_rgba(27,33,64,0.15)]">
          <p className="px-3 pt-2 pb-1 text-[12px] font-semibold leading-[1.55] text-admin-ink">คิวงานที่ต้องติดตาม</p>
          {items.length === 0 && <p className="px-3 py-4 text-[12px] text-admin-muted">ไม่มีรายการค้าง</p>}
          {items.map((i) => (
            <Link
              key={i.href + i.label}
              href={i.href}
              onClick={() => setOpen(false)}
              className="flex items-start justify-between gap-3 rounded-lg px-3 py-2.5 leading-[1.55] transition hover:bg-admin-head"
            >
              <span className="flex flex-col">
                <span className="text-[12px] font-medium text-admin-ink">{i.label}</span>
                <span className="text-[11px] text-admin-muted">{i.note}</span>
              </span>
              <span className="font-latin text-[16px] font-semibold text-admin-warn">{i.count}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
