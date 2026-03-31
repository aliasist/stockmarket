import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import Sidebar from "../components/Sidebar";
import TickerTape from "../components/TickerTape";
import QuoteCard from "../components/QuoteCard";
import PriceChart from "../components/PriceChart"; // kept for potential reuse
import PredictivePanel from "../components/PredictivePanel";
import NewsFeed from "../components/NewsFeed";
import { AnalyticsSpikes } from "../components/AnalyticsSpikes";
import TradingViewWidget from "../components/TradingViewWidget";
import SentimentGauge from "../components/SentimentGauge";
import DCFCalculator from "../components/DCFCalculator";
import CompetitionTimer from "../components/CompetitionTimer";
import NvdaFcfCounter from "../components/NvdaFcfCounter";
import InvestmentCalculator from "../components/InvestmentCalculator";
import NvdaRadarChart from "../components/NvdaRadarChart";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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

interface ScrubRun {
  id: number;
  status: string;
  vectorsFound: number;
  summary?: string;
}

export default function Dashboard() {
  const [eli5Mode, setEli5Mode] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState("NVDA");
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: quotes = [], isLoading: quotesLoading } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
  });

  const { data: health } = useQuery({
    queryKey: ["/api/health"],
    refetchInterval: 60000,
  });

  const triggerScrub = useMutation({
    mutationFn: () => apiRequest("POST", "./api/scrub/trigger"),
    onSuccess: () => {
      toast({ title: "Scrub triggered", description: "Data engine is scanning sources..." });
      setTimeout(() => qc.invalidateQueries(), 5000);
    },
  });

  const h = health as { aiConfigured?: boolean } | undefined;

  // Get current quote data for selected ticker
  const selectedQuote = quotes.find((q) => q.ticker === selectedTicker);

  return (
    <div className="dashboard-grid app-shell">
      <Sidebar eli5Mode={eli5Mode} onToggleEli5={() => setEli5Mode(!eli5Mode)} />

      <div className="main-content flex flex-col">
        <TickerTape />

        {/* Aliasist status bar */}
        <div className="shrink-0 px-4 md:px-6 py-1.5 border-b border-border/40 flex items-center justify-between">
          <span className="status-badge">systems operational // aliasist pulse</span>
          <span className="status-badge" style={{ opacity: 0.5 }}>
            {new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase()}
          </span>
        </div>

        <div className={cn(
          "theme-topbar flex flex-col sm:flex-row sm:items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-border gap-3",
          eli5Mode && "eli5-active"
        )}>
          <div className="min-w-0 pl-8 sm:pl-0">
            <div className="theme-kicker mb-0.5">
              {eli5Mode ? "Learning Interface" : "// ALIASIST · SIGNAL DECK"}
            </div>
            <h1 className="theme-title text-lg md:text-2xl text-foreground truncate">
              {eli5Mode ? "🎓 Aliasist School" : "Aliasist Pulse Dashboard"}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
              {eli5Mode
                ? "Learning Mode Active — we'll explain everything like you're 5!"
                : "Real-time analytics · Recursive scrub every 15 min"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Ticker search */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const val = (e.currentTarget.elements.namedItem("ticker") as HTMLInputElement)?.value?.trim().toUpperCase();
                if (val) setSelectedTicker(val);
              }}
              className="flex items-center gap-1.5"
            >
              <input
                name="ticker"
                defaultValue={selectedTicker}
                placeholder="Ticker..."
                className="w-20 sm:w-32 pl-2.5 pr-2 py-1.5 text-xs font-mono bg-muted/40 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/60 text-foreground placeholder:text-muted-foreground uppercase tracking-wider"
                style={{ letterSpacing: "0.1em" }}
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 text-xs font-mono bg-primary/15 text-primary border border-primary/30 rounded-md hover:bg-primary/25 transition-all"
              >
                LOAD
              </button>
            </form>
            <Button
              data-testid="button-trigger-scrub"
              size="sm"
              variant="outline"
              onClick={() => triggerScrub.mutate()}
              disabled={triggerScrub.isPending}
              className="text-xs gap-1 border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary px-2.5"
            >
              {triggerScrub.isPending ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <Zap size={12} />
              )}
              <span className="hidden sm:inline">Run Scrub</span>
            </Button>
          </div>
        </div>

        <AnalyticsSpikes />

        <div className="flex-1 overflow-y-auto overscroll-contain px-3 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
          {/* Watchlist */}
          <section>
            <div className="theme-kicker mb-3">
              {eli5Mode ? "Your Toy Box" : "Watchlist"}
            </div>
            {quotesLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-28 rounded-lg" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                {quotes.map((q) => (
                  <QuoteCard
                    key={q.ticker}
                    quote={q}
                    active={selectedTicker === q.ticker}
                    onClick={() => setSelectedTicker(q.ticker)}
                    eli5Mode={eli5Mode}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Chart row: TradingView chart (primary) + right column */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              {/* TradingView advanced chart replaces PriceChart */}
              <TradingViewWidget ticker={selectedTicker} height={420} />
            </div>
            <div className="space-y-4">
              <PredictivePanel ticker={selectedTicker} eli5Mode={eli5Mode} />
              <SentimentGauge ticker={selectedTicker} />
            </div>
          </div>

          {/* DCF + Competition Timer row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <DCFCalculator
                ticker={selectedTicker}
                currentPrice={selectedQuote?.price}
                recentRevenue={10}
              />
            </div>
            <div className="space-y-4">
              <CompetitionTimer />
              <NvdaFcfCounter />
            </div>
          </div>

          {/* NVDA Competition Analytics row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <InvestmentCalculator />
            </div>
            <div>
              <NvdaRadarChart />
            </div>
          </div>

          {/* News feed */}
          <section>
            <div className="theme-kicker mb-3">
              {eli5Mode ? "Today's Stories" : "Journalism Intelligence (Latest)"}
            </div>
            <NewsFeed compact eli5Mode={eli5Mode} />
          </section>
        </div>
      </div>
    </div>
  );
}
