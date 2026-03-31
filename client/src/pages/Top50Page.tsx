import { useState, useMemo } from "react";
import {
  TOP50,
  SECTORS,
  SECTOR_COLORS,
  type Sector,
  type Company,
} from "../data/top50";
import Sidebar from "../components/Sidebar";
import CompanyDetail from "../components/Top50/CompanyDetail";
import ComparePanel from "../components/Top50/ComparePanel";
import { Search, BarChart3, TrendingUp, Globe } from "lucide-react";
import { track } from "@/lib/track";
import { cn } from "@/lib/utils";

const formatMarketCap = (v: number) => {
  if (v >= 1000) return `$${(v / 1000).toFixed(2)}T`;
  return `$${v}B`;
};

export default function Top50Page() {
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState<Sector | "All">("All");

  const filtered = useMemo(() => {
    return TOP50.filter((co) => {
      const matchSearch =
        search === "" ||
        co.name.toLowerCase().includes(search.toLowerCase()) ||
        co.ticker.toLowerCase().includes(search.toLowerCase());
      const matchSector =
        sectorFilter === "All" || co.sector === sectorFilter;
      return matchSearch && matchSector;
    });
  }, [search, sectorFilter]);

  const selectedCompany = selectedTicker
    ? TOP50.find((c) => c.ticker === selectedTicker) ?? null
    : null;

  const totalMarketCap = TOP50.reduce((s, c) => s + c.marketCap, 0);

  return (
    <div className="dashboard-grid app-shell">
      <Sidebar eli5Mode={false} onToggleEli5={() => {}} />

      <div className="main-content flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="theme-topbar flex items-center justify-between px-6 py-4 border-b border-border shrink-0" style={{ position: "relative", overflow: "hidden" }}>
          {/* Subtle orbital intelligence banner */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "url('/aliasist-orbit.png')",
            backgroundSize: "cover", backgroundPosition: "center 20%",
            opacity: 0.07, filter: "saturate(1.5)",
            pointerEvents: "none",
          }} />
          <div>
            <div className="theme-kicker mb-1">Market Intelligence</div>
            <h1 className="theme-title text-xl text-foreground flex items-center gap-2">
              <Globe size={20} className="text-primary" />
              Top 50 Companies by Market Cap
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatMarketCap(totalMarketCap)} combined · Financial + operational metrics · Click any company to explore
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setCompareMode(true); setSelectedTicker(null); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all",
                compareMode
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-accent/60"
              )}
            >
              <BarChart3 size={13} />
              Cross-Company Compare
            </button>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel: Company list */}
          <div
            className={cn(
              "flex flex-col border-r border-border transition-all duration-300",
              selectedCompany || compareMode ? "w-80 shrink-0" : "flex-1"
            )}
          >
            {/* Search + filters */}
            <div className="p-3 border-b border-border space-y-2 shrink-0">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/40 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex flex-wrap gap-1">
                {(["All", ...SECTORS] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSectorFilter(s as Sector | "All")}
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all",
                      sectorFilter === s
                        ? "bg-primary/15 text-primary border-primary/30"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                    )}
                    style={
                      sectorFilter === s && s !== "All"
                        ? {
                            backgroundColor: `${SECTOR_COLORS[s as Sector]}22`,
                            color: SECTOR_COLORS[s as Sector],
                            borderColor: `${SECTOR_COLORS[s as Sector]}44`,
                          }
                        : undefined
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Company list */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {filtered.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No companies match</div>
              ) : (
                <div className={selectedCompany || compareMode ? "divide-y divide-border/40" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 divide-y divide-border/30 stagger-children"}>
                  {filtered.map((co) =>
                    selectedCompany || compareMode ? (
                      <CompanyRowCompact
                        key={co.ticker}
                        co={co}
                        active={selectedTicker === co.ticker}
                        onClick={() => {
                          setCompareMode(false);
                          setSelectedTicker(co.ticker); void track("company_viewed", co.ticker);
                        }}
                      />
                    ) : (
                      <CompanyCard
                        key={co.ticker}
                        co={co}
                        onClick={() => { setSelectedTicker(co.ticker); void track("company_viewed", co.ticker); }}
                      />
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Detail or Compare */}
          {(selectedCompany || compareMode) && (
            <div className="flex-1 overflow-hidden flex flex-col">
              {compareMode && !selectedCompany ? (
                <ComparePanel
                  onClose={() => setCompareMode(false)}
                />
              ) : selectedCompany ? (
                <CompanyDetail
                  company={selectedCompany}
                  onClose={() => setSelectedTicker(null)}
                  onCompare={() => {
                    setCompareMode(true);
                    setSelectedTicker(null);
                  }}
                />
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Portrait background component ──────────────────────────────────── */
function PortraitBg({ ticker }: { ticker: string }) {
  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url('/portraits/${ticker}.png')`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: 0.12,
        borderRadius: 'inherit',
        pointerEvents: 'none',
      }}
      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
    />
  );
}

/* ── Compact row (sidebar mode) ───────────────────────────────────────── */
function CompanyRowCompact({
  co,
  active,
  onClick,
}: {
  co: Company;
  active: boolean;
  onClick: () => void;
}) {
  const latestRevenue = co.revenue[co.revenue.length - 1];
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all hover:bg-accent/40",
        active && "bg-primary/10 border-l-2 border-primary"
      )}
    >
      <span
        className="text-xs font-bold tabular-nums w-5 text-right shrink-0"
        style={{ color: co.color }}
      >
        {co.rank}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground truncate">{co.shortName}</span>
          <span className="text-xs font-mono text-primary ml-1 shrink-0">{formatMarketCap(co.marketCap)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">{co.ticker}</span>
          <span
            className="text-[10px] rounded-full px-1.5"
            style={{
              backgroundColor: `${SECTOR_COLORS[co.sector]}18`,
              color: SECTOR_COLORS[co.sector],
            }}
          >
            {co.sector}
          </span>
        </div>
      </div>
    </button>
  );
}

/* ── Grid card (full view) ───────────────────────────────────────────── */
function CompanyCard({ co, onClick }: { co: Company; onClick: () => void }) {
  const latestRev = co.revenue[co.revenue.length - 1];
  const prevRev = co.revenue[co.revenue.length - 2];
  const revGrowth = prevRev
    ? ((latestRev.value - prevRev.value) / Math.abs(prevRev.value)) * 100
    : null;

  const latestNI = co.netIncome[co.netIncome.length - 1];

  return (
    <button
      onClick={onClick}
      className="group p-4 text-left border-b border-r border-border/30 hover:bg-accent/30 transition-all cursor-pointer relative overflow-hidden"
    >
      {/* Portrait card background */}
      <PortraitBg ticker={co.ticker} />

      {/* Rank badge */}
      <div
        className="absolute top-0 left-0 w-1 h-full"
        style={{ backgroundColor: `${co.color}60` }}
      />

      <div className="pl-2">
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-muted-foreground">#{co.rank}</span>
              <span
                className="text-[10px] rounded-full px-1.5 py-0.5"
                style={{
                  backgroundColor: `${SECTOR_COLORS[co.sector]}18`,
                  color: SECTOR_COLORS[co.sector],
                }}
              >
                {co.sector}
              </span>
            </div>
            <div className="text-sm font-semibold text-foreground leading-tight mt-0.5">{co.shortName}</div>
            <div className="text-[10px] text-muted-foreground">{co.ticker} · {co.country}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-mono font-bold text-primary">{formatMarketCap(co.marketCap)}</div>
            <div className="text-[10px] text-muted-foreground">mkt cap</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <div className="text-[10px] text-muted-foreground">Revenue ({latestRev.year})</div>
            <div className="text-xs font-semibold text-foreground">${latestRev.value.toFixed(1)}B</div>
            {revGrowth !== null && (
              <div className={cn("text-[10px]", revGrowth >= 0 ? "text-emerald-400" : "text-rose-400")}>
                {revGrowth >= 0 ? "+" : ""}{revGrowth.toFixed(1)}% YoY
              </div>
            )}
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground">Net Income</div>
            <div className={cn("text-xs font-semibold", latestNI?.value >= 0 ? "text-emerald-400" : "text-rose-400")}>
              {latestNI ? `${latestNI.value >= 0 ? "" : ""}$${Math.abs(latestNI.value).toFixed(1)}B` : "—"}
            </div>
            <div className="text-[10px] text-muted-foreground">({latestNI?.year})</div>
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1">
          {co.metrics.slice(0, 2).map((m) => (
            <span key={m.label} className="text-[9px] rounded px-1.5 py-0.5 bg-primary/8 text-primary/80 border border-primary/15">
              {m.label}
            </span>
          ))}
          {co.metrics.length > 2 && (
            <span className="text-[9px] text-muted-foreground">+{co.metrics.length - 2} more</span>
          )}
        </div>
      </div>
    </button>
  );
}
