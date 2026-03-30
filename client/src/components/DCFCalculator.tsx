import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface DCFCalculatorProps {
  ticker: string;
  currentPrice?: number;
  recentRevenue?: number; // in billions
  recentFCF?: number; // in billions
}

interface DCFResult {
  pvFCFs: number;
  pvTV: number;
  intrinsicValue: number;
  upside: number | null;
  projections: Array<{
    year: number;
    revenue: number;
    fcf: number;
    pv: number;
  }>;
}

function computeDCF(
  recentRevenue: number,
  revenueGrowthRate: number,
  fcfMargin: number,
  discountRate: number,
  terminalGrowthRate: number,
  projectionYears: number,
  currentPrice?: number
): DCFResult {
  const r = revenueGrowthRate / 100;
  const m = fcfMargin / 100;
  const d = discountRate / 100;
  const g = terminalGrowthRate / 100;

  const projections: DCFResult["projections"] = [];
  let sumPVFCF = 0;

  for (let t = 1; t <= projectionYears; t++) {
    const revenue = recentRevenue * Math.pow(1 + r, t);
    const fcf = revenue * m;
    const pv = fcf / Math.pow(1 + d, t);
    projections.push({ year: t, revenue, fcf, pv });
    sumPVFCF += pv;
  }

  const lastFCF = projections[projections.length - 1]?.fcf ?? 0;
  const tv = lastFCF * (1 + g) / (d - g);
  const pvTV = tv / Math.pow(1 + d, projectionYears);

  const intrinsicValue = sumPVFCF + pvTV;
  const upside =
    currentPrice && currentPrice > 0
      ? ((intrinsicValue - currentPrice) / currentPrice) * 100
      : null;

  return {
    pvFCFs: sumPVFCF,
    pvTV,
    intrinsicValue,
    upside,
    projections,
  };
}

const TEAL = "hsl(168, 76%, 48%)";
const PURPLE = "hsl(257, 43%, 30%)";

export default function DCFCalculator({
  ticker,
  currentPrice,
  recentRevenue = 10,
}: DCFCalculatorProps) {
  const [revenueGrowthRate, setRevenueGrowthRate] = useState(12);
  const [fcfMargin, setFcfMargin] = useState(15);
  const [discountRate, setDiscountRate] = useState(10);
  const [terminalGrowthRate, setTerminalGrowthRate] = useState(2.5);
  const [projectionYears, setProjectionYears] = useState<5 | 10>(5);

  const result = useMemo(
    () =>
      computeDCF(
        recentRevenue,
        revenueGrowthRate,
        fcfMargin,
        discountRate,
        terminalGrowthRate,
        projectionYears,
        currentPrice
      ),
    [
      recentRevenue,
      revenueGrowthRate,
      fcfMargin,
      discountRate,
      terminalGrowthRate,
      projectionYears,
      currentPrice,
    ]
  );

  const pieData = [
    { name: "PV of FCFs", value: Math.max(result.pvFCFs, 0) },
    { name: "PV of Terminal Value", value: Math.max(result.pvTV, 0) },
  ];

  const isUpside = result.upside !== null && result.upside >= 0;

  return (
    <div className="theme-panel p-4 space-y-4">
      <div>
        <div className="theme-kicker text-xs">DCF Model</div>
        <div className="text-sm font-semibold text-foreground">{ticker} — Intrinsic Value</div>
      </div>

      {/* Sliders */}
      <div className="space-y-3">
        <SliderInput
          label="Revenue Growth"
          value={revenueGrowthRate}
          min={0}
          max={50}
          step={1}
          unit="%/yr"
          onChange={setRevenueGrowthRate}
        />
        <SliderInput
          label="FCF Margin"
          value={fcfMargin}
          min={0}
          max={50}
          step={1}
          unit="%"
          onChange={setFcfMargin}
        />
        <SliderInput
          label="Discount Rate (WACC)"
          value={discountRate}
          min={5}
          max={25}
          step={0.5}
          unit="%"
          onChange={setDiscountRate}
        />
        <SliderInput
          label="Terminal Growth"
          value={terminalGrowthRate}
          min={0}
          max={5}
          step={0.5}
          unit="%"
          onChange={setTerminalGrowthRate}
        />

        {/* Projection years toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Projection Years</span>
          <div className="flex rounded-md overflow-hidden border border-border/60 text-xs">
            {([5, 10] as const).map((y) => (
              <button
                key={y}
                onClick={() => setProjectionYears(y)}
                className={cn(
                  "px-3 py-1 transition-colors",
                  projectionYears === y
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:bg-white/5"
                )}
              >
                {y}yr
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Output */}
      <div className="rounded-xl border border-border/60 bg-white/3 p-3 space-y-2">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Intrinsic Value</div>
            <div className="text-2xl font-bold text-foreground">
              ${result.intrinsicValue.toFixed(1)}B
            </div>
          </div>
          {result.upside !== null && (
            <div
              className={cn(
                "text-sm font-semibold px-2 py-1 rounded-md",
                isUpside
                  ? "text-emerald-400 bg-emerald-500/10"
                  : "text-rose-400 bg-rose-500/10"
              )}
            >
              {isUpside ? "+" : ""}{result.upside.toFixed(1)}% {isUpside ? "upside" : "downside"}
            </div>
          )}
        </div>
        {currentPrice && (
          <div className="text-xs text-muted-foreground">
            Current Price: ${currentPrice.toFixed(2)}
          </div>
        )}
      </div>

      {/* Pie chart breakdown */}
      <div>
        <div className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wider">Value Breakdown</div>
        <div className="flex items-center gap-4">
          <div style={{ width: 90, height: 90 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={22}
                  outerRadius={38}
                  dataKey="value"
                  strokeWidth={0}
                >
                  <Cell fill={TEAL} opacity={0.85} />
                  <Cell fill={PURPLE} opacity={0.85} />
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(257 43% 12%)",
                    border: "1px solid hsl(257 43% 20%)",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                  formatter={(v: number) => [`$${v.toFixed(1)}B`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 text-xs flex-1">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: TEAL }} />
              <span className="text-muted-foreground">PV of FCFs</span>
              <span className="ml-auto text-foreground font-medium">${result.pvFCFs.toFixed(1)}B</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: PURPLE }} />
              <span className="text-muted-foreground">PV Terminal</span>
              <span className="ml-auto text-foreground font-medium">${result.pvTV.toFixed(1)}B</span>
            </div>
          </div>
        </div>
      </div>

      {/* Projection table */}
      <div>
        <div className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wider">Projections</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border/50">
                <th className="text-left py-1 pr-2">Yr</th>
                <th className="text-right py-1 pr-2">Revenue</th>
                <th className="text-right py-1 pr-2">FCF</th>
                <th className="text-right py-1">PV</th>
              </tr>
            </thead>
            <tbody>
              {result.projections.map((row) => (
                <tr
                  key={row.year}
                  className="border-b border-border/20 hover:bg-white/3 transition-colors"
                >
                  <td className="py-1 pr-2 text-muted-foreground">{row.year}</td>
                  <td className="py-1 pr-2 text-right text-foreground">${row.revenue.toFixed(1)}B</td>
                  <td className="py-1 pr-2 text-right text-foreground">${row.fcf.toFixed(1)}B</td>
                  <td className="py-1 text-right font-medium" style={{ color: TEAL }}>
                    ${row.pv.toFixed(1)}B
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Internal slider component
interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}

function SliderInput({ label, value, min, max, step, unit, onChange }: SliderInputProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground font-medium tabular-nums">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: "hsl(168, 76%, 48%)" }}
      />
    </div>
  );
}
