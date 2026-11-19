import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { getAdminConfig } from "@/lib/admin-data";
import { LoginForm } from "./login-form";
import { readDb } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Figma: admin / Staff · เข้าสู่ระบบ · สว่าง (57:266) */
export default async function StaffLoginPage({ searchParams }: { searchParams: Promise<{ disabled?: string }> }) {
  const { disabled } = await searchParams;
  const cfg = await getAdminConfig();
  const db = readDb();
  // demo accounts (seeded with known passwords) that are still active
  const demoAccounts = [
    ["admin", "admin123"],
    ["ticket", "1234"],
    ["token", "1234"],
    ["store1", "1234"],
    ["store2", "1234"],
    ["store3", "1234"],
  ]
    .map(([username, password]) => {
      const s = db.staff.find((x) => x.username === username && x.active);
      return s ? { username, password, label: s.role === "store" ? `${cfg.roles.store.label}, ${s.station}` : cfg.roles[s.role].label } : null;
    })
    .filter((x): x is { username: string; password: string; label: string } => !!x);
  return (
    <div className="flex min-h-dvh flex-col bg-admin-page">
      <header className="flex h-24 items-center justify-between border-b border-line-slate bg-white px-12 max-sm:px-4">
        <div className="flex items-center gap-5">
          <p className="font-latin text-[37px] font-extrabold text-brand">ศิษย์เก่า</p>
          <span className="h-8 w-px bg-line-slate" />
          <div className="flex flex-col gap-0.5">
            <p className="text-[14px] font-semibold text-ink-slate">{cfg.event.name}</p>
            <p className="text-[12px] text-admin-slate">{cfg.event.subtitle}</p>
          </div>
        </div>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center bg-surface-upload px-4 py-16">
        <LoginForm demoAccounts={demoAccounts} notice={disabled ? "บัญชีหรือบทบาทของคุณถูกปิดใช้งานโดย Super Admin จึงออกจากระบบแล้ว" : undefined} />
      </main>
    </div>
  );
}
