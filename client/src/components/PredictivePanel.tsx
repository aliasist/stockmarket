import { useQuery } from "@tanstack/react-query";
import { Brain, TrendingUp, TrendingDown, Minus, RefreshCw, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import Eli5Tooltip from "./Eli5Tooltip";

interface Prediction {
  prediction: string;
  confidence: number;
  reasoning: string;
  timeframe: string;
}

interface MarketVector {
  id: number;
  ticker: string | null;
  signal: string;
  confidence: number;
  reasoning: string;
  sources: string;
  createdAt: string;
}

const FINANCIAL_TERMS = [
  "Quantitative Tightening",
  "Moving Average Convergence Divergence",
  "Federal Reserve",
  "Yield Curve",
  "Market Capitalization",
  "Volatility Index",
];

export default function PredictivePanel({ ticker, eli5Mode }: { ticker: string; eli5Mode: boolean }) {
  const { data: prediction, isLoading: predLoading, refetch: refetchPred } = useQuery<Prediction>({
    queryKey: ["/api/predict", ticker],
    queryFn: async () => {
      const res = await fetch(`./api/predict/${ticker}`);
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: vectors = [], isLoading: vecLoading } = useQuery<MarketVector[]>({
    queryKey: ["/api/vectors"],
    refetchInterval: 60000,
  });

  const tickerVectors = vectors.filter((v) =>
    !v.ticker || v.ticker === ticker
  ).slice(0, 5);

  const isLoading = predLoading || vecLoading;

  return (
    <div className={cn("rounded-lg border p-4 space-y-4", eli5Mode ? "eli5-active" : "bg-card border-border")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain size={16} className={eli5Mode ? "text-purple-400" : "text-primary"} />
          <span className="text-sm font-semibold">
            {eli5Mode ? "🧠 What's the Market Thinking?" : "Predictive Reasoning"}
          </span>
          {eli5Mode && <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">ELI5</span>}
        </div>
        <button
          data-testid="button-refresh-prediction"
          onClick={() => refetchPred()}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Prediction Result */}
      {isLoading ? (
        <div className="space-y-2">
          <div className="skeleton h-10 rounded" />
          <div className="skeleton h-16 rounded" />
        </div>
      ) : prediction ? (
        <div className="space-y-3">
          {/* Signal bar */}
          <div className="flex items-center gap-3">
            <SignalIcon signal={prediction.prediction} size={20} />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className={cn("text-sm font-bold capitalize", signalColor(prediction.prediction))}>
                  {eli5Mode ? eli5Signal(prediction.prediction) : prediction.prediction}
                </span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock size={10} />
                  {prediction.timeframe}
                </div>
              </div>
              {/* Confidence bar */}
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full confidence-fill", confidenceBg(prediction.prediction))}
                  style={{ width: `${Math.round(prediction.confidence * 100)}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {Math.round(prediction.confidence * 100)}% confidence
              </div>
            </div>
          </div>

          {/* Reasoning */}
          <div className={cn(
            "text-sm leading-relaxed p-3 rounded-md",
            eli5Mode ? "bg-purple-500/10 text-purple-100" : "bg-muted/50 text-foreground/80"
          )}>
            {prediction.reasoning}
          </div>
        </div>
      ) : null}

      {/* Market Vectors */}
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          {eli5Mode ? "What Signals Are We Seeing?" : "Logical Market Vectors"}
        </div>
        {vecLoading ? (
          <div className="space-y-1.5">
            {[1,2,3].map(i => <div key={i} className="skeleton h-12 rounded" />)}
          </div>
        ) : tickerVectors.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-4">
            Scrub in progress — vectors will appear here
          </div>
        ) : (
          <div className="space-y-2">
            {tickerVectors.map((v) => (
              <div key={v.id} className="p-2.5 rounded-md bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <SignalIcon signal={v.signal} size={12} />
                    <span className={cn("text-xs font-semibold capitalize", signalColor(v.signal))}>
                      {v.ticker || "MACRO"} — {v.signal}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(v.confidence * 100)}%
                  </span>
                </div>
                <p className="text-sm text-foreground/75 leading-relaxed">
                  {v.reasoning}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ELI5 Term Glossary */}
      {eli5Mode && (
        <div className="border-t border-purple-500/20 pt-3">
          <div className="text-xs font-semibold text-purple-400 mb-2">Tap a term to learn it:</div>
          <div className="flex flex-wrap gap-1.5">
            {FINANCIAL_TERMS.map((term) => (
              <Eli5Tooltip key={term} term={term} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SignalIcon({ signal, size }: { signal: string; size: number }) {
  const props = { size, strokeWidth: 2.5 };
  if (signal === "bullish") return <TrendingUp {...props} className="text-emerald-400" />;
  if (signal === "bearish") return <TrendingDown {...props} className="text-rose-400" />;
  return <Minus {...props} className="text-amber-400" />;
}

function signalColor(s: string) {
  if (s === "bullish") return "text-emerald-400";
  if (s === "bearish") return "text-rose-400";
  return "text-amber-400";
}

function confidenceBg(s: string) {
  if (s === "bullish") return "bg-emerald-400";
  if (s === "bearish") return "bg-rose-400";
  return "bg-amber-400";
}

function eli5Signal(s: string) {
  if (s === "bullish") return "Going UP 🚀 (Like candy prices on Halloween!)";
  if (s === "bearish") return "Going DOWN 😬 (Like when your ice cream melts...)";
  return "Staying the same 🤷 (Like swings with no wind)";
}
