import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { getAdminConfig } from "@/lib/admin-data";
import { LoginForm } from "./login-form";

/** Figma: admin / Staff · เข้าสู่ระบบ · สว่าง (57:266) */
export default async function StaffLoginPage({ searchParams }: { searchParams: Promise<{ disabled?: string }> }) {
  const { disabled } = await searchParams;
  const cfg = await getAdminConfig();
  const roles = Object.entries(cfg.roles).map(([key, r]) => ({ key, label: r.label, home: r.home, enabled: cfg.enabled[key as keyof typeof cfg.enabled] }));
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
        <LoginForm roles={roles} notice={disabled ? "บทบาทของคุณถูกปิดใช้งานโดย Super Admin จึงออกจากระบบแล้ว" : undefined} />
      </main>
    </div>
  );
}
