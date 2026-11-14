import { baht } from "@/lib/format";

export type SummaryItem = { label: string; qty: number; amount: number };

export function OrderSummary({
  orderId,
  items,
  note,
  total,
}: {
  orderId: string;
  items: SummaryItem[];
  note?: string;
  total: number;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-[20px] border border-line bg-white p-[18px]">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-ink">สรุปรายการ</h2>
        <p className="font-latin text-[11px] text-black">#{orderId}</p>
      </div>
      <div className="flex flex-col gap-[10px]">
        {items.length === 0 && (
          <p className="text-[12px] text-black/60">ยังไม่ได้เลือกสินค้า</p>
        )}
        {items.map((it) => (
          <div key={it.label} className="flex items-start justify-between">
            <p className="text-[12px] text-black">
              {it.label} × {it.qty}
            </p>
            <p className="font-latin text-[13px] text-ink">{baht(it.amount)}</p>
          </div>
        ))}
        {note && <p className="-mt-1 text-[11px] text-black">{note}</p>}
      </div>
      <div className="h-px w-full bg-line" />
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-semibold text-ink">ยอดรวมทั้งหมด</p>
        <p className="font-latin text-[24px] font-bold text-black">
          {baht(total)}
        </p>
      </div>
    </section>
  );
}
