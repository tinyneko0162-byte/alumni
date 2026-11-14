"use client";

import Link from "next/link";
import { useState } from "react";
import { Chip, DataTable, OutlineButton, PageHeading, Panel } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import type { getStorePos } from "@/lib/admin-data";
import { usePosCart } from "@/lib/store-cart";

type Data = Awaited<ReturnType<typeof getStorePos>>;

export function CheckoutView({ store, wallet, recent: initialRecent }: { store: Data["stores"][number]; wallet: Data["wallet"]; recent: Data["recent"] }) {
  const { qty, setQty } = usePosCart(store.id);
  const [scanned, setScanned] = useState(true);
  const [paid, setPaid] = useState<string | null>(null);
  const [balance, setBalance] = useState(wallet.balance);
  const [recent, setRecent] = useState(initialRecent);
  const p = store.product;
  const total = qty * p.price;
  const enough = balance >= total;

  const pay = () => {
    if (!scanned || qty === 0 || !enough) return;
    const no = Math.max(...recent.map((r) => Number(r.id.split("-")[1]))) + 1;
    const id = `SALE-${String(no).padStart(4, "0")}`;
    const time = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
    setRecent((r) => [{ id, wallet: wallet.id, amount: total, time, status: "สำเร็จ" }, ...r]);
    setBalance((b) => b - total);
    setPaid(id);
    setQty(0);
  };

  return (
    <>
      <PageHeading title="ชำระเงินค่าสินค้า" description="สแกน Wallet ลูกค้า" />

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <div className="flex flex-col gap-5 xl:w-[611px]">
          <Panel title="สแกน Wallet ลูกค้า" aside={<Icon name="a-camera" size={18} />}>
            <div className="flex h-[280px] flex-col items-center justify-center gap-4 rounded-xl bg-[#10182a]">
              <div className="flex items-center gap-1.5">
                <Icon name="a-camera-dot" size={5} />
                <p className="text-[11px] leading-[1.55] text-[#c5cde0]">กล้องพร้อม • สแกน Wallet QR</p>
              </div>
              <div className="relative flex h-[150px] w-[172px] items-center justify-center rounded-[14px] border-2 border-[#a7a0f9]">
                <Icon name="a-scan-qr-code" size={58} />
                <span className="absolute top-[86px] left-2.5 h-0.5 w-[148px] animate-pulse bg-[#b1a9ff]" />
              </div>
              <p className="text-[11px] leading-[1.55] text-[#c5cde0]">วาง QR ของลูกค้าให้อยู่ในกรอบ</p>
            </div>
            <div className="flex gap-2.5">
              <OutlineButton icon="a-refresh-cw" className="flex-1" onClick={() => setScanned(true)}>
                สแกนใหม่
              </OutlineButton>
              <OutlineButton icon="a-keyboard" onClick={() => setScanned(!!prompt("กรอก Wallet ID")?.trim())}>
                กรอก Wallet ID
              </OutlineButton>
            </div>
          </Panel>

          <Panel
            title="รายการล่าสุด"
            aside={
              <Link href={`/admin/store/history?store=${store.id}`} className="text-[12px] text-admin-indigo hover:underline">
                ประวัติทั้งหมด →
              </Link>
            }
          >
            <DataTable
              rows={recent}
              rowKey={(r) => r.id}
              columns={[
                { key: "id", header: "รายการ", width: 149, strong: true, render: (r) => r.id },
                { key: "w", header: "Wallet", render: (r) => r.wallet },
                { key: "a", header: "ชำระเงิน (Token)", render: (r) => r.amount },
                { key: "t", header: "เวลา", width: 104, render: (r) => r.time },
                { key: "s", header: "สถานะ", width: 129, render: (r) => <Chip tone="ok">{r.status}</Chip> },
              ]}
            />
          </Panel>
        </div>

        <Panel
          title="เตรียมชำระเงิน"
          aside={paid ? <Chip tone="ok">บันทึกแล้ว</Chip> : <Chip tone="warn">ยังไม่บันทึก</Chip>}
          className="min-h-[640px] flex-1 [&_h2]:text-[16px]"
        >
          {scanned ? (
            <div className="flex items-center gap-[13px] rounded-lg bg-brand-tint p-[15px]">
              <span className="flex size-10 items-center justify-center rounded-[10px] bg-white">
                <Icon name="a-wallet" size={20} />
              </span>
              <div className="flex flex-1 flex-col leading-[1.55]">
                <p className="text-[16px] font-semibold text-admin-ink">{wallet.owner}</p>
                <p className="text-[16px] text-brand">{wallet.id}</p>
              </div>
              <Chip tone="ok">{wallet.status}</Chip>
            </div>
          ) : (
            <p className="rounded-lg bg-admin-head p-4 text-[13px] text-admin-muted">ยังไม่ได้สแกน Wallet</p>
          )}

          <div className="flex flex-col gap-3 px-0 sm:px-6">
            {qty > 0 ? (
              <>
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-[3px] text-[20px] leading-[1.55]">
                    <p className="font-medium text-admin-ink">{p.name}</p>
                    <p className="text-admin-muted">
                      {p.price} Token / {p.unit}
                    </p>
                  </div>
                  <button type="button" aria-label="ลบสินค้า" onClick={() => setQty(0)}>
                    <Icon name="a-trash-2" size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex overflow-hidden rounded-lg border border-admin-line">
                    <button type="button" aria-label="ลด" onClick={() => setQty(qty - 1)} className="flex size-9 items-center justify-center hover:bg-admin-head">
                      <Icon name="a-minus" size={15} />
                    </button>
                    <span className="flex h-9 w-11 items-center justify-center bg-admin-head text-[20px] font-semibold text-admin-ink">{qty}</span>
                    <button type="button" aria-label="เพิ่ม" onClick={() => setQty(qty + 1)} className="flex size-9 items-center justify-center hover:bg-admin-head">
                      <Icon name="a-plus" size={15} />
                    </button>
                  </div>
                  <p className="text-[20px] font-semibold leading-[1.55] text-admin-ink">{total} Token</p>
                </div>
                <div className="h-px bg-admin-line" />
              </>
            ) : paid ? (
              <div className="flex items-start gap-2.5 rounded-lg bg-admin-ok-tint p-3">
                <Icon name="a-circle-check" size={18} />
                <p className="flex-1 text-[12px] leading-[1.55] text-admin-ok">
                  ชำระสำเร็จ · {paid} · ยอดคงเหลือ Wallet {balance.toLocaleString("en-US")} Token
                </p>
              </div>
            ) : (
              <p className="text-[13px] text-admin-muted">ไม่มีสินค้าในตะกร้า</p>
            )}
          </div>

          <div className="mt-auto flex flex-col gap-3 sm:px-6">
            <div className="flex items-center justify-between text-[16px] leading-[1.55]">
              <p className="text-admin-muted">รวมสินค้า</p>
              <p className="font-medium text-admin-ink">{qty > 0 ? 1 : 0} รายการ</p>
            </div>
            <div className="flex items-center justify-between font-semibold leading-[1.55]">
              <p className="text-[24px] text-admin-ink">ยอดชำระ</p>
              <p className="font-latin text-[29px] text-black">{total} Token</p>
            </div>
            {scanned && qty > 0 && !enough && <p className="text-[12px] text-danger">ยอด Token ใน Wallet ไม่พอ</p>}
            <button
              type="button"
              onClick={pay}
              disabled={!scanned || qty === 0 || !enough}
              className="mx-auto mt-2 flex h-[72px] w-full max-w-[388px] items-center justify-center gap-2 rounded-lg bg-brand text-[20px] font-semibold leading-[1.55] text-white transition hover:brightness-95 disabled:opacity-50"
            >
              <Icon name="a-scan-line-white" size={17} />
              สแกน Wallet เพื่อชำระ
            </button>
            {paid && (
              <Link href={`/admin/store/pos?store=${store.id}`} className="text-center text-[12px] text-admin-indigo hover:underline">
                ← กลับไปขายรายการถัดไป
              </Link>
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}
