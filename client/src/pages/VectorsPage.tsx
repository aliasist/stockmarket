import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "../components/Sidebar";
import TickerTape from "../components/TickerTape";
import { TrendingUp, TrendingDown, Minus, Clock, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface MarketVector {
  id: number;
  scrubRunId: number;
  ticker: string | null;
  signal: string;
  confidence: number;
  reasoning: string;
  sources: string;
  createdAt: string;
}

interface ScrubRun {
  id: number;
  runAt: string;
  status: string;
  vectorsFound: number;
  summary?: string;
  sources: string;
}

export default function VectorsPage() {
  const [eli5Mode, setEli5Mode] = useState(false);

  const { data: vectors = [], isLoading: vecLoading } = useQuery<MarketVector[]>({
    queryKey: ["/api/vectors"],
    refetchInterval: 30000,
  });

  const { data: runs = [] } = useQuery<ScrubRun[]>({
    queryKey: ["/api/scrub/runs"],
    refetchInterval: 30000,
  });

  const bullish = vectors.filter((v) => v.signal === "bullish");
  const bearish = vectors.filter((v) => v.signal === "bearish");
  const neutral = vectors.filter((v) => v.signal === "neutral");

  return (
    <div className="dashboard-grid">
      <Sidebar eli5Mode={eli5Mode} onToggleEli5={() => setEli5Mode(!eli5Mode)} />
      <div className="main-content flex flex-col">
        <TickerTape />
        <div className="px-6 py-4 border-b border-border">
          <h1 className="text-lg font-bold text-foreground">
            {eli5Mode ? "🔭 The Signal Telescope" : "Logical Market Vectors"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {eli5Mode
              ? "We look at clues and find patterns — like finding candy wrappers to know where the candy is!"
              : "Cross-referenced signals from all scraped sources"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Signal Summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Bullish", list: bullish, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", Icon: TrendingUp },
              { label: "Bearish", list: bearish, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/30", Icon: TrendingDown },
              { label: "Neutral", list: neutral, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", Icon: Minus },
            ].map((g) => (
              <div key={g.label} className={cn("rounded-lg border p-4", g.bg)}>
                <div className="flex items-center gap-2 mb-1">
                  <g.Icon size={16} className={g.color} />
                  <span className={cn("text-sm font-semibold", g.color)}>{g.label}</span>
                </div>
                <div className="text-3xl font-bold font-mono text-foreground">{g.list.length}</div>
                <div className="text-xs text-muted-foreground">
                  Avg confidence: {g.list.length > 0
                    ? Math.round(g.list.reduce((a, v) => a + v.confidence, 0) / g.list.length * 100)
                    : 0}%
                </div>
              </div>
            ))}
          </div>

          {/* Vectors List */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              All Vectors
            </div>
            {vecLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-lg" />)}
              </div>
            ) : vectors.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No vectors yet. Trigger a scrub from the dashboard to start analysis.
              </div>
            ) : (
              <div className="space-y-3">
                {vectors.map((v) => {
                  let sources: string[] = [];
                  try { sources = JSON.parse(v.sources); } catch { sources = []; }
                  return (
                    <div key={v.id} className="bg-card border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <SignalBadge signal={v.signal} />
                            {v.ticker && (
                              <Badge variant="outline" className="text-xs font-mono">
                                {v.ticker}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {Math.round(v.confidence * 100)}% confidence
                            </span>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock size={10} />
                              {formatTime(v.createdAt)}
                            </div>
                          </div>

                          {/* Confidence bar */}
                          <div className="h-1 bg-muted rounded-full overflow-hidden mb-3 max-w-xs">
                            <div
                              className={cn("h-full rounded-full confidence-fill", confBg(v.signal))}
                              style={{ width: `${Math.round(v.confidence * 100)}%` }}
                            />
                          </div>

                          <p className="text-sm text-foreground leading-relaxed">{v.reasoning}</p>

                          {sources.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {sources.slice(0, 3).map((s, i) => (
                                <a
                                  key={i}
                                  href={s}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline truncate max-w-xs"
                                >
                                  {s.replace(/^https?:\/\//, "").slice(0, 60)}…
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Scrub History */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              <Database size={12} className="inline mr-1" />
              Scrub Memory (Recent Runs)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2 pr-4 font-medium">Run Time</th>
                    <th className="text-left py-2 pr-4 font-medium">Status</th>
                    <th className="text-left py-2 pr-4 font-medium">Vectors</th>
                    <th className="text-left py-2 font-medium">Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r) => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-accent/20">
                      <td className="py-2 pr-4 text-muted-foreground font-mono">
                        {formatTime(r.runAt)}
                      </td>
                      <td className="py-2 pr-4">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-2 pr-4 font-mono text-foreground">
                        {r.vectorsFound}
                      </td>
                      <td className="py-2 text-muted-foreground truncate max-w-xs">
                        {r.summary || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignalBadge({ signal }: { signal: string }) {
  const map: Record<string, { label: string; class: string }> = {
    bullish: { label: "Bullish", class: "signal-bullish" },
    bearish: { label: "Bearish", class: "signal-bearish" },
    neutral: { label: "Neutral", class: "signal-neutral" },
  };
  const cfg = map[signal] || map.neutral;
  return <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", cfg.class)}>{cfg.label}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    done: "text-emerald-400",
    running: "text-amber-400",
    error: "text-rose-400",
    pending: "text-muted-foreground",
  };
  return <span className={cn("font-medium capitalize", map[status] || "text-muted-foreground")}>{status}</span>;
}

function confBg(signal: string): string {
  if (signal === "bullish") return "bg-emerald-400";
  if (signal === "bearish") return "bg-rose-400";
  return "bg-amber-400";
}

function formatTime(iso: string): string {
  try {
    return format(new Date(iso), "MMM d, h:mm a");
  } catch {
    return iso;
  }
}
