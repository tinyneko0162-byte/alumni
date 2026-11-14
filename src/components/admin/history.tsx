import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/format";

/** Shared pieces of the "history" screens (Token top-up history, Store sales history). */

export function Stat({ label, value, note, dark }: { label: string; value: string; note: string; dark?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-admin-line bg-white p-5 leading-[1.55]">
      <p className="text-[12px] text-admin-muted">{label}</p>
      <p className={cx("text-[28px] font-semibold", dark ? "text-black" : "text-admin-ink")}>{value}</p>
      <p className="text-[11px] text-admin-muted">{note}</p>
    </div>
  );
}

export function FilterField({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <span className="text-[11px] font-semibold leading-[1.55] text-admin-ink">{label}</span>
      <label className="flex h-[42px] items-center gap-2 rounded-lg border border-admin-line bg-white px-3 text-admin-ink focus-within:border-brand-soft">
        {children}
      </label>
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  className = "w-[150px]",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
  className?: string;
}) {
  return (
    <FilterField label={label} className={className}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 appearance-none bg-transparent text-[12px] outline-none">
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <Icon name="a-chevron-down" size={14} />
    </FilterField>
  );
}

export function Detail({ label, value, valueClass = "text-admin-ink" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 leading-[1.55]">
      <p className="text-[12px] text-admin-muted">{label}</p>
      <p className={cx("text-[13px] font-medium", valueClass)}>{value}</p>
    </div>
  );
}

/** Before → change → after balance strip. */
export function LedgerStrip({
  items,
  className,
  labelClass = "text-[#32353d]",
}: {
  items: { label: string; value: string }[];
  className: string;
  labelClass?: string;
}) {
  return (
    <div className={cx("flex gap-4 rounded-lg p-4 leading-[1.55]", className)}>
      {items.map((it) => (
        <div key={it.label} className="flex flex-1 flex-col gap-1">
          <p className={cx("text-[11px]", labelClass)}>{it.label}</p>
          <p className="text-[23px] font-semibold text-black">{it.value}</p>
          <p className={cx("text-[10px]", labelClass)}>Token</p>
        </div>
      ))}
    </div>
  );
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = "﻿" + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename;
  a.click();
}
