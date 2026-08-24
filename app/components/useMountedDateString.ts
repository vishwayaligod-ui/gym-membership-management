"use client";

import { useEffect, useState } from "react";

/**
 * Returns a stable empty string during SSR/hydration and only formats the
 * date after the component has mounted on the client.
 *
 * Why: `new Date().toLocaleDateString()` executed during the initial render
 * produces different output between the Node.js server and some browsers
 * (notably iOS Safari / WebKit ICU), causing React hydration mismatches.
 * iOS and desktop browsers also format locale strings differently, so the
 * mismatch appears only on iPhone.
 *
 * This follows Next.js's documented pattern: render a stable fallback on the
 * server and update the value after mount.
 */
export function useMountedDateString(formatter: () => string): string {
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue(formatter());
    // formatter is intentionally a stable inline closure; run once after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return value;
}