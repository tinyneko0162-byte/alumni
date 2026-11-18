import { redirect } from "next/navigation";
import { getEvent } from "@/lib/data";
import { getUser } from "@/lib/session";
import { BrandMark, MobileShell } from "@/components/user/MobileShell";
import { UserLoginForm } from "./login-form";

export const dynamic = "force-dynamic";

/** Attendee sign-in (same look as the registration page). */
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  // only allow going back to our own pages
  const target = next?.startsWith("/") && !next.startsWith("//") ? next : "/me/ticket";
  if (await getUser()) redirect(target);
  const event = await getEvent();
  return (
    <MobileShell>
      <div className="px-6 pt-6 pb-6">
        <BrandMark />
      </div>
      <p className="px-6 text-[13px] font-semibold text-brand-deep">เข้าสู่ระบบ</p>
      <div className="flex flex-col gap-[22px] px-6 pt-3 pb-6">
        <div className="flex flex-col gap-[9px]">
          <p className="text-[27px] font-bold text-ink">{event.name}</p>
          <p className="text-[13px] leading-[1.7] text-black">ดูบัตรเข้างาน กระเป๋า Token และประวัติของคุณ</p>
        </div>
        <UserLoginForm next={target} />
      </div>
    </MobileShell>
  );
}
