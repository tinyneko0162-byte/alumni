import demo from "@/data/demo.json";
import { QrCode } from "@/components/ui/QrCode";
import { entryPayload, walletPayload } from "@/lib/qr-payload";

export const metadata = { title: "QR สำหรับสาธิตระบบ" };

/** Page to open on a second screen / phone while demonstrating the scanner. Remove before real use. */
export default function DemoQrPage() {
  const t = demo.tickets[0];
  return (
    <main className="mx-auto flex max-w-[860px] flex-col gap-8 px-4 py-10">
      <div className="flex flex-col gap-1 leading-[1.55]">
        <h1 className="text-[26px] font-semibold text-ink-slate">QR สำหรับสาธิตระบบ</h1>
        <p className="text-[13px] text-black">เปิดหน้านี้บนอีกจอ แล้วใช้หน้าสแกนของแอดมิน / หน้าชำระเงินของร้านค้าสแกนได้เลย</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <section className="flex flex-col items-center gap-3 rounded-2xl border border-line-slate p-6">
          <h2 className="text-[18px] font-semibold text-ink-slate">QR เข้างาน</h2>
          <QrCode value={entryPayload(t.id)} size={260} alt="QR เข้างานสำหรับสาธิต" />
          <p className="text-[13px] text-black">{t.name}, {t.id}</p>
          <p className="text-[12px] text-black">สแกนที่ แอดมิน › สแกนบัตรเข้างาน</p>
        </section>
        <section className="flex flex-col items-center gap-3 rounded-2xl border border-line-slate p-6">
          <h2 className="text-[18px] font-semibold text-ink-slate">QR กระเป๋า Token</h2>
          <QrCode value={walletPayload(demo.wallet.id)} size={260} alt="QR กระเป๋า Token สำหรับสาธิต" />
          <p className="text-[13px] text-black">{demo.wallet.owner}, {demo.wallet.id}</p>
          <p className="text-[12px] text-black">สแกนที่ ร้านค้า › ชำระเงินค่าสินค้า</p>
        </section>
      </div>
    </main>
  );
}
