"use client";

import { useEffect, useState } from "react";

// Live countdown to an end time. Renders a placeholder until mounted (avoids an
// SSR/client mismatch), then ticks every second. Renders nothing once elapsed.
function parts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

export function Countdown({ to }: { to: string }) {
  const target = new Date(to).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // Set inside async callbacks (not synchronously in the effect body).
    const raf = requestAnimationFrame(() => setNow(Date.now()));
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, []);

  const remaining = now == null ? null : target - now;
  if (remaining != null && remaining <= 0) return null;

  const { d, h, m, s } = remaining == null ? { d: 0, h: 0, m: 0, s: 0 } : parts(remaining);
  const cells: [number, string][] = [
    [d, "Days"],
    [h, "Hrs"],
    [m, "Min"],
    [s, "Sec"],
  ];

  return (
    <div className="flex items-center gap-2" suppressHydrationWarning>
      {cells.map(([val, label]) => (
        <div
          key={label}
          className="flex min-w-13 flex-col items-center rounded-xl bg-white/15 px-2 py-1.5 backdrop-blur"
        >
          <span className="font-heading text-xl font-extrabold tabular-nums sm:text-2xl">
            {now == null ? "--" : String(val).padStart(2, "0")}
          </span>
          <span className="text-[10px] font-medium tracking-wide uppercase opacity-80">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
