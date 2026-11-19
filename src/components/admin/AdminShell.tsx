import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutStaff } from "@/lib/actions";
import { getStaff } from "@/lib/session";
import { Icon } from "@/components/ui/Icon";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { getAdminConfig, type RoleKey } from "@/lib/admin-data";
import { cx } from "@/lib/format";
import { Chip } from "./ui";

/**
 * Staff workspace layout: role sidebar on the left, breadcrumb bar on top.
 * `active` is the href of the current menu item.
 */
export async function AdminShell({
  role,
  active,
  title,
  crumb,
  children,
}: {
  role: RoleKey;
  active: string;
  title: string;
  /** breadcrumb root label; defaults to the role name */
  crumb?: string;
  children: React.ReactNode;
}) {
  const cfg = await getAdminConfig();
  const staff = await getStaff();
  const signedIn = staff?.role;
  if (!staff || !signedIn) redirect("/admin/login");
  if (!cfg.enabled[signedIn]) redirect("/admin/login?disabled=1");
  // a role may only open its own pages (Super Admin can open all of them)
  if (signedIn !== role && signedIn !== "super") redirect(cfg.roles[signedIn].home);
  const r = cfg.roles[role];
  // the signed-in person (Super Admin viewing another role's page still sees their own name)
  const account = { initials: staff.name.slice(0, 2), name: staff.name };
  const mine = cfg.roles[signedIn];

  return (
    <div className="flex min-h-dvh bg-admin-page">
      <aside className="sticky top-0 flex h-dvh w-[224px] shrink-0 flex-col justify-between overflow-y-auto bg-admin-side px-4 pt-7 pb-6 max-lg:hidden">
        <div className="flex flex-col gap-[30px]">
          <p className="px-2 text-[17px] font-bold leading-[1.55] text-brand">ศิษย์เก่า</p>
          <div className="flex flex-col gap-0.5 border-l-[3px] border-brand pl-3">
            <p className="text-[11px] leading-[1.55] text-admin-side-muted">ตำแหน่ง</p>
            <p className="text-[14px] font-semibold leading-[1.55] text-admin-side-ink">{r.label}</p>
          </div>
          <nav className="flex flex-col gap-[7px]">
            <p className="text-[10px] leading-[1.55] text-admin-side-muted">เมนูปฏิบัติงาน</p>
            {r.menu.map((m) => {
              const on = m.href === active;
              return (
                <Link
                  key={m.href}
                  href={m.href}
                  aria-current={on ? "page" : undefined}
                  className={cx(
                    "flex min-h-[46px] items-center gap-2.5 rounded-lg px-3 py-[11px] text-[12px] leading-[1.55] transition",
                    on ? "bg-brand font-semibold text-white" : "text-admin-side-muted hover:bg-brand-tint",
                  )}
                >
                  <Icon name={on ? `a-${m.icon}-active` : `a-${m.icon}`} size={18} />
                  {m.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-full bg-[#323458] text-[12px] text-white">
              {account.initials}
            </span>
            <div className="flex flex-col leading-[1.55]">
              <p className="text-[12px] text-admin-side-ink">{account.name}</p>
              <p className="text-[10px] text-admin-side-muted">{mine.label}, {staff.username}</p>
            </div>
          </div>
          <form action={logoutStaff}>
            <button
              type="submit"
              className="w-full rounded-lg border border-admin-side-line p-2.5 text-center text-[12px] font-semibold leading-[1.55] text-admin-side-ink transition hover:bg-brand-tint"
            >
              ออกจากระบบ
            </button>
          </form>
          <div className="flex flex-col gap-1.5 rounded-lg border border-admin-side-line p-3 leading-[1.55]">
            <p className="text-[12px] text-admin-side-ink">{cfg.event.name}</p>
            <p className="text-[10px] text-admin-side-muted">{cfg.event.environment}</p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[76px] items-center justify-between border-b border-admin-line bg-white px-8 max-sm:px-4">
          <div className="flex items-center gap-2.5 text-[12px] leading-[1.55]">
            <Link href={r.home} className="text-admin-muted hover:underline">
              {crumb ?? r.label}
            </Link>
            <Icon name="a-chevron-right" size={13} />
            <span className="font-medium text-admin-ink">{title}</span>
          </div>
          <div className="flex items-center gap-[18px]">
            <Chip tone="ok">ระบบพร้อมใช้งาน</Chip>
            <ThemeToggle />
          </div>
        </header>
        {/* compact role menu for small screens */}
        <nav className="flex gap-2 overflow-x-auto border-b border-admin-line bg-admin-side px-4 py-2 lg:hidden">
          {r.menu.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={cx(
                "shrink-0 rounded-lg px-3 py-1.5 text-[12px]",
                m.href === active ? "bg-brand text-white" : "text-admin-muted",
              )}
            >
              {m.label}
            </Link>
          ))}
        </nav>
        <main className="flex flex-col gap-6 p-8 max-sm:p-4">
          {children}
          <p className="pt-1 text-[10px] leading-[1.55] text-admin-muted">{cfg.event.footer}</p>
        </main>
      </div>
    </div>
  );
}
