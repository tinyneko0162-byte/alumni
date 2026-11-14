import { cx } from "@/lib/format";

/**
 * Phone-width page container used by every attendee screen.
 * Full-bleed on phones, a centered rounded card on larger screens.
 */
export function MobileShell({
  children,
  width = 402,
  className,
}: {
  children: React.ReactNode;
  width?: 402 | 430;
  className?: string;
}) {
  return (
    <div className="min-h-dvh sm:py-8">
      <div
        className={cx(
          "relative mx-auto flex min-h-dvh w-full flex-col bg-white sm:min-h-[calc(100dvh-4rem)] sm:overflow-hidden sm:rounded-[32px] sm:shadow-[0_10px_40px_rgba(32,33,61,0.08)]",
          width === 430 ? "max-w-[430px]" : "max-w-[402px]",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** "ศิษย์เก่า" wordmark shown at the top of every screen. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <p
      className={cx(
        "font-latin text-[27px] font-extrabold leading-normal text-brand",
        className,
      )}
    >
      ศิษย์เก่า
    </p>
  );
}
