import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useWebSocketQuotes } from "@/hooks/use-websocket-quotes";

interface Quote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function TickerTape() {
  const { quotes: wsQuotes, connectionState } = useWebSocketQuotes();
  const wsConnected = connectionState === "connected";

  const { data: polledQuotes = [] } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
    refetchInterval: wsConnected ? false : 30000,
  });

  const quotes = wsConnected && wsQuotes.length > 0 ? wsQuotes : polledQuotes;

  if (quotes.length === 0) return null;

  // Duplicate for seamless loop
  const items = [...quotes, ...quotes];

  return (
    <div className="theme-topbar border-b border-border overflow-hidden py-2">
      <div className="ticker-tape inline-flex gap-8">
        {items.map((q, i) => (
          <span key={i} className="inline-flex items-center gap-2 text-xs whitespace-nowrap">
            <span className="font-bold text-primary/90">{q.ticker}</span>
            <span className="font-mono text-foreground/90">{formatPrice(q.price)}</span>
            <span className={cn(
              "font-mono",
              q.change >= 0 ? "text-emerald-400" : "text-rose-400"
            )}>
              {q.change >= 0 ? "+" : ""}{q.changePercent.toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function formatPrice(p: number): string {
  if (p >= 10000) return p.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (p >= 100) return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
