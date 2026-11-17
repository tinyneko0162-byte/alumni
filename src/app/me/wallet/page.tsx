import { getAttendee, getEvent } from "@/lib/data";
import { BrandMark, MobileShell } from "@/components/user/MobileShell";
import { AttendeeNav } from "@/components/user/AttendeeNav";
import { BankAccount } from "@/components/user/BankAccount";
import { Icon } from "@/components/ui/Icon";
import { QrCode } from "@/components/ui/QrCode";
import { walletPayload } from "@/lib/qr-payload";
import { num } from "@/lib/format";
import { WalletTopUp } from "./wallet-top-up";

/** Figma: user / ผู้ร่วมงาน · กระเป๋า Token (4069:465) */
export default async function WalletPage() {
  const [{ wallet }, event] = await Promise.all([getAttendee(), getEvent()]);
  return (
    <MobileShell width={430}>
      <div className="px-6 pt-6 pb-4">
        <BrandMark />
      </div>

      <div className="flex items-center justify-between px-6 pt-2.5 pb-[18px]">
        <div className="flex flex-col gap-px">
          <h1 className="text-[25px] font-bold leading-[1.4] text-ink-navy">กระเป๋าโทเคน</h1>
          <div className="flex items-center gap-1.5">
            <Icon name="event-status" size={6} />
            <p className="text-[12px] text-black">{event.name}</p>
          </div>
        </div>
        <div className="flex size-11 items-center justify-center rounded-2xl bg-[#eeedf8]">
          <Icon name="ticket-pass" size={22} />
        </div>
      </div>

      <div className="px-5">
        <section className="relative flex flex-col gap-2 overflow-hidden rounded-3xl bg-brand-deep p-5">
          <Icon name="token-orbit-lg" size={150} className="pointer-events-none absolute -top-[30px] left-[280px]" />
          <Icon name="token-orbit-sm" size={110} className="pointer-events-none absolute -top-2.5 left-[300px]" />
          <div className="relative flex items-center justify-between">
            <p className="text-[13px] text-[#d9d7f0]">โทเคนคงเหลือ</p>
            <span className="flex items-center gap-[5px] rounded-full bg-white/[0.07] px-[9px] py-[3px]">
              <Icon name="status-dot" size={5} />
              <span className="text-[10px] text-[#a5f4d5]">{wallet.status}</span>
            </span>
          </div>
          <div className="relative flex items-baseline gap-2.5 text-white">
            <p className="font-latin text-[44px] font-bold leading-[1.1]">{num(wallet.balance)}</p>
            <p className="text-[15px]">โทเคน</p>
          </div>
          <div className="relative flex items-center justify-between text-[11px] text-[#c1bedf]">
            <p>{event.tokenRate}</p>
            <p>{event.tokenScope}</p>
          </div>
        </section>
      </div>

      <section className="mt-5 flex flex-col items-center gap-3.5 rounded-3xl border border-[#e8e7f0] bg-white p-5">
        <div className="flex w-full flex-col items-center gap-0.5 text-center">
          <p className="text-[18px] text-ink-navy">QR กระเป๋าของฉัน</p>
          <p className="text-[12px] text-black">เปิดหน้านี้ให้เจ้าหน้าที่สแกนเพื่อเติมเงิน</p>
        </div>
        <QrCode value={walletPayload(wallet.id)} size={210} alt="QR กระเป๋า" />
        <div className="flex w-full items-center justify-between rounded-xl bg-brand-tint px-3.5 py-[11px]">
          <div className="flex flex-col gap-[3px] text-brand-deep">
            <p className="text-[10px]">ID กระเป๋า</p>
            <p className="font-latin text-[14px] font-semibold">{wallet.id}</p>
          </div>
          <Icon name="copy-md" size={19} />
        </div>
        <div className="flex items-center gap-[5px]">
          <Icon name="shield-check" size={13} />
          <p className="text-[10px] text-black">ตรวจสอบยอดก่อนยืนยันการชำระทุกครั้ง</p>
        </div>
      </section>

      <div className="flex items-center justify-between px-[7px] pt-2 pb-1.5 text-[12px] font-bold text-black">
        <p>เติมโทเคนเข้ากระเป๋าด้วยตัวเอง</p>
        <p>โอนแล้ว ส่งสลิปได้เลย</p>
      </div>
      <BankAccount account={event.bankAccount} className="border border-[#dcdbdb]" />
      <div className="px-[11px] pt-4 pb-6">
        <WalletTopUp accept={event.slipRule.accept} maxSizeMb={event.slipRule.maxSizeMb} />
      </div>

      <AttendeeNav active="wallet" />
    </MobileShell>
  );
}
