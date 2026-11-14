const nf = new Intl.NumberFormat("en-US");

/** 2360 → "2,360" */
export const num = (n: number) => nf.format(n);

/** 2360 → "฿2,360" */
export const baht = (n: number) => `฿${nf.format(n)}`;

/** Join truthy class names. */
export const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");
