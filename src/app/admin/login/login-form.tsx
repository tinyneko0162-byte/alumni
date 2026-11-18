"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { loginStaff } from "@/lib/actions";

/** Demo accounts shown under the form so the presenter can sign in with one click. */
export type DemoAccount = { username: string; password: string; label: string };

export function LoginForm({ demoAccounts, notice }: { demoAccounts: DemoAccount[]; notice?: string }) {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [forgot, setForgot] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setServerError(null);
        if (!user || !pass) {
          setError(true);
          return;
        }
        setError(false);
        setBusy(true);
        // username + password are checked on the server; the role comes from the account
        const res = await loginStaff(user, pass);
        setBusy(false);
        if (res.ok) router.push(res.home);
        else setServerError(res.error);
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
      </div>

      {(serverError ?? notice) && (
        <p role="alert" className="rounded-lg bg-[#fdecee] p-3 text-[13px] leading-[1.55] text-[#c2414b]">
          {serverError ?? notice}
        </p>
      )}
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
        disabled={busy}
        className="flex h-[52px] w-full items-center justify-center gap-2.5 rounded-lg bg-brand text-[15px] font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
      >
        {busy ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
        <Icon name="a-arrow-right-white" size={18} />
      </button>

      <div className="flex flex-col gap-3 pt-4">
        <div className="h-px bg-line-slate" />
        <p className="text-[12px] leading-[1.7] text-admin-slate">บัญชีทดลอง (กดเพื่อกรอกให้) • บัญชีจริงสร้างได้ที่ Super Admin › จัดการบทบาท</p>
        <div className="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
          {demoAccounts.map((a) => (
            <button
              key={a.username}
              type="button"
              onClick={() => {
                setUser(a.username);
                setPass(a.password);
                setError(false);
              }}
              className="flex flex-col rounded-lg border border-line-slate px-3 py-2 text-left leading-[1.55] transition hover:bg-surface-slate"
            >
              <span className="text-[13px] font-semibold text-ink-slate">{a.label}</span>
              <span className="font-latin text-[12px] text-admin-slate">
                {a.username} / {a.password}
              </span>
            </button>
          ))}
        </div>
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
