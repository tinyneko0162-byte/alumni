/**
 * Icons exported from Figma with black / navy strokes. In dark mode they are
 * inverted so they stay visible. Add a name here when exporting a new dark icon.
 */
const DARK_ICONS = new Set([
  "a-shopping-basket",
  "eye-off",
  "lock-keyhole",
  "mail",
  "nav-history",
  "nav-ticket",
  "nav-wallet",
  "paperclip",
  "phone",
  "share-2",
  "ticket-pass",
  "trash-2",
  "user-round",
]);

/**
 * Renders an SVG exported from Figma (stored in /public/icons).
 * The SVG keeps its own root width/height; `size` only sizes the wrapper.
 */
export function Icon({
  name,
  size,
  width,
  height,
  className,
  alt = "",
}: {
  name: string;
  size?: number;
  width?: number;
  height?: number;
  className?: string;
  alt?: string;
}) {
  const w = width ?? size ?? 20;
  const h = height ?? size ?? 20;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/icons/${name}.svg`}
      width={w}
      height={h}
      alt={alt}
      data-dark-icon={DARK_ICONS.has(name) ? "" : undefined}
      aria-hidden={alt ? undefined : true}
      className={`block shrink-0 ${className ?? ""}`}
      style={{ width: w, height: h }}
    />
  );
}
