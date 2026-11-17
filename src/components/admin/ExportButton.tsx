"use client";

import { downloadCsv } from "@/components/admin/history";
import { BrandButton, OutlineButton } from "@/components/admin/ui";

/** "ส่งออกรายงาน" button that downloads the given rows as a CSV file. */
export function ExportButton({
  rows,
  filename = "report.csv",
  variant = "brand",
}: {
  rows: (string | number)[][];
  filename?: string;
  variant?: "brand" | "outline";
}) {
  const onClick = () => downloadCsv(filename, rows);
  return variant === "outline" ? (
    <OutlineButton icon="a-download" onClick={onClick}>
      ส่งออกรายงาน
    </OutlineButton>
  ) : (
    <BrandButton icon="a-download-white" onClick={onClick}>
      ส่งออกรายงาน
    </BrandButton>
  );
}
