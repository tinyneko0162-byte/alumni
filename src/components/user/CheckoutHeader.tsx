import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/format";
import { BrandMark } from "./MobileShell";

const STEPS = ["เลือกสินค้า", "โอนและแนบสลิป", "รอตรวจสอบ"];

/** Brand mark + back button + title + "0X / 03" + 3-step progress bar. */
export function CheckoutHeader({
  title,
  step,
  backHref,
}: {
  title: string;
  /** 1-based step index */
  step: 1 | 2 | 3;
  backHref: string;
}) {
  return (
    <>
      <div className="px-6 pt-6">
        <BrandMark />
      </div>
      <div className="flex h-16 items-center gap-3 px-6">
        <Link
          href={backHref}
          aria-label="ย้อนกลับ"
          className="flex size-9 items-center justify-center rounded-xl bg-white transition hover:bg-brand-tint"
        >
          <Icon name="chevron-left" size={20} />
        </Link>
        <h1 className="flex-1 text-[18px] text-ink">{title}</h1>
        <p className="font-latin text-[12px] text-black">
          0{step} / 03
        </p>
      </div>
      <div className="px-6 pt-2">
        <ol className="flex items-start gap-1.5">
          {STEPS.map((label, i) => {
            const done = i < step;
            const current = i === step - 1;
            return (
              <li key={label} className="flex flex-1 flex-col gap-2">
                <span
                  className={cx(
                    "h-1 w-full rounded-full",
                    done ? "bg-brand" : "bg-line",
                  )}
                />
                <span
                  className={cx(
                    "text-[10px] whitespace-nowrap",
                    current ? "font-semibold text-brand" : "text-black",
                  )}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </>
  );
}
