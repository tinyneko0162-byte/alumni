import Link from "next/link";
import { cx } from "@/lib/format";

const base =
  "flex h-[54px] w-full items-center justify-center gap-2 rounded-xl border bg-brand text-[15px] font-semibold text-white transition hover:brightness-95 active:brightness-90 disabled:cursor-not-allowed disabled:opacity-50";

/** Pink full-width CTA with trailing arrow. Renders a Link when `href` is set. */
export function PrimaryButton({
  children,
  href,
  type = "button",
  disabled,
  onClick,
  softBorder,
}: {
  children: React.ReactNode;
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  /** Figma uses a pale-pink border on checkout CTAs */
  softBorder?: boolean;
}) {
  const cls = cx(base, softBorder ? "border-brand-soft" : "border-brand");
  const content = (
    <>
      {children}
    </>
  );
  if (href && !disabled) {
    return (
      <Link href={href} className={cls} onClick={onClick}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} disabled={disabled} onClick={onClick}>
      {content}
    </button>
  );
}
