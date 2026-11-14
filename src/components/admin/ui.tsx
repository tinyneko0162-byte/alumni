import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/format";

/** Rounded status chip with a leading dot. */
export function Chip({
  children,
  tone = "ok",
}: {
  children: React.ReactNode;
  tone?: "ok" | "indigo" | "warn" | "danger" | "muted" | "brand";
}) {
  const tones = {
    ok: { box: "bg-admin-ok-tint text-admin-ok", dot: "bg-admin-ok" },
    indigo: { box: "bg-admin-indigo-tint text-admin-indigo", dot: "bg-admin-indigo" },
    warn: { box: "bg-warning-tint text-admin-warn", dot: "bg-admin-warn" },
    danger: { box: "bg-[#fdecee] text-[#c2414b]", dot: "bg-[#c2414b]" },
    muted: { box: "bg-admin-head text-admin-muted", dot: "bg-admin-muted" },
    brand: { box: "bg-brand-tint text-brand", dot: "bg-brand" },
  }[tone];
  return (
    <span className={cx("inline-flex items-center gap-[5px] rounded-full px-[9px] py-[3px] text-[11px] font-semibold leading-[1.55] whitespace-nowrap", tones.box)}>
      <span className={cx("size-[5px] rounded-full", tones.dot)} />
      {children}
    </span>
  );
}

/** Page title + description + optional actions on the right. */
export function PageHeading({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1 leading-[1.55]">
        <h1 className="text-[26px] font-semibold text-admin-ink">{title}</h1>
        {description && <p className="text-[12px] text-admin-muted">{description}</p>}
      </div>
      {actions && <div className="flex gap-3">{actions}</div>}
    </div>
  );
}

/** Secondary white button. */
export function OutlineButton({
  icon,
  children,
  type = "button",
  className,
  onClick,
}: {
  icon?: string;
  children: React.ReactNode;
  type?: "button" | "submit";
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cx(
        "flex min-h-[42px] items-center justify-center gap-2 rounded-lg border border-admin-line bg-white px-4 py-[9px] text-[13px] font-semibold leading-[1.55] text-admin-ink transition hover:bg-admin-head",
        className,
      )}
    >
      {icon && <Icon name={icon} size={17} />}
      {children}
    </button>
  );
}

/** Pink primary button. */
export function BrandButton({
  icon,
  children,
  type = "button",
  className,
  onClick,
  disabled,
}: {
  icon?: string;
  children: React.ReactNode;
  type?: "button" | "submit";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "flex min-h-[42px] items-center justify-center gap-2 rounded-lg bg-brand px-4 py-[9px] text-[13px] font-semibold leading-[1.55] text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {icon && <Icon name={icon} size={17} />}
      {children}
    </button>
  );
}

