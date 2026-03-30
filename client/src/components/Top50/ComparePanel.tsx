import { useState, useMemo } from "react";
import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { BarChart2, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getAllCompareKeys,
  getComparableCompanies,
  COMPARE_KEY_LABELS,
} from "../../data/top50";

interface Props {
  onClose: () => void;
  initialKey?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="theme-panel border border-border/80 px-3 py-2 text-xs rounded-lg shadow-xl min-w-[160px]">
      <div className="text-muted-foreground mb-2 font-mono font-medium">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="text-muted-foreground">{p.name}</span>
          </div>
          <span className="text-foreground font-semibold tabular-nums">
            {p.value?.toFixed?.(2) ?? p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// Build combined timeline data for multiple companies
function buildChartData(
  entries: { company: { ticker: string; shortName: string; color: string }; metric: { data: { year: number; value: number }[]; unit: string } }[]
) {
  // Collect all years
  const allYears = new Set<number>();
  for (const { metric } of entries) {
    for (const d of metric.data) allYears.add(d.year);
  }
  const years = Array.from(allYears).sort((a, b) => a - b);

  return years.map((year) => {
    const row: Record<string, number | string> = { year };
    for (const { company, metric } of entries) {
      const point = metric.data.find((d) => d.year === year);
      if (point !== undefined) row[company.ticker] = point.value;
    }
    return row;
  });
}

const PALETTE = [
  "#4ade80", "#60a5fa", "#f59e0b", "#f472b6", "#a78bfa",
  "#34d399", "#fb923c", "#38bdf8", "#e879f9", "#fbbf24",
];

export default function ComparePanel({ onClose, initialKey }: Props) {
  const allKeys = getAllCompareKeys();
  const [selectedKey, setSelectedKey] = useState<string>(initialKey ?? allKeys[0] ?? "cloud_revenue");
  const [hiddenTickers, setHiddenTickers] = useState<Set<string>>(new Set());

  const entries = useMemo(() => getComparableCompanies(selectedKey), [selectedKey]);

  const chartData = useMemo(() => buildChartData(entries), [entries]);

  const unit = entries[0]?.metric?.unit ?? "";

  const tickFmt = (v: number) => {
    if (unit.includes("B USD")) return `$${v}B`;
    if (unit.includes("M USD")) return `$${v}M`;
    if (unit.includes("%")) return `${v}%`;
    if (unit === "GW") return `${v}GW`;
    if (unit === "M" || unit === "millions") return `${v}M`;
    return `${v}`;
  };

  const toggleTicker = (ticker: string) => {
    setHiddenTickers((prev) => {
      const next = new Set(prev);
      if (next.has(ticker)) next.delete(ticker);
      else next.add(ticker);
      return next;
    });
  };

  const visibleEntries = entries.filter((e) => !hiddenTickers.has(e.company.ticker));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-5 pt-5 pb-4 border-b border-border bg-gradient-to-r from-primary/8 to-transparent">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="theme-kicker mb-1">Cross-Company</div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <BarChart2 size={17} className="text-primary" />
              Compare Metrics
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Compare shared metrics across companies on a single chart
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-accent/60 shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Metric selector */}
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Metric</div>
          <div className="flex flex-wrap gap-1.5">
            {allKeys.map((key) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedKey(key);
                  setHiddenTickers(new Set());
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition-all border",
                  selectedKey === key
                    ? "bg-primary/15 text-primary border-primary/35 shadow-[0_0_8px_rgba(var(--primary-raw),0.15)]"
                    : "text-muted-foreground border-border/60 hover:text-foreground hover:bg-accent/50 hover:border-border"
                )}
              >
                {COMPARE_KEY_LABELS[key] ?? key}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Info size={32} className="text-muted-foreground/40 mb-3" />
            <div className="text-sm text-muted-foreground">No companies share this metric</div>
          </div>
        ) : (
          <>
            {/* Company toggles */}
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-2">
                Companies ({entries.length}) — click to toggle
              </div>
              <div className="flex flex-wrap gap-2">
                {entries.map(({ company }, i) => {
                  const color = company.color || PALETTE[i % PALETTE.length];
                  const hidden = hiddenTickers.has(company.ticker);
                  return (
                    <button
                      key={company.ticker}
                      onClick={() => toggleTicker(company.ticker)}
                      className={cn(
                        "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs transition-all",
                        hidden
                          ? "opacity-40 border-border/40 text-muted-foreground"
                          : "border-border/70 text-foreground hover:border-border"
                      )}
                      style={
                        !hidden
                          ? { borderColor: `${color}60`, background: `${color}12`, color }
                          : undefined
                      }
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: hidden ? "var(--color-muted)" : color }}
                      />
                      <span className="font-mono font-medium">{company.ticker}</span>
                      <span className="text-[10px] opacity-70">{company.shortName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main comparison chart */}
            <div className="theme-panel p-4 rounded-xl">
              <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1 font-mono">
                {COMPARE_KEY_LABELS[selectedKey] ?? selectedKey}
              </div>
              <div className="text-[11px] text-muted-foreground/60 mb-3 font-mono">{unit}</div>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                    tickFormatter={tickFmt}
                    width={58}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                  />
                  {entries.map(({ company }, i) => {
                    if (hiddenTickers.has(company.ticker)) return null;
                    const color = company.color || PALETTE[i % PALETTE.length];
                    return (
                      <Line
                        key={company.ticker}
                        type="monotone"
                        dataKey={company.ticker}
                        name={company.shortName}
                        stroke={color}
                        strokeWidth={2}
                        dot={{ r: 3, fill: color }}
                        activeDot={{ r: 5 }}
                        connectNulls={false}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Per-company data table */}
            <div className="theme-panel rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <div className="text-xs text-muted-foreground uppercase tracking-widest font-mono">
                  Data Table
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/60">
                      <th className="text-left px-4 py-2.5 text-muted-foreground font-mono font-normal">Company</th>
                      {chartData.map((row) => (
                        <th key={row.year} className="text-right px-3 py-2.5 text-muted-foreground font-mono font-normal">
                          {row.year}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(({ company, metric }, i) => {
                      const color = company.color || PALETTE[i % PALETTE.length];
                      return (
                        <tr key={company.ticker} className="border-b border-border/30 hover:bg-accent/20 transition-colors">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                              <span className="font-mono font-medium" style={{ color }}>
                                {company.ticker}
                              </span>
                              <span className="text-muted-foreground">{company.shortName}</span>
                            </div>
                          </td>
                          {chartData.map((row) => {
                            const val = row[company.ticker];
                            return (
                              <td key={row.year} className="text-right px-3 py-2.5 tabular-nums text-foreground">
                                {val !== undefined ? tickFmt(val as number) : <span className="text-muted-foreground/40">—</span>}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Metric descriptions */}
            <div className="theme-panel rounded-xl p-4 space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-2">About This Metric</div>
              {entries.slice(0, 1).map(({ company, metric }) => (
                <div key={company.ticker} className="text-xs text-muted-foreground leading-relaxed">
                  {metric.description}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
