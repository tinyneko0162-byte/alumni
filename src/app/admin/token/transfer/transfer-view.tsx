"use client";

import { useState } from "react";
import { SlipReceipt } from "@/components/admin/SlipReceipt";
import { BrandButton, Chip, Field, Guidance, OutlineButton, PageHeading, Panel, SearchBox } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { resolveTransfer } from "@/lib/actions";
import type { getTokenTransfers } from "@/lib/admin-data";
import { cx } from "@/lib/format";

type Data = Awaited<ReturnType<typeof getTokenTransfers>>;
type Req = Data["requests"][number];
type Status = "pending" | "done" | "resubmit";

const fmt = (n: number) => n.toLocaleString("en-US");

export function TransferView({ data }: { data: Data }) {
  const [status, setStatus] = useState<Record<string, Status>>(() => Object.fromEntries(data.requests.map((r) => [r.id, r.state])));
  const [tab, setTab] = useState<Status>("pending");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState(data.requests[0].id);
  const [lookup, setLookup] = useState(data.requests[0].wallet);
  const [verified, setVerified] = useState(true);

  const list = data.requests.filter((r) => status[r.id] === tab && r.wallet.includes(q.trim()));
  const current: Req = data.requests.find((r) => r.id === selectedId) ?? data.requests[0];
  const pendingCount = data.requests.filter((r) => status[r.id] === "pending").length;

  const select = (r: Req) => {
    setSelectedId(r.id);
    setLookup(r.wallet);
    setVerified(false);
  };

  const [error, setError] = useState<string | null>(null);

  const resolve = async (s: Exclude<Status, "pending">) => {
    setError(null);
    const res = await resolveTransfer(current.id, s);
    if (!res.ok) return setError(res.error);
    setStatus((m) => ({ ...m, [current.id]: s }));
    const next = data.requests.find((r) => r.id !== current.id && status[r.id] === "pending");
    if (next) select(next);
  };

  const isPending = status[current.id] === "pending";

  return (
    <>
      <PageHeading title="ตรวจเงินโอนเพื่อเติม Token" description={data.description} actions={<Chip tone="warn">รอตรวจ {pendingCount} รายการ</Chip>} />

      <div role="tablist" className="flex gap-2 border-b border-admin-line">
        {(
          [
            ["pending", `รอตรวจ ${pendingCount}`],
            ["done", "เติมสำเร็จ"],
            ["resubmit", "ขอหลักฐานใหม่"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cx(
              "-mb-px border-b-2 px-4 py-[11px] text-[13px] leading-[1.55]",
              tab === key ? "border-admin-indigo font-semibold text-admin-indigo" : "border-transparent text-admin-muted hover:text-admin-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <Panel title="คำขอเติม Token" className="p-4 xl:w-[240px]">
          <SearchBox value={q} onChange={setQ} placeholder="ค้นหา Wallet ID" />
          <ul className="flex flex-col gap-[18px]">
            {list.map((r) => {
              const on = r.id === current.id;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => select(r)}
                    className={cx(
                      "flex w-full flex-col items-start gap-[7px] rounded-lg border p-[13px] text-left leading-[1.55]",
                      on ? "border-brand bg-brand-tint" : "border-admin-line bg-white hover:bg-admin-head",
                    )}
                  >
                    <span className="flex w-full justify-between">
                      <span className={cx("text-[11px] font-semibold", on ? "text-admin-indigo" : "text-admin-ink")}>{r.id}</span>
                      <span className="text-[10px] text-admin-muted">{r.time}</span>
                    </span>
                    <span className="text-[13px] font-medium text-admin-ink">{r.wallet}</span>
                    <span className="text-[11px] text-admin-muted">
                      ฿{fmt(r.amount)} → {fmt(r.amount)} Token
                    </span>
                    <StatusChip s={status[r.id]} />
                  </button>
                </li>
              );
            })}
            {list.length === 0 && <li className="py-6 text-center text-[12px] text-admin-muted">ไม่มีรายการ</li>}
          </ul>
          <p className="text-[10px] leading-[1.55] text-admin-muted">
            แสดง {list.length} จาก {tab === "pending" ? pendingCount : list.length} รายการ
          </p>
        </Panel>

        <Panel title="สลิปเติม Token" className="flex-1">
          <SlipReceipt
            amount={current.amount}
            purpose="เติม Token"
            fromName={current.owner}
            fromAccount={current.fromAccount}
            toName={data.companyName}
            toAccount={data.companyAccount}
            paidAt={current.paidAt}
            reference={current.reference}
            fileName={current.slipFile}
            footer="ไฟล์ตัวอย่าง • ไม่ใช่หลักฐานการชำระเงินจริง"
          />
          <div className="flex items-start gap-2.5 rounded-lg bg-admin-ok-tint p-3">
            <Icon name="a-circle-check" size={18} />
            <p className="flex-1 text-[12px] leading-[1.55] text-admin-ok">ไม่พบเลขอ้างอิงซ้ำในประวัติการเติม Token</p>
          </div>
        </Panel>

        <Panel title="เครดิตเข้า Wallet" aside={<span className="text-[11px] text-admin-muted">{current.id}</span>} className="xl:w-[350px]">
          <Field
            label="Wallet ID ที่ลูกค้าส่งมา"
            value={lookup}
            onChange={(e) => {
              setLookup(e.target.value);
              setVerified(false);
            }}
            hint="แสดงแบบปกปิด • ใช้ ID เต็มที่แนบกับคำขอในการค้นหา"
          />
          <OutlineButton icon="a-search" className="w-full" onClick={() => setVerified(true)}>
            ค้นหาและตรวจสอบ Wallet
          </OutlineButton>
          {verified &&
            (lookup.trim() === current.wallet ? (
              <div className="flex items-start gap-2.5 rounded-lg bg-admin-ok-tint p-3">
                <Icon name="a-circle-check-lg" size={20} />
                <div className="flex flex-col gap-[3px] leading-[1.55]">
                  <p className="text-[13px] font-semibold text-admin-ink">{current.owner}</p>
                  <p className="text-[11px] text-admin-ok">Wallet ใช้งานได้ · ID ตรงกับคำขอ</p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-[#fdecee] p-3 text-[12px] leading-[1.55] text-[#c2414b]">Wallet ID ไม่ตรงกับคำขอ</div>
            ))}
          <Detail label="ยอดเงินโอน" value={`฿${current.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} />
          <Detail label="จำนวนที่จะเติม" value={`${fmt(current.amount)} Token`} accent />
          <Detail label="ยอดปัจจุบัน" value={`${fmt(current.balance)} Token`} />
          <div className="h-px bg-admin-line" />
          <Detail label="ยอดหลังเติม" value={`${fmt(current.balance + current.amount)} Token`} accent />
          <p className="text-[11px] leading-[1.55] text-admin-muted">
            1 Token = 1 บาท • ฿{fmt(current.amount)} = {fmt(current.amount)} Token
          </p>
          <Guidance tone="warn">ตรวจยอด ผู้รับ และ Wallet ให้ครบก่อนยืนยัน รายการนี้ยังไม่ถูกเติม Token</Guidance>
          <BrandButton
            icon="a-check-white"
            className="w-full"
            disabled={!isPending || !verified || lookup.trim() !== current.wallet}
            onClick={() => resolve("done")}
          >
            อนุมัติและเติม
          </BrandButton>
          {error && <p role="alert" className="text-[12px] text-danger">{error}</p>}
          <OutlineButton className="w-full" onClick={() => isPending && resolve("resubmit")}>
            ขอหลักฐานใหม่
          </OutlineButton>
        </Panel>
      </div>
    </>
  );
}

function StatusChip({ s }: { s: Status }) {
  if (s === "done") return <Chip tone="ok">เติมสำเร็จ</Chip>;
  if (s === "resubmit") return <Chip tone="danger">ขอหลักฐานใหม่</Chip>;
  return <Chip tone="warn">รอตรวจ</Chip>;
}

function Detail({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between leading-[1.55]">
      <p className="text-[12px] text-admin-muted">{label}</p>
      <p className={cx("text-[13px] font-medium", accent ? "text-admin-indigo" : "text-admin-ink")}>{value}</p>
    </div>
  );
}
