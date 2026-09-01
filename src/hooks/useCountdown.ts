"use client";

import { useEffect, useState } from "react";
import {
  getCountdownTo,
  formatCountdown,
  type CountdownParts,
} from "@/lib/gameweek-timing";

export function useCountdown(target: Date) {
  const targetMs = target.getTime();

  const [parts, setParts] = useState<CountdownParts>(() =>
    getCountdownTo(new Date(targetMs))
  );

  useEffect(() => {
    const deadline = new Date(targetMs);
    const tick = () => {
      const next = getCountdownTo(deadline);
      setParts((prev) =>
        prev.totalMs === next.totalMs &&
        prev.isExpired === next.isExpired &&
        prev.seconds === next.seconds
          ? prev
          : next
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  return {
    ...parts,
    formatted: formatCountdown(parts),
  };
}