/** White bordered card. */
export function Panel({
  title,
  aside,
  children,
  className,
}: {
  title?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "flex min-w-0 flex-col gap-[18px] rounded-xl border border-admin-line bg-white p-5 shadow-[0_3px_12px_rgba(27,33,64,0.03)]",
        className,
      )}
    >
      {(title || aside) && (
        <div className="flex items-center justify-between gap-3 leading-[1.55]">
          {title && <h2 className="text-[16px] font-semibold text-admin-ink">{title}</h2>}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

/** KPI tile. */
export function Metric({
  label,
  value,
  note,
  noteTone,
}: {
  label: string;
  value: string;
  note?: string;
  noteTone?: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-xl border border-admin-line bg-white p-5 leading-[1.55]">
      <p className="text-[12px] text-admin-muted">{label}</p>
      <p className="font-latin text-[29px] font-semibold text-admin-ink">{value}</p>
      {note && (
        <p className={cx("text-[11px]", noteTone === "warning" ? "text-admin-warn" : "text-admin-muted")}>{note}</p>
      )}
    </div>
  );
}

/** Labelled admin form input (or textarea when `rows` is set). */
export function Field({
  label,
  hint,
  rows,
  className,
  ...input
}: {
  label: string;
  hint?: string;
  rows?: number;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement> &
  React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const cls =
    "w-full rounded-lg border border-admin-line bg-white p-3 text-[13px] leading-[1.55] text-admin-ink outline-none placeholder:text-admin-muted focus:border-brand-soft focus:ring-2 focus:ring-brand/10";
  return (
    <label className={cx("flex w-full flex-col gap-1.5", className)}>
      <span className="text-[12px] font-semibold leading-[1.55] text-admin-ink">{label}</span>
      {rows ? (
        <textarea rows={rows} className={cx(cls, "min-h-[110px] resize-y")} {...(input as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} />
      ) : (
        <input className={cx(cls, "min-h-[44px]")} {...(input as React.InputHTMLAttributes<HTMLInputElement>)} />
      )}
      {hint && <span className="text-[11px] leading-[1.55] text-admin-muted">{hint}</span>}
    </label>
  );
}

/** Search box with magnifier icon. */
export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex h-[42px] w-full items-center gap-[9px] rounded-lg border border-admin-line bg-white px-3 focus-within:border-brand-soft">
      <Icon name="a-search" size={17} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[12px] text-admin-ink outline-none placeholder:text-admin-muted"
      />
    </label>
  );
}

/** Info bar. "brand" = pink bar from Figma, "warn" = amber. */
export function Guidance({ children, tone = "brand" }: { children: React.ReactNode; tone?: "brand" | "warn" }) {
  return (
    <div className={cx("flex items-start gap-2.5 rounded-lg p-3", tone === "brand" ? "bg-brand-soft" : "bg-warning-tint")}>
      <Icon name={tone === "brand" ? "a-info-dark" : "a-info-warn"} size={18} />
      <p className={cx("flex-1 text-[12px] leading-[1.55]", tone === "brand" ? "text-black" : "text-admin-warn")}>{children}</p>
    </div>
  );
}

/** "แสดง 1–N จาก X" + prev / current page / next. Static for the mock. */
export function Pagination({ label }: { label: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-[11px] leading-[1.55] text-admin-muted">{label}</p>
      <div className="flex gap-2">
        <OutlineButton icon="a-chevron-left">ก่อนหน้า</OutlineButton>
        <span className="rounded-md bg-admin-indigo-tint p-2.5 text-[12px] leading-[1.55] text-admin-indigo">1</span>
        <OutlineButton icon="a-chevron-right-dark">ถัดไป</OutlineButton>
      </div>
    </div>
  );
}

/** Native select styled like the Figma outline filter button (icon + label). */
export function SelectButton({
  icon,
  value,
  onChange,
  options,
  label,
}: {
  icon: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <label className="relative flex min-h-[42px] shrink-0 items-center gap-2 rounded-lg border border-admin-line bg-white px-4 py-[9px] text-[13px] font-semibold leading-[1.55] text-admin-ink focus-within:border-brand-soft hover:bg-admin-head">
      <Icon name={icon} size={17} />
      <span>{options.find((o) => o.value === value)?.label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Two stacked lines inside a table cell. */
export function TwoLine({ top, bottom, boldBottom }: { top: React.ReactNode; bottom?: React.ReactNode; boldBottom?: boolean }) {
  return (
    <>
      <p>{top}</p>
      {bottom && <p className={boldBottom ? "font-bold" : undefined}>{bottom}</p>}
    </>
  );
}

export type Column<T> = {
  key: string;
  header: string;
  /** fixed width in px; omit for flexible column */
  width?: number;
  render: (row: T) => React.ReactNode;
  strong?: boolean;
};

/** Simple table matching the Figma "Data table" (rounded header row, divided records). */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (r: T) => string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left">
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th
                key={c.key}
                style={c.width ? { width: c.width } : undefined}
                className={cx(
                  "bg-admin-head px-3 py-2.5 text-[11px] font-semibold leading-[1.55] text-admin-muted",
                  i === 0 && "rounded-l-md",
                  i === columns.length - 1 && "rounded-r-md",
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)}>
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cx(
                    "h-[53px] border-b border-admin-line px-3 py-3 text-[12px] leading-[1.55]",
                    c.strong ? "font-medium text-admin-ink" : "text-admin-muted",
                  )}
                >
                  {c.render(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
