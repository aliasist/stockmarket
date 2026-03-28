import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

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

export default function QuoteCard({ quote, onClick, active, eli5Mode }: Props) {
  const up = quote.change >= 0;
  const Icon = up ? TrendingUp : Math.abs(quote.changePercent) < 0.1 ? Minus : TrendingDown;

  return (
    <button
      data-testid={`card-quote-${quote.ticker}`}
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-lg border transition-all",
        active
          ? "border-primary/50 bg-primary/5"
          : "border-border bg-card hover:border-border/80 hover:bg-accent/30"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-xs font-bold text-muted-foreground">{quote.ticker}</div>
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
    </button>
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
