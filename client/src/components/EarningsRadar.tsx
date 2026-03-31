import { useQuery } from "@tanstack/react-query";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { CalendarClock, AlertCircle } from "lucide-react";

interface EarningsEvent {
  date: string;
  eps: number | null;
  epsEstimated: number | null;
  revenue: number | null;
  revenueEstimated: number | null;
}

interface IncomeStatement {
  date: string;
  calendarYear?: string;
  revenue?: number;
  netIncome?: number;
  eps?: number;
  epsdiluted?: number;
  [key: string]: unknown;
}

interface Props {
  ticker: string;
}

const TEAL = "hsl(168, 76%, 48%)";
const AMBER = "hsl(38, 95%, 56%)";

function calcSurprise(actual: number | null, est: number | null): number | null {
  if (actual === null || est === null || est === 0) return null;
  return ((actual - est) / Math.abs(est)) * 100;
}

function SurpriseBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground text-xs">—</span>;
  const beat = value > 1;
  const miss = value < -1;
  const inline = !beat && !miss;

  if (inline) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted/40 text-muted-foreground">
        In-line
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold",
        beat ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
      )}
    >
      {beat ? "Beat" : "Miss"}
      <span className="font-mono">
        {value > 0 ? "+" : ""}
        {value.toFixed(1)}%
      </span>
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border/20">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="py-2 pr-2">
          <div className="h-3 bg-white/5 rounded animate-pulse w-12" />
        </td>
      ))}
    </tr>
  );
}

