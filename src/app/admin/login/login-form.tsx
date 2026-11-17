"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

type RoleOption = { key: string; label: string; home: string };

export function LoginForm({ roles }: { roles: RoleOption[] }) {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [role, setRole] = useState(roles[0]?.key ?? "");
  const [error, setError] = useState(false);
  const [forgot, setForgot] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!user || !pass) {
          setError(true);
          return;
        }
        // Mock sign-in: no auth backend yet, just open the chosen role's workspace.
        const target = roles.find((r) => r.key === role);
        router.push(target?.home ?? "/admin/super/overview");
      }}
      className="flex w-full max-w-[559px] flex-col gap-6 rounded-2xl border border-line-slate bg-white p-8 max-sm:p-5"
    >
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[28px] font-semibold leading-[1.55] text-ink-slate">เข้าสู่ระบบพนักงาน</h1>
        <p className="text-[14px] leading-[1.65] text-admin-slate">ใช้บัญชีที่ได้รับจากเจ้าของอีเวนต์เพื่อเข้าใช้งาน</p>
      </div>

      <div className="flex flex-col gap-5">
        <Field label="ชื่อผู้ใช้ / รหัสพนักงาน" icon="a-user-round">
          <input
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="กรอกชื่อผู้ใช้หรือรหัสพนักงาน"
            autoComplete="username"
            className="min-w-0 flex-1 bg-transparent text-[14px] text-ink-slate outline-none placeholder:text-admin-slate"
          />
        </Field>
        <Field label="รหัสผ่าน" icon="a-lock-keyhole">
          <input
            type={show ? "text" : "password"}
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="กรอกรหัสผ่าน"
            autoComplete="current-password"
            className="min-w-0 flex-1 bg-transparent text-[14px] text-ink-slate outline-none placeholder:text-admin-slate"
          />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}>
            <Icon name="a-eye-off" size={20} className={show ? "opacity-40" : undefined} />
          </button>
        </Field>
        {/* Mock only: pick which role workspace to open until real accounts exist */}
        <label className="flex flex-col gap-2">
          <span className="text-[14px] font-semibold text-ink-slate">บทบาท (ข้อมูลจำลอง)</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="h-[52px] rounded-lg border border-line-slate bg-surface-slate px-4 text-[14px] text-ink-slate outline-none focus:border-brand-soft"
          >
            {roles.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p role={error ? "alert" : undefined} className={`text-[12px] ${error ? "text-danger" : "text-admin-slate"}`}>
          กรุณากรอกข้อมูลให้ครบทุกช่อง
        </p>
        <button
          type="button"
          aria-expanded={forgot}
          onClick={() => setForgot((f) => !f)}
          className="shrink-0 text-[13px] font-semibold text-brand-deep hover:underline"
        >
          ลืมรหัสผ่าน?
        </button>
      </div>
      {forgot && (
        <p className="-mt-3 rounded-lg bg-brand-tint p-3 text-[12px] leading-[1.7] text-ink-slate">
          ระบบนี้ยังไม่มีการรีเซ็ตรหัสผ่านด้วยตนเอง กรุณาติดต่อเจ้าของอีเวนต์เพื่อขอรหัสผ่านใหม่
        </p>
      )}

      <button
        type="submit"
        className="flex h-[52px] w-full items-center justify-center gap-2.5 rounded-lg bg-brand text-[15px] font-semibold text-white transition hover:brightness-95"
      >
        เข้าสู่ระบบ
        <Icon name="a-arrow-right-white" size={18} />
      </button>

      <div className="flex flex-col gap-1.5 pt-6">
        <div className="h-px bg-line-slate" />
        <p className="text-center text-[12px] leading-[1.7] text-admin-slate">ยังไม่มีบัญชีหรือลืมรหัสผ่าน? ติดต่อเจ้าของอีเวนต์</p>
      </div>
    </form>
  );
}

function Field({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[14px] font-semibold text-ink-slate">{label}</span>
      <span className="flex h-[52px] items-center gap-3 rounded-lg border border-line-slate bg-surface-slate px-4 focus-within:border-brand-soft">
        <Icon name={icon} size={20} />
        {children}
      </span>
    </label>
  );
}
