import { getEvent } from "@/lib/data";
import { BrandMark, MobileShell } from "@/components/user/MobileShell";
import { RegisterForm } from "./register-form";

/** Figma: user / สมัครสมาชิก (4069:292) */
export default async function RegisterPage() {
  const event = await getEvent();
  return (
    <MobileShell>
      <div className="px-6 pt-6 pb-6">
        <BrandMark />
      </div>
      <header className="flex h-16 items-center bg-brand-deep px-6">
        <h1 className="text-[18px] font-bold text-white">{event.registrationTitle}</h1>
      </header>
      <div className="flex flex-col gap-[22px] px-6 pt-3 pb-6">
        <div className="flex flex-col gap-[9px]">
          <p className="text-[27px] font-bold text-ink">{event.name}</p>
          <p className="text-[13px] leading-[1.7] text-black">{event.registrationSubtitle}</p>
        </div>
        <RegisterForm />
      </div>
    </MobileShell>
  );
}
