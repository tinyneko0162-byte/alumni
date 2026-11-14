import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/format";

const ITEMS = [
  { key: "ticket", href: "/me/ticket", label: "บัตรของฉัน", icon: "nav-ticket" },
  { key: "wallet", href: "/me/wallet", label: "กระเป๋า", icon: "nav-wallet" },
  { key: "history", href: "/me/history", label: "ประวัติ", icon: "nav-history" },
] as const;

/** Bottom tab bar for attendee screens. */
export function AttendeeNav({ active }: { active: (typeof ITEMS)[number]["key"] }) {
  return (
    <nav className="sticky bottom-0 z-10 mt-auto flex w-full gap-2.5 border-t border-line-slate bg-white px-[18px] pt-4 pb-[26px]">
      {ITEMS.map((it) => {
        const on = it.key === active;
        return (
          <Link
            key={it.key}
            href={it.href}
            aria-current={on ? "page" : undefined}
            className="flex flex-1 flex-col items-center gap-[5px]"
          >
            <Icon name={on ? `${it.icon}-active` : it.icon} size={20} />
            <span className={cx("text-[11px]", on ? "text-brand" : "text-black")}>
              {it.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Small rounded status chip. */
export function Pill({
  children,
  tone = "brand",
  shadow,
}: {
  children: React.ReactNode;
  tone?: "brand" | "brandSoft" | "success" | "danger" | "info";
  shadow?: boolean;
}) {
  const tones = {
    brand: "bg-[rgba(232,44,135,0.09)] text-brand",
    brandSoft: "bg-[rgba(230,158,193,0.25)] text-brand",
    success: "bg-[rgba(22,168,117,0.09)] text-success",
    danger: "bg-[rgba(239,98,108,0.09)] text-danger",
    info: "bg-[rgba(0,163,224,0.09)] text-info",
  };
  return (
    <span
      className={cx(
        "inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap",
        tones[tone],
        shadow && "shadow-[0_4px_4px_rgba(0,0,0,0.25)]",
      )}
    >
      {children}
    </span>
  );
}
