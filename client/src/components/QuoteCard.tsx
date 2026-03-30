import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Check, Target, X } from "lucide-react";
import { useState, useCallback } from "react";
import { useLocation } from "wouter";

interface Quote {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  open: number;
  previousClose: number;
}

interface Props {
  quote: Quote;
  onClick?: () => void;
  active?: boolean;
  eli5Mode?: boolean;
}

const eli5Names: Record<string, string> = {
  "SPY": "The Big Toy Box",
  "QQQ": "The Tech Toy Store",
  "BTC-USD": "Magic Internet Candy",
  "AAPL": "The Apple Tree",
  "NVDA": "The Robot Brain Shop",
  "TSLA": "The Electric Car Toy",
};

const PRICE_TARGETS_KEY = "price_targets";

function getPriceTargets(): Record<string, number> {
  try {
    const raw = localStorage.getItem(PRICE_TARGETS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function setPriceTarget(ticker: string, target: number): void {
  const targets = getPriceTargets();
  targets[ticker] = target;
  localStorage.setItem(PRICE_TARGETS_KEY, JSON.stringify(targets));
}

function removePriceTarget(ticker: string): void {
  const targets = getPriceTargets();
  delete targets[ticker];
  localStorage.setItem(PRICE_TARGETS_KEY, JSON.stringify(targets));
}

export default function QuoteCard({ quote, onClick, active, eli5Mode }: Props) {
  const up = quote.change >= 0;
  const Icon = up ? TrendingUp : Math.abs(quote.changePercent) < 0.1 ? Minus : TrendingDown;

  // Price target state
  const [targets, setTargets] = useState<Record<string, number>>(() => getPriceTargets());
  const [settingTarget, setSettingTarget] = useState(false);
  const [inputVal, setInputVal] = useState("");

  const [, setLocation] = useLocation();

  const currentTarget = targets[quote.ticker];
  const hasTarget = currentTarget !== undefined;
  const targetReached = hasTarget && quote.price >= currentTarget;
  const upside = hasTarget && !targetReached ? currentTarget - quote.price : null;

  const refreshTargets = useCallback(() => {
    setTargets(getPriceTargets());
  }, []);

  function handleConfirmTarget(e: React.MouseEvent | React.FormEvent) {
    e.stopPropagation();
    e.preventDefault();
    const val = parseFloat(inputVal);
    if (!isNaN(val) && val > 0) {
      setPriceTarget(quote.ticker, val);
      refreshTargets();
    }
    setSettingTarget(false);
    setInputVal("");
  }

  function handleCancelTarget(e: React.MouseEvent) {
    e.stopPropagation();
    setSettingTarget(false);
    setInputVal("");
  }

  function handleStartSetting(e: React.MouseEvent) {
    e.stopPropagation();
    setInputVal(currentTarget ? String(currentTarget) : "");
    setSettingTarget(true);
  }

  function handleRemoveTarget(e: React.MouseEvent) {
    e.stopPropagation();
    removePriceTarget(quote.ticker);
    refreshTargets();
  }

  function handlePitch(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    setLocation(`/pitch?ticker=${encodeURIComponent(quote.ticker)}`);
  }

  return (
    <div className="group relative">
      <button
        data-testid={`card-quote-${quote.ticker}`}
        onClick={onClick}
        className={cn(
          "theme-panel-soft w-full text-left p-4 rounded-2xl transition-all hover:-translate-y-0.5",
          active
            ? "border-primary/50 bg-primary/8 shadow-[0_0_0_1px_rgba(180,117,255,0.18),0_20px_40px_rgba(18,10,36,0.35)]"
            : "hover:border-primary/20 hover:bg-accent/40"
        )}
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary/75">{quote.ticker}</div>
            <div className="text-sm font-medium text-foreground leading-tight mt-0.5">
              {eli5Mode ? (eli5Names[quote.ticker] || quote.name) : quote.name}
            </div>
          </div>
          <div className={cn(
            "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
            up ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
          )}>
            <Icon size={10} />
            {up ? "+" : ""}{quote.changePercent.toFixed(2)}%
          </div>
        </div>

        <div className="font-mono text-xl font-bold text-foreground">
          {formatPrice(quote.price)}
        </div>

        <div className="flex items-center justify-between mt-1">
          <span className={cn(
            "text-sm font-mono font-medium",
            up ? "text-emerald-400" : "text-rose-400"
          )}>
            {up ? "▲" : "▼"} {Math.abs(quote.change).toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground">
            Vol {formatVolume(quote.volume)}
          </span>
        </div>

        {/* Price target section */}
        <div className="mt-2 pt-2 border-t border-border/20">
          {settingTarget ? (
            <form
              onSubmit={handleConfirmTarget}
              className="flex items-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <Target size={11} className="text-muted-foreground shrink-0" />
              <input
                type="number"
                autoFocus
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Target $"
                step="0.01"
                min="0.01"
                className={cn(
                  "flex-1 min-w-0 text-xs font-mono px-2 py-1 rounded-md",
                  "bg-white/8 border border-border/60 text-foreground placeholder:text-muted-foreground/50",
                  "focus:outline-none focus:border-primary/50"
                )}
              />
              <button
                type="submit"
                className="p-1 rounded-md bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
              >
                <Check size={11} />
              </button>
              <button
                type="button"
                onClick={handleCancelTarget}
                className="p-1 rounded-md bg-white/5 text-muted-foreground hover:bg-white/10 transition-colors"
              >
                <X size={11} />
              </button>
            </form>
          ) : hasTarget ? (
            <div className="flex items-center justify-between gap-2">
              {targetReached ? (
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Check size={11} className="text-teal-400 shrink-0" />
                  <span className="text-teal-400 font-semibold">Target reached</span>
                  <span className="text-muted-foreground font-mono">{formatPrice(currentTarget)}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Target size={11} className="text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Target:</span>
                  <span className="font-mono text-foreground font-medium">{formatPrice(currentTarget)}</span>
                  {upside !== null && (
                    <span className="text-emerald-400 font-semibold">
                      ↑ {formatPrice(upside)} to target
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleStartSetting}
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1"
                  title="Edit target"
                >
                  Edit
                </button>
                <button
                  onClick={handleRemoveTarget}
                  className="p-0.5 text-muted-foreground/50 hover:text-rose-400 transition-colors"
                  title="Remove target"
                >
                  <X size={10} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleStartSetting}
              className={cn(
                "flex items-center gap-1 text-[11px] text-muted-foreground/60",
                "hover:text-primary/80 transition-colors"
              )}
            >
              <Target size={10} />
              Set target
            </button>
          )}
        </div>
      </button>

      {/* Pitch button — visible on group hover */}
      <button
        onClick={handlePitch}
        className={cn(
          "absolute bottom-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-semibold",
          "bg-transparent border border-border/0 text-muted-foreground/0",
          "group-hover:bg-primary/10 group-hover:border-primary/25 group-hover:text-primary/80",
          "transition-all duration-150 hover:!bg-primary/20 hover:!text-primary"
        )}
        title={`Pitch ${quote.ticker}`}
      >
        Pitch →
      </button>
    </div>
  );
}

function formatPrice(p: number): string {
  if (p >= 10000) return "$" + p.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return "$" + p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatVolume(v: number): string {
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + "B";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(0) + "K";
  return String(v);
}
