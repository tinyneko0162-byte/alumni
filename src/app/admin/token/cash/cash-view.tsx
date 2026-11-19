"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandButton, Chip, DataTable, Field, OutlineButton, PageHeading, Panel } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { QrScanner } from "@/components/ui/QrScanner";
import { cashTopup, lookupWallet } from "@/lib/actions";
import type { getTokenCash } from "@/lib/admin-data";
import { parseQr } from "@/lib/qr-payload";

type Data = Awaited<ReturnType<typeof getTokenCash>>;
type Wallet = Data["wallets"][number];

const fmt = (n: number) => n.toLocaleString("en-US");
const baht2 = (n: number) => `฿${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
const shortWallet = (id: string) => `W-•••-${id.slice(-4)}`;

export function CashView({ data }: { data: Data }) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [cash, setCash] = useState(String(data.defaultCash));
  const [received, setReceived] = useState(true);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState(data.recent);
  const amount = Math.max(0, Math.floor(Number(cash) || 0));

  const find = async (id: string) => {
    const res = await lookupWallet(id);
    setNotFound(!res.ok);
    setSaved(false);
    setError(null);
    if (res.ok) setWallet(res.wallet);
  };

  const onScan = (text: string) => {
    const qr = parseQr(text);
    if (qr?.kind === "wallet") void find(qr.id);
    else setNotFound(true);
  };

  const rescan = () => {
    setWallet(null);
    setNotFound(false);
    setSaved(false);
  };

  const manual = () => {
    const id = prompt("กรอก Wallet ID (เช่น WLT-RF26-0842)")?.trim();
    if (id) void find(id);
  };

  const confirm = async () => {
    if (!wallet || amount <= 0 || !received || busy) return;
    setBusy(true);
    setError(null);
    const res = await cashTopup({ walletId: wallet.id, amount });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    const time = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
    setWallet({ ...wallet, balance: res.balance });
    setRecent((r) => [{ id: res.id, wallet: shortWallet(wallet.id), cash: amount, tokens: amount, time, status: "สำเร็จ" }, ...r]);
    setSaved(true);
    setReceived(false);
  };

  return (
    <>
      <PageHeading title="เติม Token ด้วยเงินสด" description={data.description} />

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <div className="flex flex-col gap-5 xl:w-[415px]">
          <Panel title="สแกน Wallet ลูกค้า" aside={<Icon name="a-camera" size={18} />}>
            <QrScanner onScan={onScan} className="h-[280px]" />
            <div className="flex gap-2.5">
              <OutlineButton icon="a-refresh-cw" className="flex-1" onClick={rescan}>
                สแกนใหม่
              </OutlineButton>
              <OutlineButton icon="a-keyboard" onClick={manual}>
                กรอก Wallet ID
              </OutlineButton>
            </div>
          </Panel>
          {wallet ? (
            <div className="flex items-start gap-2.5 rounded-lg bg-admin-ok-tint p-3">
              <Icon name="a-circle-check" size={18} />
              <p className="flex-1 text-[12px] leading-[1.55] text-admin-ok">พบ Wallet แล้ว, ตรวจชื่อและรหัสกับลูกค้าก่อนรับเงิน</p>
            </div>
          ) : (
            <div className={notFound ? "rounded-lg bg-[#fdecee] p-3 text-[12px] leading-[1.55] text-[#c2414b]" : "rounded-lg bg-admin-head p-3 text-[12px] leading-[1.55] text-admin-muted"}>{notFound ? "ไม่พบ Wallet นี้, ลองสแกนใหม่หรือตรวจรหัสอีกครั้ง" : "ยังไม่ได้สแกน Wallet ลูกค้า"}</div>
          )}
        </div>

        <Panel title="เตรียมเติม Token" aside={saved ? <Chip tone="ok">บันทึกแล้ว</Chip> : <Chip tone="warn">ยังไม่บันทึก</Chip>} className="flex-1">
          {wallet && (
            <>
              <div className="flex items-center gap-[13px] rounded-lg bg-brand-tint p-[15px]">
                <span className="flex size-10 items-center justify-center rounded-[10px] bg-white">
                  <Icon name="a-wallet" size={20} />
                </span>
                <div className="flex flex-1 flex-col gap-0.5 leading-[1.55]">
                  <p className="text-[15px] font-semibold text-admin-ink">{wallet.owner}</p>
                  <p className="text-[12px] text-black">{wallet.id}</p>
                </div>
                <Chip tone="ok">{wallet.status}</Chip>
              </div>
              <div className="flex items-center justify-between leading-[1.55]">
                <p className="text-[12px] text-admin-muted">ยอดคงเหลือปัจจุบัน</p>
                <p className="text-[13px] font-medium text-admin-ink">{fmt(wallet.balance)} Token</p>
              </div>
            </>
          )}
          <div className="h-px bg-admin-line" />
          <div className="flex flex-col gap-4 sm:flex-row">
            <Field
              label="เงินสดที่รับ (บาท) *"
              inputMode="decimal"
              value={cash}
              onChange={(e) => {
                setCash(e.target.value);
                setSaved(false);
              }}
            />
            <Field label="จำนวนที่เติม (Token) *" value={String(amount)} readOnly />
          </div>
          <p className="text-[11px] leading-[1.55] text-admin-muted">
            {data.rateNote}, ฿{fmt(amount)} = {fmt(amount)} Token
          </p>
          <div className="flex items-center justify-between rounded-lg bg-admin-head p-4 leading-[1.55]">
            <div className="flex flex-col gap-1 text-admin-muted">
              <p className="text-[12px]">ยอดหลังเติม</p>
              <p className="text-[11px]">
                {fmt(wallet?.balance ?? 0)} + {fmt(amount)} Token
              </p>
            </div>
            <p className="font-latin text-[28px] font-semibold text-black">{fmt((wallet?.balance ?? 0) + (saved ? 0 : amount))} Token</p>
          </div>
          <label className="flex cursor-pointer items-center gap-[9px]">
            <input type="checkbox" className="sr-only" checked={received} onChange={(e) => setReceived(e.target.checked)} />
            {received ? <Icon name="a-square-check" size={19} /> : <span className="size-[19px] rounded-[4px] border-2 border-admin-side-muted" />}
            <span className="text-[12px] leading-[1.55] text-admin-ink">ได้รับเงินสด {baht2(amount)} ครบถ้วนแล้ว</span>
          </label>
          {error && <p role="alert" className="text-[12px] text-danger">{error}</p>}
          <BrandButton icon="a-plus-white" onClick={confirm} disabled={!wallet || amount <= 0 || !received || busy} className="w-full">
            {busy ? "กำลังบันทึก…" : "ยืนยันเติม"}
          </BrandButton>
          <p className="text-[11px] leading-[1.55] text-admin-muted">บันทึกเงินสดและเพิ่ม Token เพียงครั้งเดียวหลังยืนยัน</p>
        </Panel>
      </div>

      <Panel
        title="เติมเงินสดล่าสุดที่จุดนี้"
        aside={
          <Link href="/admin/token/history" className="text-[12px] text-admin-indigo hover:underline">
            ประวัติทั้งหมด
          </Link>
        }
      >
        <DataTable
          rows={recent}
          rowKey={(r) => r.id}
          columns={[
            { key: "id", header: "รายการ", width: 149, strong: true, render: (r) => r.id },
            { key: "w", header: "Wallet", render: (r) => r.wallet },
            { key: "c", header: "เงินสด (บาท)", render: (r) => baht2(r.cash) },
            { key: "t", header: "เติม (Token)", render: (r) => `+${fmt(r.tokens)}` },
            { key: "time", header: "เวลา", width: 104, render: (r) => r.time },
            { key: "s", header: "สถานะ", width: 129, render: (r) => <Chip tone="ok">{r.status}</Chip> },
          ]}
        />
      </Panel>
    </>
  );
}
