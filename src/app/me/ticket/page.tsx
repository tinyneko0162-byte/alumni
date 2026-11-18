import { getAttendee } from "@/lib/data";
import { BrandMark, MobileShell } from "@/components/user/MobileShell";
import { AttendeeNav, Pill } from "@/components/user/AttendeeNav";
import { Icon } from "@/components/ui/Icon";
import { QrCode } from "@/components/ui/QrCode";
import { entryPayload } from "@/lib/qr-payload";

/** always read fresh data: staff top-ups and purchases change this page */
export const dynamic = "force-dynamic";

/** Figma: user / ผู้ร่วมงาน · บัตรของฉัน (4069:558) */
export default async function MyTicketPage() {
  const { profile, ticket } = await getAttendee();
  return (
    <MobileShell width={430}>
      <div className="px-6 pt-6 pb-4">
        <BrandMark />
      </div>
      <main className="flex flex-col gap-5 px-6 pt-2 pb-6">
        <div className="flex flex-col gap-[5px] leading-[1.55]">
          <h1 className="text-[27px] font-semibold text-ink-slate">บัตรของฉัน</h1>
          <p className="text-[13px] text-black">บัตรเข้างานและข้อมูลผู้ร่วมงาน</p>
        </div>
        <div>
          <Pill>{profile.shortMasked} · บัตรของฉัน</Pill>
        </div>

        <section className="flex flex-col gap-4 rounded-2xl border border-line-slate bg-white p-[22px]">
          <div className="flex flex-col gap-2">
            <div>
              <Pill tone="success">{ticket.status}</Pill>
            </div>
            <p className="text-[22px] font-semibold leading-[1.55] text-ink-slate">{profile.maskedName}</p>
          </div>
          <div className="flex flex-col items-center gap-3.5">
            <p className="w-full text-[18px] font-semibold leading-[1.55] text-ink-slate">QR สำหรับเข้างาน</p>
            <QrCode value={entryPayload(ticket.number)} alt="QR สำหรับเข้างาน" />
            <Pill tone="brandSoft">{ticket.qrLabel}</Pill>
            <p className="w-full text-[12px] leading-[1.55] text-black">{ticket.qrNote}</p>
          </div>
          <Detail label="เลขที่บัตร" value={ticket.number} />
          <Detail label="คำสั่งซื้อ" value={`${ticket.orderId} • ${ticket.orderQty} ใบ`} />
          <Detail label="ผู้ซื้อ" value={profile.fullName} />
        </section>

        <div className="flex items-start gap-2.5 rounded-lg border border-[rgba(230,158,193,0.25)] bg-white p-3.5">
          <Icon name="info-pink" size={20} />
          <div className="flex flex-1 flex-col gap-1 leading-[1.55]">
            <p className="text-[13px] font-semibold text-brand-soft">{ticket.notice.title}</p>
            <p className="text-[12px] text-ink-slate">{ticket.notice.body}</p>
          </div>
        </div>

        <a
          href={`/api/qr?type=entry&id=${encodeURIComponent(ticket.number)}`}
          download={`ticket-${ticket.number}.png`}
          className="flex h-12 w-full items-center justify-center gap-[9px] rounded-lg border border-line-slate bg-surface-slate transition hover:bg-line-slate"
        >
          <Icon name="share-2" size={20} />
          <span className="text-[14px] font-semibold text-ink-slate">บันทึก</span>
        </a>
        <p className="text-[12px] leading-[1.55] text-black">{ticket.shareNote}</p>
      </main>
      <AttendeeNav active="ticket" />
    </MobileShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 text-[14px]">
      <p className="flex-1 leading-[1.55] text-black">{label}</p>
      <p className="font-semibold text-ink-slate">{value}</p>
    </div>
  );
}
