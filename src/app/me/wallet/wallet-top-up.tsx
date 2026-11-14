"use client";

import { useState } from "react";
import { SlipUpload, type SlipFile } from "@/components/user/SlipUpload";

const SAMPLE: SlipFile = { fileName: "slip_CF26-0148.jpg", sizeLabel: "1.2 MB" };

export function WalletTopUp({ accept, maxSizeMb }: { accept: string; maxSizeMb: number }) {
  const [slip, setSlip] = useState<SlipFile>(SAMPLE);
  return <SlipUpload value={slip} onChange={setSlip} accept={accept} maxSizeMb={maxSizeMb} dashedBg={false} />;
}
