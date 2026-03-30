import { cn } from "@/lib/utils";
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle,
  Zap, Target, Users, BarChart3, Calendar, Printer,
  CheckCircle2, XCircle, MinusCircle, DollarSign,
  Building2, Globe2, UserCircle, Briefcase
} from "lucide-react";

export interface AiSections {
  executiveSummary: string;
  businessOverview: string;
  investmentThesis: string;
  bearCase: string;
  catalysts: string[];
  valuation: string;
  priceTarget: string;
  recommendation: "BUY" | "HOLD" | "SELL";
}

export interface PitchData {
  ticker: string;
  companyName: string;
  price?: number;
  generatedAt: string;
  profile: Record<string, unknown>;
  metrics: Record<string, unknown>[];
  ratings: Record<string, unknown>;
  peers: string[];
  earnings: Record<string, unknown>[];
  income: Record<string, unknown>[];
  aiSections: AiSections;
}

function fmtNum(val: unknown, decimals = 2): string {
  if (val === null || val === undefined || val === "") return "—";
  const n = Number(val);
  if (isNaN(n)) return "—";
  return n.toFixed(decimals);
}

function fmtLarge(val: unknown): string {
  if (val === null || val === undefined) return "—";
  const n = Number(val);
  if (isNaN(n)) return "—";
  if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toFixed(0)}`;
}

function fmtPct(val: unknown): string {
  if (val === null || val === undefined) return "—";
  const n = Number(val);
  if (isNaN(n)) return "—";
  return `${n.toFixed(2)}%`;
}

interface RecommendationConfig {
  label: string;
  bg: string;
  border: string;
  text: string;
  icon: React.ReactNode;
  accent: string;
}

function getRecConfig(rec: string): RecommendationConfig {
  switch (rec?.toUpperCase()) {
    case "BUY":
      return {
        label: "BUY",
        bg: "bg-emerald-500",
        border: "border-emerald-500",
        text: "text-emerald-400",
        icon: <TrendingUp size={20} />,
        accent: "border-l-emerald-500",
      };
    case "SELL":
      return {
        label: "SELL",
        bg: "bg-rose-500",
        border: "border-rose-500",
        text: "text-rose-400",
        icon: <TrendingDown size={20} />,
        accent: "border-l-rose-500",
      };
    default:
      return {
        label: "HOLD",
        bg: "bg-amber-500",
        border: "border-amber-500",
        text: "text-amber-400",
        icon: <Minus size={20} />,
        accent: "border-l-amber-500",
      };
  }
}

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  accentColor?: string;
  className?: string;
}

function SectionCard({ title, icon, children, accentColor = "border-l-primary", className }: SectionCardProps) {
  return (
    <div className={cn(
      "theme-panel rounded-xl p-5 border-l-4",
      accentColor,
      className
    )}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-primary">{icon}</span>
        <h3 className="theme-kicker">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/40 rounded-lg p-3 border border-border/60">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <div className="text-foreground font-semibold font-mono text-sm">{value}</div>
    </div>
  );
}

interface EarningsRowProps {
  item: Record<string, unknown>;
}

function EarningsRow({ item }: EarningsRowProps) {
  const actual = Number(item.eps ?? item.actualEarningResult ?? item.actual);
  const estimated = Number(item.estimatedEps ?? item.estimatedEarning ?? item.estimate);
  const beat = !isNaN(actual) && !isNaN(estimated) && actual >= estimated;
  const date = String(item.date ?? item.fiscalDateEnding ?? "");

  return (
    <tr className="border-b border-border/40 hover:bg-muted/20 transition-colors">
      <td className="py-2.5 px-3 text-sm font-mono text-muted-foreground">{date.slice(0, 10)}</td>
      <td className="py-2.5 px-3 text-sm font-mono text-foreground">{isNaN(actual) ? "—" : `$${actual.toFixed(2)}`}</td>
      <td className="py-2.5 px-3 text-sm font-mono text-muted-foreground">{isNaN(estimated) ? "—" : `$${estimated.toFixed(2)}`}</td>
      <td className="py-2.5 px-3">
        {!isNaN(actual) && !isNaN(estimated) ? (
          <span className={cn(
            "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
            beat
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-rose-500/15 text-rose-400"
          )}>
            {beat ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
            {beat ? "Beat" : "Miss"}
          </span>
        ) : <span className="text-muted-foreground text-xs">—</span>}
      </td>
    </tr>
  );
}

interface RatingsBarProps {
  label: string;
  count: number;
  total: number;
  color: string;
}

function RatingsBar({ label, count, total, color }: RatingsBarProps) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 text-xs text-muted-foreground text-right shrink-0">{label}</div>
      <div className="flex-1 h-2 bg-muted/60 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-8 text-xs font-mono text-foreground text-right shrink-0">{count}</div>
    </div>
  );
}

interface PitchMemoProps {
  data: PitchData;
  onPrint?: () => void;
}

export default function PitchMemo({ data, onPrint }: PitchMemoProps) {
  const { ticker, companyName, price, generatedAt, profile, metrics, ratings, peers, earnings, income, aiSections } = data;
  const recConfig = getRecConfig(aiSections.recommendation);
  const m = metrics[0] ?? {};

  // Ratings data
  const ratingsBuy = Number((ratings as Record<string, unknown>)?.buy ?? (ratings as Record<string, unknown>)?.strongBuy ?? 0) + Number((ratings as Record<string, unknown>)?.strongBuy ?? 0);
  const ratingsHold = Number((ratings as Record<string, unknown>)?.hold ?? 0);
  const ratingsSell = Number((ratings as Record<string, unknown>)?.sell ?? 0) + Number((ratings as Record<string, unknown>)?.strongSell ?? 0);
  const ratingsTotal = ratingsBuy + ratingsHold + ratingsSell;

  const avgPriceTarget = (ratings as Record<string, unknown>)?.priceTarget ?? (ratings as Record<string, unknown>)?.targetMeanPrice;
  const consensus = (ratings as Record<string, unknown>)?.consensus ?? (ratings as Record<string, unknown>)?.recommendation;

  const priceUpside = price && avgPriceTarget
    ? (((Number(avgPriceTarget) - price) / price) * 100).toFixed(1)
    : null;

  const generatedDate = new Date(generatedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="pitch-memo space-y-5" id="pitch-memo-content">
      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .print-hide { display: none !important; }
          .pitch-memo { color: black !important; }
          .theme-panel { background: white !important; border: 1px solid #e5e7eb !important; box-shadow: none !important; }
          .theme-kicker { color: #6b7280 !important; }
          .text-foreground, .text-muted-foreground { color: black !important; }
          .bg-muted\\/40 { background: #f9fafb !important; }
        }
      `}</style>

      {/* ── Header ─────────────────────────────────── */}
      <div className="theme-panel rounded-2xl p-6 border-l-4 border-l-primary overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1">
              <div className="theme-kicker mb-2">Equity Research · Aliasist Signal Deck</div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{companyName || ticker}</h1>
                <span className="bg-primary/15 border border-primary/30 text-primary font-mono font-bold text-sm px-2.5 py-1 rounded-lg">
                  {ticker}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap mt-2">
                {price && (
                  <span className="text-foreground font-mono font-semibold text-lg">
                    ${price.toFixed(2)}
                  </span>
                )}
                {(profile as Record<string, unknown>)?.range && (
                  <span>52W: {String((profile as Record<string, unknown>).range)}</span>
                )}
                <span>{generatedDate}</span>
              </div>
            </div>

            {/* Recommendation badge */}
            <div className="flex flex-col items-center gap-2">
              <div className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white text-xl shadow-lg",
                recConfig.bg
              )}>
                {recConfig.icon}
                {recConfig.label}
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Price Target</div>
                <div className="font-mono font-semibold text-foreground">{aiSections.priceTarget}</div>
                {priceUpside && (
                  <div className={cn(
                    "text-xs font-semibold",
                    Number(priceUpside) >= 0 ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {Number(priceUpside) >= 0 ? "+" : ""}{priceUpside}% vs current
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Print + export button */}
          <div className="mt-4 flex justify-end print-hide">
            <button
              onClick={onPrint ?? (() => window.print())}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            >
              <Printer size={12} />
              Export / Print
            </button>
          </div>
        </div>
      </div>

      {/* ── Executive Summary ─────────────────────── */}
      <SectionCard
        title="Executive Summary"
        icon={<Zap size={14} />}
        accentColor="border-l-primary"
      >
        <blockquote className="italic text-foreground/90 text-base leading-relaxed border-l-2 border-primary/40 pl-4 py-1">
          {aiSections.executiveSummary}
        </blockquote>
      </SectionCard>

      {/* ── Business Overview ─────────────────────── */}
      <SectionCard
        title="Business Overview"
        icon={<Building2 size={14} />}
        accentColor="border-l-cyan-500"
      >
        <p className="text-foreground/85 leading-relaxed text-sm">{aiSections.businessOverview}</p>
      </SectionCard>

      {/* ── Company Profile ───────────────────────── */}
      <SectionCard
        title="Company Profile"
        icon={<Globe2 size={14} />}
        accentColor="border-l-violet-500"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "Sector", value: String((profile as Record<string, unknown>).sector ?? "—") },
            { label: "Industry", value: String((profile as Record<string, unknown>).industry ?? "—") },
            { label: "Country", value: String((profile as Record<string, unknown>).country ?? "—") },
            { label: "CEO", value: String((profile as Record<string, unknown>).ceo ?? "—") },
            { label: "Employees", value: Number((profile as Record<string, unknown>).fullTimeEmployees) > 0
              ? Number((profile as Record<string, unknown>).fullTimeEmployees).toLocaleString()
              : "—" },
            { label: "IPO Date", value: String((profile as Record<string, unknown>).ipoDate ?? "—") },
          ].map(({ label, value }) => (
            <MetricItem key={label} label={label} value={value} />
          ))}
        </div>
        {(profile as Record<string, unknown>).description && (
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed line-clamp-3">
            {String((profile as Record<string, unknown>).description)}
          </p>
        )}
      </SectionCard>

      {/* ── Key Financial Metrics ─────────────────── */}
      <SectionCard
        title="Key Financial Metrics"
        icon={<BarChart3 size={14} />}
        accentColor="border-l-teal-500"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "P/E Ratio", value: fmtNum(m.peRatioTTM ?? m.priceEarningsRatio ?? m.peRatio) },
            { label: "EV/EBITDA", value: fmtNum(m.evToEBITDATTM ?? m.enterpriseValueMultiple ?? m.evToEbitda) },
            { label: "ROE", value: fmtPct(Number(m.returnOnEquityTTM ?? m.returnOnEquity ?? 0) * 100) },
            { label: "Debt/Equity", value: fmtNum(m.debtEquityRatioTTM ?? m.debtToEquity) },
            { label: "Current Ratio", value: fmtNum(m.currentRatioTTM ?? m.currentRatio) },
            { label: "FCF Yield", value: fmtPct(Number(m.freeCashFlowPerShareTTM ?? m.freeCashFlowYield ?? 0)) },
          ].map(({ label, value }) => (
            <MetricItem key={label} label={label} value={value} />
          ))}
        </div>
      </SectionCard>

      {/* ── Investment Thesis ─────────────────────── */}
      <SectionCard
        title="Investment Thesis"
        icon={<TrendingUp size={14} />}
        accentColor="border-l-emerald-500"
      >
        <p className="text-foreground/85 leading-relaxed text-sm">{aiSections.investmentThesis}</p>
      </SectionCard>

      {/* ── Bear Case ─────────────────────────────── */}
      <SectionCard
        title="Bear Case / Key Risks"
        icon={<AlertTriangle size={14} />}
        accentColor="border-l-rose-500"
      >
        <p className="text-foreground/85 leading-relaxed text-sm">{aiSections.bearCase}</p>
      </SectionCard>

      {/* ── Key Catalysts ─────────────────────────── */}
      {aiSections.catalysts?.length > 0 && (
        <SectionCard
          title="Key Catalysts"
          icon={<Zap size={14} />}
          accentColor="border-l-amber-500"
        >
          <ol className="space-y-3">
            {aiSections.catalysts.map((catalyst, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-foreground/85 text-sm leading-relaxed">{catalyst}</span>
              </li>
            ))}
          </ol>
        </SectionCard>
      )}

      {/* ── Analyst Ratings ───────────────────────── */}
      {ratingsTotal > 0 && (
        <SectionCard
          title="Analyst Ratings"
          icon={<Users size={14} />}
          accentColor="border-l-blue-500"
        >
          <div className="space-y-3 mb-4">
            <RatingsBar label="Buy" count={ratingsBuy} total={ratingsTotal} color="bg-emerald-500" />
            <RatingsBar label="Hold" count={ratingsHold} total={ratingsTotal} color="bg-amber-500" />
            <RatingsBar label="Sell" count={ratingsSell} total={ratingsTotal} color="bg-rose-500" />
          </div>
          <div className="flex items-center gap-6 text-sm flex-wrap pt-2 border-t border-border/40">
            <div>
              <span className="text-muted-foreground text-xs">Avg Price Target: </span>
              <span className="text-foreground font-mono font-semibold">
                {avgPriceTarget ? `$${Number(avgPriceTarget).toFixed(2)}` : "—"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Consensus: </span>
              <span className="text-foreground font-semibold capitalize">{String(consensus ?? "—")}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Analysts: </span>
              <span className="text-foreground font-mono">{ratingsTotal}</span>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── Earnings History ─────────────────────── */}
      {earnings.length > 0 && (
        <SectionCard
          title="Earnings History"
          icon={<Calendar size={14} />}
          accentColor="border-l-indigo-500"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">EPS Actual</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">EPS Est.</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Result</th>
                </tr>
              </thead>
              <tbody>
                {earnings.slice(0, 8).map((item, i) => (
                  <EarningsRow key={i} item={item} />
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* ── Valuation Commentary ──────────────────── */}
      <SectionCard
        title="Valuation Commentary"
        icon={<DollarSign size={14} />}
        accentColor="border-l-purple-500"
      >
        <p className="text-foreground/85 leading-relaxed text-sm">{aiSections.valuation}</p>
        {income.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left py-1.5 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Year</th>
                  <th className="text-left py-1.5 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Revenue</th>
                  <th className="text-left py-1.5 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Net Income</th>
                  <th className="text-left py-1.5 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">EPS</th>
                </tr>
              </thead>
              <tbody>
                {income.slice(0, 4).map((row, i) => {
                  const r = row as Record<string, unknown>;
                  return (
                    <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="py-2 px-2 text-xs font-mono text-muted-foreground">{String(r.date ?? r.calendarYear ?? "").slice(0, 7)}</td>
                      <td className="py-2 px-2 text-xs font-mono text-foreground">{fmtLarge(r.revenue ?? r.totalRevenue)}</td>
                      <td className="py-2 px-2 text-xs font-mono text-foreground">{fmtLarge(r.netIncome ?? r.netIncomeApplicableToCommonShares)}</td>
                      <td className="py-2 px-2 text-xs font-mono text-foreground">{fmtNum(r.eps ?? r.basicEPS, 2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ── Peer Group ────────────────────────────── */}
      {peers.length > 0 && (
        <SectionCard
          title="Peer Group"
          icon={<Briefcase size={14} />}
          accentColor="border-l-slate-500"
        >
          <div className="flex flex-wrap gap-2">
            {peers.map((peer) => (
              <span
                key={peer}
                className="theme-chip font-mono text-xs font-semibold"
              >
                {peer}
              </span>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Recommendation Footer ─────────────────── */}
      <div className={cn(
        "theme-panel rounded-2xl p-6 border-l-4 flex items-center justify-between gap-4",
        recConfig.border
      )}>
        <div>
          <div className="theme-kicker mb-1">Final Recommendation</div>
          <div className={cn("text-3xl font-bold flex items-center gap-2", recConfig.text)}>
            {recConfig.icon}
            {recConfig.label}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {aiSections.priceTarget}
            {priceUpside && (
              <span className={cn("ml-2 font-semibold", Number(priceUpside) >= 0 ? "text-emerald-400" : "text-rose-400")}>
                ({Number(priceUpside) >= 0 ? "+" : ""}{priceUpside}% potential)
              </span>
            )}
          </div>
        </div>
        <div className={cn(
          "flex items-center justify-center w-16 h-16 rounded-2xl text-white shadow-lg",
          recConfig.bg
        )}>
          <span className="text-2xl font-bold">{recConfig.label[0]}</span>
        </div>
      </div>

      {/* ── Disclaimer ────────────────────────────── */}
      <div className="text-[10px] text-muted-foreground/60 text-center px-4 pb-4 leading-relaxed">
        This memo was generated by Aliasist Signal Deck AI for informational purposes only. It does not constitute financial advice.
        Past performance is not indicative of future results. Generated {generatedDate}.
      </div>
    </div>
  );
}
