import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { X, TrendingUp, Activity, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Company, MetricSeries } from "../../data/top50";

interface Props {
  company: Company;
  onClose: () => void;
  onCompare: () => void;
}

type Tab = "financials" | "metrics";

const fmt = (v: number, unit: string) => {
  if (unit.includes("B USD")) return `$${v.toFixed(1)}B`;
  if (unit.includes("M USD")) return `$${v.toFixed(0)}M`;
  if (unit === "%") return `${v.toFixed(1)}%`;
  if (unit.includes("%")) return `${v.toFixed(1)}${unit.replace("B USD", "").trim()}`;
  if (unit === "GW") return `${v.toFixed(2)} GW`;
  if (unit === "MW·h" || unit === "MWh") return `${v.toFixed(0)} MWh`;
  if (unit.includes("GWh")) return `${v.toFixed(0)} GWh`;
  if (unit === "K" || unit === "000s") return `${v.toFixed(0)}K`;
  if (unit === "M" || unit === "millions") return `${(v).toFixed(1)}M`;
  if (unit === "B") return `${v.toFixed(2)}B`;
  if (unit === "USD") return `$${v.toFixed(2)}`;
  return `${v}`;
};

const CustomTooltip = ({ active, payload, label, unit, color }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="theme-panel border border-border/80 px-3 py-2 text-xs rounded-lg shadow-xl">
      <div className="text-muted-foreground mb-1 font-mono">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color || color }} />
          <span className="text-foreground font-medium">{fmt(p.value, unit)}</span>
        </div>
      ))}
    </div>
  );
};

const CHART_HEIGHT = 180;

