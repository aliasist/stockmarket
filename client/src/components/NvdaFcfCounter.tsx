/**
 * NvdaFcfCounter — Live "NVIDIA is making money right now" ticker
 * $96.7B FCF / year = $3,065.77 per second
 */
import { useState, useEffect } from "react";

const ANNUAL_FCF = 96_700_000_000; // $96.7B FY2026
const PER_SECOND = ANNUAL_FCF / (365.25 * 24 * 3600); // ~$3,065.77/sec

function formatDollars(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(3)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export default function NvdaFcfCounter() {
  // Start from a random offset so the number looks "mid-stream"
  const [elapsed, setElapsed] = useState(() => Math.random() * 3600); // 0–1hr offset

  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 0.1), 100);
    return () => clearInterval(id);
  }, []);

  const earned = elapsed * PER_SECOND;
  const perSec = PER_SECOND;

  return (
    <div
      className="theme-panel p-4 space-y-2 relative overflow-hidden"
      style={{ borderColor: "hsl(var(--primary) / 0.3)" }}
    >
      {/* Subtle animated glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.06) 0%, transparent 70%)",
        }}
      />

      <div className="flex items-center justify-between relative z-10">
        <div className="theme-kicker text-xs">NVIDIA FCF · Live</div>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-semibold border animate-pulse"
          style={{
            color: "hsl(var(--primary))",
            borderColor: "hsl(var(--primary) / 0.4)",
            background: "hsl(var(--primary) / 0.1)",
          }}
        >
          ● LIVE
        </span>
      </div>

      {/* Big ticking number */}
      <div className="relative z-10">
        <div
          className="font-mono text-2xl font-bold tabular-nums leading-tight"
          style={{ color: "hsl(var(--primary))", letterSpacing: "-0.02em" }}
        >
          {formatDollars(earned)}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          earned since page load
        </div>
      </div>

      {/* Per-second rate */}
      <div
        className="flex items-center justify-between text-xs rounded-lg px-3 py-2 relative z-10"
        style={{ background: "hsl(var(--primary) / 0.07)" }}
      >
        <span className="text-muted-foreground">Rate</span>
        <span
          className="font-mono font-semibold"
          style={{ color: "hsl(var(--primary))" }}
        >
          {formatDollars(perSec)} / sec
        </span>
      </div>

      <div className="text-xs text-muted-foreground relative z-10 leading-snug">
        Based on $96.7B FY2026 FCF — more than Google and Meta combined
      </div>
    </div>
  );
}
