"use client";

import { downloadCsv } from "@/components/admin/history";
import { BrandButton } from "@/components/admin/ui";

export function ExportButton({ rows, filename = "revenue-report.csv" }: { rows: (string | number)[][]; filename?: string }) {
  return (
    <BrandButton icon="a-download-white" onClick={() => downloadCsv(filename, rows)}>
      ส่งออกรายงาน
    </BrandButton>
  );
}
