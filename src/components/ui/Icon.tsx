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
      aria-hidden={alt ? undefined : true}
      className={`block shrink-0 ${className ?? ""}`}
      style={{ width: w, height: h }}
    />
  );
}
