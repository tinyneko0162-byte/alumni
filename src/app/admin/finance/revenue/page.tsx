import { AdminShell } from "@/components/admin/AdminShell";
import { Chip, DataTable, Guidance, PageHeading, Panel } from "@/components/admin/ui";
import { Detail } from "@/components/admin/history";
import { Icon } from "@/components/ui/Icon";
import { getFinanceRevenue } from "@/lib/admin-data";
import { ExportButton } from "@/components/admin/ExportButton";

const fmt = (n: number) => n.toLocaleString("en-US");
const money = (n: number) => `฿${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

/** Figma: admin / Finance · รายได้ภายในงาน (4011:38733) — shown inside the Super Admin workspace */
export default async function RevenuePage() {
  const d = await getFinanceRevenue();
  const total = d.revenue.reduce((s, r) => s + r.amount, 0);
  const ticket = d.revenue[0].amount;
  const topUp = total - ticket;
  const cash = d.revenue.filter((r) => r.channel === "เงินสด").reduce((s, r) => s + r.amount, 0);
  const bank = total - cash;
  const expired = d.tokens.expired ?? 0;
  const remaining = d.tokens.left; // เติม − ใช้ − หมดอายุ (ตัวเลขเดียวกับหน้าจัดการงาน)
  const storeSpent = d.spendingByCategory.reduce((n, r) => n + r.tokens, 0);
  const pct = (n: number, of: number) => `${((n / of) * 100).toFixed(1)}%`;

  return (
    <AdminShell role="super" active="/admin/finance/revenue" title="รายได้ภายในงาน" crumb="Finance">
      <PageHeading
        title="รายได้ภายในงาน"
        description={d.description}
        actions={
          <>
            <span className="flex min-h-[42px] items-center gap-2 rounded-lg border border-admin-line bg-white px-4 text-[13px] font-semibold text-admin-ink"><Icon name="a-calendar-days" size={17} />{d.date}</span>
            <ExportButton
              rows={[
                ["ประเภทรายรับ", "ช่องทาง", "ยอด (บาท)", "สัดส่วน"],
                ...d.revenue.map((r) => [r.type, r.channel, r.amount, pct(r.amount, total)]),
                ["รวม", "", total, "100%"],
              ]}
            />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label="รายรับเงินจริงรวม" value={`฿${fmt(total)}`} note="ยืนยันแล้ว, ไม่รวมรายการรอตรวจ" noteClass="text-admin-ok" />
        <Tile
          label={d.tickets.shirts ? "รายรับค่าบัตรและเสื้อ" : "รายรับค่าบัตร"}
          value={`฿${fmt(ticket)}`}
          note={d.tickets.shirts ? `บัตร ${fmt(d.tickets.count)} ใบ, เสื้อ ${d.tickets.shirts} ตัว` : `${d.tickets.count} ใบ × ฿${d.tickets.price} = ฿${fmt(d.tickets.count * d.tickets.price)}`}
        />
        <Tile label="เงินรับจากการเติม Token" value={`฿${fmt(topUp)}`} note={`เงินสด ฿${fmt(d.revenue[1].amount)} + โอน ฿${fmt(d.revenue[2].amount)} = ฿${fmt(topUp)}`} />
        <Tile label="การใช้จ่ายในงาน" value={fmt(d.tokens.spent)} note={`${fmt(d.tokens.spent)} Token, ไม่นับซ้ำเป็นรายได้เงินจริง`} />
      </div>

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <Panel title="ที่มาของรายรับเงินจริง (รวมยืนยันแล้ว)" aside={<Chip tone="indigo">หน่วย: บาท, 1 Token = 1 บาท</Chip>} className="flex-1">
          <div className="flex h-[18px] gap-[3px] overflow-hidden rounded-md" role="img" aria-label="สัดส่วนรายรับ">
            {d.revenue.map((r) => (
              <span key={r.type} className={r.color} style={{ width: `${(r.amount / total) * 100}%` }} title={`${r.type} ${pct(r.amount, total)}`} />
            ))}
          </div>
          <DataTable
            rows={d.revenue}
            rowKey={(r) => r.type}
            columns={[
              {
                key: "t",
                header: "ประเภทรายรับ",
                strong: true,
                render: (r) => (
                  <span className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${r.color}`} />
                    {r.type}
                  </span>
                ),
              },
              { key: "c", header: "ช่องทาง", width: 129, render: (r) => r.channel },
              { key: "a", header: "ยอด (บาท)", width: 144, render: (r) => money(r.amount) },
              { key: "p", header: "สัดส่วน", width: 89, render: (r) => pct(r.amount, total) },
            ]}
          />
          <Detail label="รวมรายรับเงินจริงที่ยืนยันแล้ว" value={money(total)} valueClass="text-admin-indigo" />
          <div className="h-px bg-admin-line" />
          <div className="flex gap-6 leading-[1.55]">
            <div className="flex flex-1 flex-col gap-1">
              <p className="text-[11px] text-admin-muted">รับเป็นเงินสด</p>
              <p className="font-latin text-[21px] font-semibold text-admin-ink">฿{fmt(cash)}</p>
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <p className="text-[11px] text-admin-muted">รับเป็นเงินโอนทั้งหมด</p>
              <p className="font-latin text-[21px] font-semibold text-admin-ink">฿{fmt(bank)}</p>
            </div>
          </div>
        </Panel>

        <Panel title="ตรวจสอบยอด Token (1 Token = 1 บาท)" aside={<Icon name="a-coins" size={20} />} className="xl:w-[340px]">
          <p className="text-[12px] leading-[1.55] text-admin-muted">ยอดหน่วย Token ในระบบ (1 Token = 1 บาท) ไม่ใช่รายได้สกุลเงินบาทซ้ำอีกครั้ง</p>
          <Detail label="เติมเข้าระบบแล้ว" value={`${fmt(d.tokens.toppedUp)} Token`} />
          <Detail label="ใช้จ่ายในงานแล้ว" value={`${fmt(d.tokens.spent)} Token`} />
          {expired > 0 && <Detail label="หมดอายุตอนปิดงาน" value={`${fmt(expired)} Token`} />}
          <div className="h-px bg-admin-line" />
          <div className="flex items-start justify-between rounded-lg bg-brand-tint p-3.5 leading-[1.55] text-black">
            <p className="text-[12px]">คงเหลือใน Wallet รวม</p>
            <p className="text-[18px] font-semibold">{fmt(remaining)}</p>
          </div>
          <p className="text-[11px] leading-[1.55] text-admin-muted">
            {fmt(d.tokens.toppedUp)} − {fmt(d.tokens.spent)}{expired > 0 ? ` − ${fmt(expired)}` : ""} = {fmt(remaining)} Token
          </p>
          <Guidance>ยอดขาย Token ไม่ถูกนับเป็นรายรับเงินบาทซ้ำอีกครั้ง</Guidance>
        </Panel>
      </div>

      <Panel title="ยอดใช้ Token แยกตามร้านค้า" aside={<span className="text-[11px] text-admin-muted">รวม {fmt(storeSpent)} Token</span>}>
        <DataTable
          rows={d.spendingByCategory}
          rowKey={(r) => r.category}
          columns={[
            { key: "c", header: "ร้านค้า", strong: true, render: (r) => r.category },
            { key: "t", header: "ยอดขาย (Token)", width: 204, render: (r) => fmt(r.tokens) },
            { key: "p", header: "สัดส่วน", width: 144, render: (r) => storeSpent ? pct(r.tokens, storeSpent) : "-" },
            { key: "s", header: "สถานะ", width: 154, render: (r) => <Chip tone={r.status === "เปิดขาย" ? "ok" : "warn"}>{r.status}</Chip> },
          ]}
        />
      </Panel>
    </AdminShell>
  );
}

function Tile({ label, value, note, noteClass = "text-admin-muted" }: { label: string; value: string; note: string; noteClass?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-admin-line bg-white p-5 leading-[1.55]">
      <p className="text-[12px] text-admin-muted">{label}</p>
      <p className="font-latin text-[29px] font-semibold text-admin-ink">{value}</p>
      <p className={`text-[11px] ${noteClass}`}>{note}</p>
    </div>
  );
}
