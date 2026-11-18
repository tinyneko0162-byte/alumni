"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-reads the server data every few seconds so new requests from attendees appear without reloading. */
export function LiveRefresh({ every = 5000 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, every);
    return () => clearInterval(t);
  }, [router, every]);
  return null;
}
