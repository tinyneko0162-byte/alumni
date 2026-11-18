"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExportButton } from "@/components/admin/ExportButton";
import { Chip, DataTable, Guidance, Metric, OutlineButton, PageHeading, Panel, SearchBox } from "@/components/admin/ui";
import { setShirtStatus } from "@/lib/actions";
import { cx } from "@/lib/format";
import type { getShirtOrders } from "@/lib/admin-data";

type Data = Awaited<ReturnType<typeof getShirtOrders>>;
type Row = Data["orders"][number];
type Filter = "all" | "pickup" | "delivery" | "waiting";

const fullAddress = (r: Row) =>
  r.address ? `${r.address.name} ${r.address.phone} · ${r.address.line} ต.${r.address.subdistrict} อ.${r.address.district} จ.${r.address.province} ${r.address.zip}` : "";

export function ShirtsView({ data }: { data: Data }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // only paid orders count towards what has to be produced and handed over
  const paid = data.orders.filter((o) => o.paid === "approved");
  const count = (rows: Row[]) => rows.reduce((n, o) => n + o.sizes.length, 0);
  const bySize = data.sizes.map((z) => `${z} ${paid.reduce((n, o) => n + o.sizes.filter((x) => x === z).length, 0)}`).join(" · ");
  const pickup = paid.filter((o) => o.delivery === "pickup");
  const ship = paid.filter((o) => o.delivery === "delivery");

  const shown = useMemo(() => {
    const t = q.trim();
    return data.orders.filter(
      (o) =>
        (filter === "all" || (filter === "waiting" ? o.paid === "approved" && o.shirtStatus === "waiting" : o.delivery === filter)) &&
        (o.id + o.name + o.email + fullAddress(o)).includes(t),
    );
  }, [data.orders, filter, q]);

  const mark = (r: Row, status: "waiting" | "picked" | "shipped") => {
    setError(null);
    start(async () => {
      const res = await setShirtStatus(r.id, status);
      if (!res.ok) return setError(res.error);
      router.refresh();
    });
  };

  return (
    <>
      <PageHeading
        title="ออเดอร์เสื้อรุ่น"
        description="สรุปจำนวนเสื้อตามไซซ์ รายชื่อคนรับที่หน้างาน และที่อยู่สำหรับจัดส่ง • นับเฉพาะออเดอร์ที่ชำระเงินแล้ว"
        actions={
          <ExportButton
            variant="outline"
            filename="shirt-orders.csv"
            rows={[
              ["คำสั่งซื้อ", "ผู้ซื้อ", "อีเมล", "ไซซ์", "การรับเสื้อ", "ที่อยู่จัดส่ง", "ชำระเงิน", "สถานะเสื้อ"],
              ...data.orders.map((o) => [o.id, o.name, o.email, o.sizes.join(" "), o.delivery === "delivery" ? "ส่งที่บ้าน" : "รับที่หน้างาน", fullAddress(o), o.paid === "approved" ? "ชำระแล้ว" : "รอตรวจสลิป", statusLabel(o)]),
            ]}
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Metric label="เสื้อที่ชำระแล้ว" value={`${count(paid)} ตัว`} note={bySize} />
        <Metric label="รับที่หน้างาน" value={`${count(pickup)} ตัว`} note={`รับแล้ว ${count(pickup.filter((o) => o.shirtStatus === "picked"))} · ยังไม่รับ ${count(pickup.filter((o) => o.shirtStatus !== "picked"))}`} />
        <Metric label="ส่งที่บ้าน (ส่งฟรี)" value={`${count(ship)} ตัว`} note={`ส่งแล้ว ${count(ship.filter((o) => o.shirtStatus === "shipped"))} · รอส่ง ${count(ship.filter((o) => o.shirtStatus !== "shipped"))}`} />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-[#fdecee] p-3 text-[13px] text-[#c2414b]">
          {error}
        </p>
      )}

      <Panel title="รายการสั่งเสื้อ" aside={<Chip tone="indigo">{data.orders.length} คำสั่งซื้อ</Chip>}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5 rounded-lg bg-admin-head p-1">
            {(
              [
                ["all", "ทั้งหมด"],
                ["waiting", "ยังไม่ได้ส่งมอบ"],
                ["pickup", "รับที่หน้างาน"],
                ["delivery", "ส่งที่บ้าน"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                aria-pressed={filter === k}
                onClick={() => setFilter(k)}
                className={cx("rounded-md px-3 py-1.5 text-[12px] font-medium", filter === k ? "bg-white text-admin-ink shadow-sm" : "text-admin-muted hover:text-admin-ink")}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="min-w-[220px] flex-1">
            <SearchBox value={q} onChange={setQ} placeholder="ค้นหาชื่อ อีเมล เลขคำสั่งซื้อ หรือที่อยู่" />
          </div>
        </div>

        {shown.length === 0 ? (
          <p className="py-10 text-center text-[12px] leading-[1.55] text-admin-muted">
            {data.orders.length === 0 ? "ยังไม่มีออเดอร์เสื้อ รายการจะขึ้นที่นี่เมื่อผู้ร่วมงานสั่งเสื้อจากหน้าเลือกซื้อ" : "ไม่พบรายการที่ตรงกับตัวกรอง"}
          </p>
        ) : (
          <DataTable
            rows={shown}
            rowKey={(r) => r.id}
            columns={[
              { key: "id", header: "คำสั่งซื้อ", width: 120, strong: true, render: (r) => <span className="flex flex-col"><span>{r.id}</span><span className="text-[11px] font-normal text-admin-muted">{r.submittedAt} น.</span></span> },
              { key: "buyer", header: "ผู้ซื้อ", width: 190, render: (r) => <span className="flex flex-col"><span className="text-admin-ink">{r.name}</span><span>{r.email}</span></span> },
              { key: "sizes", header: "ไซซ์", width: 110, render: (r) => <span className="font-latin font-semibold text-admin-ink">{r.sizes.join(", ")}</span> },
              {
                key: "where",
                header: "การรับเสื้อ",
                render: (r) =>
                  r.delivery === "delivery" ? (
                    <span className="flex flex-col"><span className="text-admin-ink">ส่งที่บ้าน{!r.hasTicket && " (ซื้อเสื้ออย่างเดียว)"}</span><span>{fullAddress(r)}</span></span>
                  ) : (
                    <span className="text-admin-ink">รับที่หน้างาน</span>
                  ),
              },
              { key: "paid", header: "ชำระเงิน", width: 120, render: (r) => (r.paid === "approved" ? <Chip tone="ok">ชำระแล้ว</Chip> : r.paid === "rejected" ? <Chip tone="danger">สลิปไม่ผ่าน</Chip> : <Chip tone="warn">รอตรวจสลิป</Chip>) },
              {
                key: "status",
                header: "สถานะเสื้อ",
                width: 190,
                render: (r) =>
                  r.paid !== "approved" ? (
                    <span>รอชำระเงินก่อน</span>
                  ) : r.shirtStatus === "waiting" ? (
                    <OutlineButton disabled={pending} onClick={() => mark(r, r.delivery === "delivery" ? "shipped" : "picked")}>
                      {r.delivery === "delivery" ? "บันทึกว่าส่งแล้ว" : "บันทึกว่ารับแล้ว"}
                    </OutlineButton>
                  ) : (
                    <span className="flex flex-col items-start gap-1">
                      <Chip tone="ok">{statusLabel(r)}</Chip>
                      <button type="button" disabled={pending} onClick={() => mark(r, "waiting")} className="text-[11px] text-admin-muted hover:underline">
                        ยกเลิกสถานะ
                      </button>
                    </span>
                  ),
              },
            ]}
          />
        )}
      </Panel>

      <Guidance>ซื้อเสื้ออย่างเดียว (ไม่มีบัตรเข้างาน) ระบบบังคับให้ส่งที่บ้าน • ทุกครั้งที่บันทึกสถานะเสื้อ ระบบจะลงหน้า “บันทึกระบบ” อัตโนมัติ</Guidance>
    </>
  );
}

function statusLabel(r: Row) {
  if (r.paid !== "approved") return "รอชำระเงิน";
  return r.shirtStatus === "shipped" ? "ส่งแล้ว" : r.shirtStatus === "picked" ? "รับแล้ว" : r.delivery === "delivery" ? "รอส่ง" : "ยังไม่รับ";
}
