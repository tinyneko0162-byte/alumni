"use client";

import { useEffect, useState } from "react";

const stamp = () => {
  const d = new Date();
  const opt = { timeZone: "Asia/Bangkok" } as const;
  return `${d.toLocaleDateString("th-TH", { ...opt, day: "numeric", month: "short", year: "numeric" })} · ${d.toLocaleTimeString("th-TH", { ...opt, hour: "2-digit", minute: "2-digit" })} น.`;
};

/** Current Bangkok time in the top bar, so it matches the times written to the system log. */
export function LiveClock({ className }: { className?: string }) {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    setNow(stamp());
    const t = setInterval(() => setNow(stamp()), 30_000);
    return () => clearInterval(t);
  }, []);
  return <p className={className}>{now ?? "\u00a0"}</p>;
}