function FinancialChart({
  data,
  label,
  unit,
  color,
  type = "line",
}: {
  data: { year: number; value: number }[];
  label: string;
  unit: string;
  color: string;
  type?: "line" | "bar";
}) {
  const tickFmt = (v: number) => {
    if (unit.includes("B USD")) return `$${v}B`;
    if (unit.includes("%")) return `${v}%`;
    if (unit === "USD") return `$${v}`;
    return `${v}`;
  };

  return (
    <div className="theme-panel p-4 rounded-xl">
      <div className="text-xs text-muted-foreground uppercase tracking-widest mb-3 font-mono">{label}</div>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        {type === "bar" ? (
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="year" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} />
            <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickFormatter={tickFmt} width={52} />
            <Tooltip content={<CustomTooltip unit={unit} color={color} />} />
            <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} />
          </BarChart>
        ) : (
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="year" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} />
            <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickFormatter={tickFmt} width={52} />
            <Tooltip content={<CustomTooltip unit={unit} color={color} />} />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }} activeDot={{ r: 5 }} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function MetricChart({ metric, color }: { metric: MetricSeries; color: string }) {
  const isPercent = metric.unit.includes("%");
  const tickFmt = (v: number) => {
    if (metric.unit.includes("B USD")) return `$${v}B`;
    if (metric.unit.includes("%")) return `${v}%`;
    if (metric.unit === "GW") return `${v}GW`;
    if (metric.unit.includes("GWh")) return `${v}`;
    if (metric.unit.includes("M USD")) return `$${v}M`;
    return `${v}`;
  };

  const categoryColor: Record<string, string> = {
    operational: "var(--color-primary)",
    financial: "#a78bfa",
    user: "#f59e0b",
    product: "#34d399",
    infrastructure: "#60a5fa",
  };
  const accentColor = categoryColor[metric.category] || color;

  return (
    <div className="theme-panel p-4 rounded-xl">
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest font-mono">{metric.label}</div>
          <div className="text-[11px] text-muted-foreground/70 mt-0.5 leading-snug max-w-[260px]">{metric.description}</div>
        </div>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full border ml-2 shrink-0"
          style={{ borderColor: `${accentColor}50`, color: accentColor, background: `${accentColor}15` }}
        >
          {metric.category}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        {isPercent ? (
          <LineChart data={metric.data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="year" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} />
            <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickFormatter={tickFmt} width={52} />
            <Tooltip content={<CustomTooltip unit={metric.unit} color={accentColor} />} />
            <Line type="monotone" dataKey="value" stroke={accentColor} strokeWidth={2} dot={{ r: 3, fill: accentColor }} activeDot={{ r: 5 }} />
          </LineChart>
        ) : (
          <BarChart data={metric.data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="year" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} />
            <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickFormatter={tickFmt} width={52} />
            <Tooltip content={<CustomTooltip unit={metric.unit} color={accentColor} />} />
            <Bar dataKey="value" fill={accentColor} radius={[3, 3, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
      <div className="text-[10px] text-muted-foreground/60 mt-1.5 text-right font-mono">{metric.unit}</div>
    </div>
  );
}

function KpiPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="theme-panel rounded-xl px-4 py-3 min-w-[110px]">
      <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-0.5">{label}</div>
      <div className="text-base font-semibold text-foreground tabular-nums">{value}</div>
    </div>
  );
}

export default function CompanyDetail({ company, onClose, onCompare }: Props) {
  const [tab, setTab] = useState<Tab>("financials");

  const latestRevenue = company.revenue.at(-1);
  const latestNI = company.netIncome.at(-1);
  const latestGM = company.grossMargin.at(-1);
  const latestOM = company.operatingMargin.at(-1);
  const latestEPS = company.eps.at(-1);

  const fmtB = (v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(2)}T` : `$${v.toFixed(1)}B`);
  const fmtMC = (v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(2)}T` : `$${v}B`);

  const hasComparableMetrics = company.metrics.some((m) => m.compareKey);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Company Header */}
      <div
        className="shrink-0 px-5 pt-5 pb-4 border-b border-border"
        style={{ background: `linear-gradient(135deg, ${company.color}18 0%, transparent 60%)` }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold font-mono shrink-0"
              style={{ background: `${company.color}25`, color: company.color, border: `1px solid ${company.color}40` }}
            >
              {company.rank}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-foreground">{company.shortName}</span>
                <span
                  className="text-xs font-mono px-1.5 py-0.5 rounded"
                  style={{ background: `${company.color}20`, color: company.color }}
                >
                  {company.ticker}
                </span>
                <span className="text-xs text-muted-foreground">{company.sector}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 leading-snug max-w-sm">
                {company.description}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-accent/60 shrink-0 ml-2"
          >
            <X size={16} />
          </button>
        </div>

        {/* KPI Pills */}
        <div className="flex gap-2 flex-wrap">
          <KpiPill label="Market Cap" value={fmtMC(company.marketCap)} />
          {latestRevenue && <KpiPill label={`Revenue '${String(latestRevenue.year).slice(2)}`} value={fmtB(latestRevenue.value)} />}
          {latestNI && <KpiPill label={`Net Income '${String(latestNI.year).slice(2)}`} value={fmtB(latestNI.value)} />}
          {latestGM && <KpiPill label="Gross Margin" value={`${latestGM.value.toFixed(1)}%`} />}
          {latestOM && <KpiPill label="Op. Margin" value={`${latestOM.value.toFixed(1)}%`} />}
          {latestEPS && <KpiPill label="EPS" value={`$${latestEPS.value.toFixed(2)}`} />}
        </div>
      </div>

      {/* Tab bar */}
      <div className="shrink-0 flex items-center gap-1 px-5 py-2.5 border-b border-border">
        <button
          onClick={() => setTab("financials")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            tab === "financials"
              ? "bg-primary/15 text-primary border border-primary/30"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
        >
          <TrendingUp size={13} />
          Financials
        </button>
        <button
          onClick={() => setTab("metrics")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            tab === "metrics"
              ? "bg-primary/15 text-primary border border-primary/30"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
        >
          <Activity size={13} />
          Operational Metrics
          <span className="ml-0.5 text-[10px] px-1.5 py-px rounded-full bg-muted text-muted-foreground">
            {company.metrics.length}
          </span>
        </button>
        {hasComparableMetrics && (
          <button
            onClick={onCompare}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-muted-foreground hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/25"
          >
            Compare across companies
            <ChevronRight size={13} />
          </button>
        )}
      </div>

      {/* Chart area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {tab === "financials" && (
          <>
            {company.revenue.length > 0 && (
              <FinancialChart
                data={company.revenue}
                label="Revenue"
                unit="B USD"
                color={company.color}
                type="bar"
              />
            )}
            {company.netIncome.length > 0 && (
              <FinancialChart
                data={company.netIncome}
                label="Net Income"
                unit="B USD"
                color={company.color}
                type="bar"
              />
            )}
            {company.grossMargin.length > 0 && (
              <FinancialChart
                data={company.grossMargin}
                label="Gross Margin %"
                unit="%"
                color="#34d399"
              />
            )}
            {company.operatingMargin.length > 0 && (
              <FinancialChart
                data={company.operatingMargin}
                label="Operating Margin %"
                unit="%"
                color="#a78bfa"
              />
            )}
            {company.eps.length > 0 && (
              <FinancialChart
                data={company.eps}
                label="Earnings Per Share"
                unit="USD"
                color="#f59e0b"
                type="line"
              />
            )}
          </>
        )}

        {tab === "metrics" && (
          <>
            {company.metrics.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Activity size={32} className="text-muted-foreground/40 mb-3" />
                <div className="text-sm text-muted-foreground">No operational metrics available</div>
              </div>
            )}
            {company.metrics.map((metric, i) => (
              <MetricChart key={i} metric={metric} color={company.color} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