export default function EarningsRadar({ ticker }: Props) {
  const {
    data: earningsData,
    isLoading: earningsLoading,
    isError: earningsError,
  } = useQuery<EarningsEvent[]>({
    queryKey: ["/api/fmp/earnings", ticker],
    queryFn: () => fetch(`/api/fmp/earnings/${ticker}`).then((r) => r.json()),
    enabled: !!ticker,
  });

  const {
    data: incomeData,
    isLoading: incomeLoading,
    isError: incomeError,
  } = useQuery<IncomeStatement[]>({
    queryKey: ["/api/fmp/income", ticker],
    queryFn: () => fetch(`/api/fmp/income/${ticker}`).then((r) => r.json()),
    enabled: !!ticker,
  });

  const isLoading = earningsLoading || incomeLoading;
  const isError = earningsError || incomeError;

  // Determine if we got meaningful data (not an error object)
  const earnings: EarningsEvent[] = Array.isArray(earningsData) ? earningsData : [];
  const income: IncomeStatement[] = Array.isArray(incomeData) ? incomeData : [];

  // Sort earnings by date descending, take last 8
  const sorted = [...earnings]
    .filter((e) => e.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  // Next upcoming earnings
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = earnings
    .filter((e) => e.date && new Date(e.date) > today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const daysToEarnings = upcoming
    ? Math.round(
        (new Date(upcoming.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  // Build chart data from income statements
  const chartData = [...income]
    .sort((a, b) => {
      const ya = a.calendarYear ?? a.date?.slice(0, 4) ?? "0";
      const yb = b.calendarYear ?? b.date?.slice(0, 4) ?? "0";
      return ya.localeCompare(yb);
    })
    .slice(-8)
    .map((stmt) => {
      const year = stmt.calendarYear ?? stmt.date?.slice(0, 4) ?? "?";
      const revBillions =
        typeof stmt.revenue === "number" && stmt.revenue > 0
          ? stmt.revenue / 1e9
          : null;
      const epsVal =
        typeof stmt.epsdiluted === "number"
          ? stmt.epsdiluted
          : typeof stmt.eps === "number"
          ? stmt.eps
          : null;
      return { year, revenue: revBillions, eps: epsVal };
    });

  const noData = !isLoading && earnings.length === 0;

  return (
    <div className="space-y-4">
      {/* Countdown */}
      <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-white/3 px-4 py-3">
        <CalendarClock size={16} className="text-primary shrink-0" />
        {isLoading ? (
          <div className="h-3 w-48 bg-white/5 rounded animate-pulse" />
        ) : upcoming ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-foreground font-medium">
              Next earnings:{" "}
              <span className="text-primary font-semibold">
                {new Date(upcoming.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </span>
            {daysToEarnings !== null && (
              <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-semibold">
                {daysToEarnings === 0
                  ? "Today"
                  : daysToEarnings === 1
                  ? "Tomorrow"
                  : `In ${daysToEarnings} days`}
              </span>
            )}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">
            No upcoming earnings scheduled
          </span>
        )}
      </div>

      {/* No data placeholder */}
      {noData && !isError && (
        <div className="rounded-xl border border-border/40 bg-white/3 p-6 text-center space-y-2">
          <AlertCircle size={20} className="mx-auto text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No earnings data available for <strong className="text-foreground">{ticker}</strong>.
          </p>
          <p className="text-xs text-muted-foreground/60">
            Configure <code className="text-[11px]">FMP_API_KEY</code> to enable live earnings history.
          </p>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-primary/40">// no data</div>
          <div className="text-xs text-muted-foreground">FMP data unavailable</div>
          <div className="text-[10px] text-muted-foreground/50">Add FMP_API_KEY to enable earnings history</div>
        </div>
      )}

      {/* Earnings History Table */}
      {(isLoading || sorted.length > 0) && (
        <div>
          <div className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">
            Earnings History
          </div>
          <div className="overflow-x-auto rounded-xl border border-border/30">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-white/2">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Date</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">EPS</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">Est.</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">EPS Δ</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">Rev.</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">Rev Est.</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Rev Δ</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                  : sorted.map((e, i) => {
                      const epsSurprise = calcSurprise(e.eps, e.epsEstimated);
                      const revSurprise = calcSurprise(e.revenue, e.revenueEstimated);
                      return (
                        <tr
                          key={i}
                          className="border-b border-border/20 hover:bg-white/3 transition-colors"
                        >
                          <td className="py-2 px-3 text-muted-foreground font-mono">
                            {new Date(e.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "2-digit",
                            })}
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-foreground">
                            {e.eps !== null ? e.eps.toFixed(2) : "—"}
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-muted-foreground">
                            {e.epsEstimated !== null ? e.epsEstimated.toFixed(2) : "—"}
                          </td>
                          <td className="py-2 px-2 text-right">
                            <SurpriseBadge value={epsSurprise} />
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-foreground">
                            {e.revenue !== null
                              ? `$${(e.revenue / 1e9).toFixed(1)}B`
                              : "—"}
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-muted-foreground">
                            {e.revenueEstimated !== null
                              ? `$${(e.revenueEstimated / 1e9).toFixed(1)}B`
                              : "—"}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <SurpriseBadge value={revSurprise} />
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Revenue & EPS Trend Chart */}
      {(isLoading || chartData.length > 0) && (
        <div>
          <div className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">
            Revenue &amp; EPS Trend
          </div>
          {isLoading ? (
            <div className="h-40 bg-white/3 rounded-xl animate-pulse" />
          ) : (
            <div className="rounded-xl border border-border/30 bg-white/2 p-3">
              <ResponsiveContainer width="100%" height={160}>
                <ComposedChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="rev"
                    orientation="left"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `$${v.toFixed(0)}B`}
                    width={42}
                  />
                  <YAxis
                    yAxisId="eps"
                    orientation="right"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `$${v.toFixed(1)}`}
                    width={36}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(257 43% 12%)",
                      border: "1px solid hsl(257 43% 20%)",
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === "Revenue") return [`$${value.toFixed(1)}B`, name];
                      return [`$${value.toFixed(2)}`, name];
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={6}
                    wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
                  />
                  <Bar
                    yAxisId="rev"
                    dataKey="revenue"
                    name="Revenue"
                    fill={TEAL}
                    opacity={0.75}
                    radius={[3, 3, 0, 0]}
                  />
                  <Line
                    yAxisId="eps"
                    dataKey="eps"
                    name="EPS"
                    stroke={AMBER}
                    strokeWidth={2}
                    dot={{ r: 3, fill: AMBER, strokeWidth: 0 }}
                    type="monotone"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
