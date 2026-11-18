import demo from "@/data/demo.json";
import { QrCode } from "@/components/ui/QrCode";
import { BrandMark, MobileShell } from "@/components/user/MobileShell";
import { entryPayload, walletPayload } from "@/lib/qr-payload";
import { findHolder, readDb } from "@/lib/db";
import { verifyTicket } from "@/lib/ticket-token";

/** Personal link from the email: shows the holder's entry QR and wallet QR. */
export const dynamic = "force-dynamic";

export default async function PersonalTicketPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const id = verifyTicket(decodeURIComponent(token));
  const name = demo.tickets.find((t) => t.id === id)?.name ?? (id ? findHolder(readDb(), id)?.name : undefined) ?? "ผู้ร่วมงาน";

  return (
    <MobileShell width={430}>
      <div className="px-6 pt-6 pb-4">
        <BrandMark />
      </div>
      <main className="flex flex-col gap-5 px-6 pt-2 pb-8">
        {!id ? (
          <div className="flex flex-col gap-2 rounded-2xl border border-line-slate p-5 leading-[1.55]">
            <h1 className="text-[20px] font-semibold text-ink-slate">ลิงก์ไม่ถูกต้อง</h1>
            <p className="text-[13px] text-black">ลิงก์นี้อาจพิมพ์ไม่ครบหรือหมดอายุ กรุณาเปิดจากอีเมลอีกครั้ง หรือติดต่อทีมงาน</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1 leading-[1.55]">
              <h1 className="text-[26px] font-semibold text-ink-slate">บัตรของฉัน</h1>
              <p className="text-[13px] text-black">
                {name} · {id}
              </p>
            </div>
            <section className="flex flex-col items-center gap-3 rounded-2xl border border-line-slate p-5">
              <p className="w-full text-[16px] font-semibold text-ink-slate">QR สำหรับเข้างาน</p>
              <QrCode value={entryPayload(id)} alt="QR สำหรับเข้างาน" />
              <p className="text-[12px] text-black">แสดง QR นี้ที่ประตูงาน</p>
            </section>
            <section className="flex flex-col items-center gap-3 rounded-2xl border border-line-slate p-5">
              <p className="w-full text-[16px] font-semibold text-ink-slate">QR กระเป๋า Token</p>
              <QrCode value={walletPayload(demo.wallet.id)} alt="QR กระเป๋า Token" size={200} />
              <p className="text-[12px] text-black">แสดงให้ร้านค้าสแกนเพื่อจ่ายด้วย Token · 1 Token = 1 บาท</p>
            </section>
            <p className="text-[12px] leading-[1.55] text-black">กรุณาไม่ส่งต่อลิงก์นี้ให้ผู้อื่น</p>
          </>
        )}
      </main>
    </MobileShell>
  );
}
