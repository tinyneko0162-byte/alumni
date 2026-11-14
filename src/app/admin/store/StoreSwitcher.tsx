"use client";

import { usePathname, useRouter } from "next/navigation";

/** Mock-only control: real operators are bound to one store by their account. */
export function StoreSwitcher({ current, stores }: { current: string; stores: { id: string; name: string }[] }) {
  const router = useRouter();
  const path = usePathname();
  return (
    <label className="flex items-center gap-2 text-[12px] text-admin-muted">
      ร้าน (ข้อมูลจำลอง)
      <select
        value={current}
        onChange={(e) => router.push(`${path}?store=${e.target.value}`)}
        className="rounded-lg border border-admin-line bg-white px-3 py-2 text-[12px] text-admin-ink outline-none focus:border-brand-soft"
      >
        {stores.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </label>
  );
}
