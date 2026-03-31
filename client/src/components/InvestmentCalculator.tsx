/**
 * InvestmentCalculator — Interactive "$X in NVDA vs S&P 500" calculator
 * Uses real 5-year return data: NVDA +1,000% | SPY +51%
 */
import { useState } from "react";

const NVDA_RETURN = 10.0; // 1,000% = 10x multiplier  (Apr 2021 → Mar 2026)
const SPY_RETURN = 0.51;  // 51%

const PRESETS = [1_000, 5_000, 10_000, 25_000, 50_000];

function fmt(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function InvestmentCalculator() {
  const [amount, setAmount] = useState(10_000);
  const [inputVal, setInputVal] = useState("10000");

  const nvdaValue = amount + amount * NVDA_RETURN;
  const spyValue = amount + amount * SPY_RETURN;
  const nvdaGain = nvdaValue - amount;
  const spyGain = spyValue - amount;
  const outperformance = nvdaValue - spyValue;

  function handleInput(raw: string) {
    setInputVal(raw);
    const n = parseInt(raw.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(n) && n >= 0 && n <= 10_000_000) setAmount(n);
  }

  return (
    <div className="theme-panel p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="theme-kicker text-xs">What If Calculator</div>
          <div className="text-sm font-semibold text-foreground">
            April 2021 → March 2026
          </div>
        </div>
      </div>

      {/* Amount input */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">
          If I invested…
        </label>
        <div className="relative">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold"
            style={{ color: "hsl(var(--primary))" }}
          >
            $
          </span>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => handleInput(e.target.value)}
            className="w-full pl-7 pr-3 py-2.5 rounded-lg border bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-1"
            style={{ borderColor: "hsl(var(--border))" }}
            placeholder="10000"
          />
        </div>
        {/* Presets */}
        <div className="flex gap-1.5 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => { setAmount(p); setInputVal(String(p)); }}
              className="px-2.5 py-1 rounded text-xs font-medium border transition-colors"
              style={{
                borderColor: amount === p ? "hsl(var(--primary) / 0.6)" : "hsl(var(--border))",
                background: amount === p ? "hsl(var(--primary) / 0.1)" : "transparent",
                color: amount === p ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
              }}
            >
              {fmt(p)}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 gap-3">
        {/* NVDA */}
        <div
          className="rounded-xl p-3 space-y-1"
          style={{
            background: "hsl(var(--primary) / 0.08)",
            border: "1px solid hsl(var(--primary) / 0.25)",
          }}
        >
          <div className="text-xs font-bold tracking-wider" style={{ color: "hsl(var(--primary))" }}>
            NVDA
          </div>
          <div
            className="font-mono font-bold text-xl leading-tight tabular-nums"
            style={{ color: "hsl(var(--primary))" }}
          >
            {fmt(nvdaValue)}
          </div>
          <div className="text-xs" style={{ color: "hsl(var(--primary) / 0.7)" }}>
            +{fmt(nvdaGain)} gain
          </div>
          <div className="text-xs text-muted-foreground">+1,000% · 11x</div>
        </div>

        {/* S&P 500 */}
        <div
          className="rounded-xl p-3 space-y-1"
          style={{
            background: "hsl(var(--muted) / 0.5)",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <div className="text-xs font-bold tracking-wider text-muted-foreground">
            S&amp;P 500
          </div>
          <div className="font-mono font-bold text-xl leading-tight tabular-nums text-muted-foreground">
            {fmt(spyValue)}
          </div>
          <div className="text-xs text-muted-foreground">
            +{fmt(spyGain)} gain
          </div>
          <div className="text-xs text-muted-foreground">+51% · 1.5x</div>
        </div>
      </div>

      {/* Outperformance callout */}
      {outperformance > 0 && (
        <div
          className="rounded-lg px-3 py-2 text-center"
          style={{
            background: "hsl(var(--primary) / 0.07)",
            border: "1px solid hsl(var(--primary) / 0.2)",
          }}
        >
          <div className="text-xs text-muted-foreground mb-0.5">
            NVDA outperformed by
          </div>
          <div
            className="font-mono font-bold text-base tabular-nums"
            style={{ color: "hsl(var(--primary))" }}
          >
            +{fmt(outperformance)}
          </div>
        </div>
      )}
    </div>
  );
}
