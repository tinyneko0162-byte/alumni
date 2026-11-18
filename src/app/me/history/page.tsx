import { requireUser, getAttendee } from "@/lib/data";
import { BrandMark, MobileShell } from "@/components/user/MobileShell";
import { UserBar } from "@/components/user/UserBar";
import { AttendeeNav, Pill } from "@/components/user/AttendeeNav";
import { Icon } from "@/components/ui/Icon";

/** always read fresh data: staff top-ups and purchases change this page */
export const dynamic = "force-dynamic";

/** Figma: user / ผู้ร่วมงาน · ประวัติรายการ (4069:358) */
export default async function HistoryPage() {
  const user = await requireUser("/me/history");
  const { profile, wallet, history } = await getAttendee(user);
  return (
    <MobileShell width={430}>
      <div className="px-6 pt-6 pb-4">
        <BrandMark />
      </div>
      <UserBar name={user.name} />
      <main className="flex flex-col gap-5 px-6 pt-2 pb-6">
        <div className="flex flex-col gap-[5px] leading-[1.55]">
          <h1 className="text-[27px] font-semibold text-ink-slate">ประวัติรายการ</h1>
          <p className="text-[13px] text-black">
            กระเป๋า {wallet.shortId} • {profile.fullName}
          </p>
        </div>

        <Panel>
          <div className="flex items-center gap-4 text-[14px]">
            <p className="flex-1 leading-[1.55] text-black">ยอดคงเหลือปัจจุบัน</p>
            <p className="font-semibold text-brand">{history.currentBalance} Token</p>
          </div>
          <p className="text-[12px] leading-[1.55] text-black">{history.formula}</p>
        </Panel>

        <div className="flex gap-2.5">
          <Pill tone="success">↓ เติม Token +{history.topUpTotal}</Pill>
          <Pill tone="danger">↑ ใช้จ่าย −{history.spendTotal}</Pill>
        </div>

        <Panel title="รายการเติม Token">
          <p className="text-[12px] leading-[1.55] text-black">
            {history.dayLabel} • แสดง {history.topUps.length} รายการ
          </p>
          {history.topUps.length === 0 && <p className="text-[12px] text-black">ยังไม่มีรายการ</p>}
          {history.topUps.map((t) => (
            <Txn key={t.id} icon="arrow-down-left" label={t.label} meta={`${t.time} • ${t.id} • หลังรายการ ${t.balanceAfter}`} amount={`+${t.amount}`} tone="text-success" />
          ))}
        </Panel>

        <Panel title="รายการใช้จ่าย">
          <div>
            <Pill tone="danger" shadow>
              ดูรายการทั้งหมด
            </Pill>
          </div>
          {history.purchases.length === 0 && <p className="text-[12px] text-black">ยังไม่มีรายการ</p>}
          {history.purchases.map((t) => (
            <Txn key={t.id} icon="arrow-up-right" label={t.label} meta={`${t.time} • ${t.id} • หลังรายการ ${t.balanceAfter}`} amount={`−${t.amount}`} tone="text-danger" />
          ))}
        </Panel>

        <Panel title="ใบเสร็จดิจิทัล">
          <div>
            <Pill tone="info" shadow>
              ดูใบเสร็จทั้งหมด
            </Pill>
          </div>
          {history.receipt ? (
            <>
              <Detail label="ร้านค้า" value={history.receipt.shop} />
              <Detail label="เวลา" value={history.receipt.time} />
              <Detail label={history.receipt.line} value={`${history.receipt.amount} Token`} />
              <Detail label="ยอดก่อน / หลัง" value={`${history.receipt.balanceBefore} / ${history.receipt.balanceAfter} Token`} />
              <Detail label="สถานะ" value={history.receipt.status} valueClass="text-success" />
              <p className="text-[11px] leading-[1.55] text-black">{history.receipt.footer}</p>
            </>
          ) : (
            <p className="text-[12px] text-black">ยังไม่มีใบเสร็จ ใบเสร็จจะขึ้นเมื่อจ่ายด้วย Token ที่ร้านค้า</p>
          )}
        </Panel>

        <div className="flex items-start gap-2.5 rounded-lg border border-[rgba(0,163,224,0.25)] bg-[rgba(0,163,224,0.07)] p-3.5">
          <Icon name="info-blue" size={20} />
          <p className="flex-1 text-[12px] leading-[1.55] text-ink-slate">{history.notice}</p>
        </div>
      </main>
      <AttendeeNav active="history" />
    </MobileShell>
  );
}

function Panel({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-line-slate bg-white p-[22px]">
      {title && <h2 className="text-[17px] font-semibold leading-[1.55] text-ink-slate">{title}</h2>}
      {children}
    </section>
  );
}

function Txn({ icon, label, meta, amount, tone }: { icon: string; label: string; meta: string; amount: string; tone: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon name={icon} size={20} />
      <div className="flex flex-1 flex-col gap-[3px] leading-[1.55]">
        <p className="text-[14px] font-semibold text-ink-slate">{label}</p>
        <p className="text-[11px] text-black">{meta}</p>
      </div>
      <p className={`font-latin text-[20px] font-semibold ${tone}`}>{amount}</p>
    </div>
  );
}

function Detail({ label, value, valueClass = "text-ink-slate" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center gap-4 text-[14px]">
      <p className="flex-1 leading-[1.55] text-black">{label}</p>
      <p className={`font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}
