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
import { track } from "@/lib/track";
import { getMarketState, getMarketBg } from "@/lib/marketState";
import { clearStoredAdminPassword, getOrPromptAdminPassword } from "@/lib/adminAuth";

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

interface MarketVector {
  id: number;
  signal: string;
  confidence: number;
  reasoning: string;
  sources: string;
  createdAt: string;
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

  const { data: vectors = [] } = useQuery<MarketVector[]>({
    queryKey: ["/api/vectors"],
    refetchInterval: 60000,
  });

  const marketState = getMarketState(vectors);

  const { data: health } = useQuery({
    queryKey: ["/api/health"],
    refetchInterval: 60000,
  });

  const triggerScrub = useMutation({
    mutationFn: async () => {
      const password = getOrPromptAdminPassword();
      if (!password) {
        throw new Error("Admin password required");
      }

      return apiRequest("POST", "/api/scrub/trigger", undefined, {
        "x-admin-password": password,
      });
    },
    onSuccess: () => {
      toast({ title: "Scrub triggered", description: "Data engine is scanning sources..." });
      setTimeout(() => qc.invalidateQueries(), 5000);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Failed to trigger scrub";
      if (message.includes("401") || message.includes("403")) {
        clearStoredAdminPassword();
        toast({
          title: "Admin authentication failed",
          description: "Password was rejected. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Scrub failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const h = health as { aiConfigured?: boolean } | undefined;

  // Get current quote data for selected ticker
  const selectedQuote = quotes.find((q) => q.ticker === selectedTicker);

  return (
    <div className="dashboard-grid app-shell">
      {/* Market state full-bleed background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: -1,
        backgroundImage: `url('${getMarketBg(marketState)}')`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: 0.04,
        transition: 'background-image 2s ease, opacity 1s ease',
        filter: 'saturate(1.5)',
        pointerEvents: 'none',
      }} />
      <Sidebar eli5Mode={eli5Mode} onToggleEli5={() => setEli5Mode(!eli5Mode)} />

      <div className="main-content flex flex-col">
        <TickerTape />

        {/* Aliasist status bar */}
        <div className="shrink-0 pl-12 pr-4 md:px-6 py-1.5 border-b border-border/40 flex items-center justify-between">
          <span className="status-badge">systems operational // aliasist pulse</span>
          <span className="status-badge" style={{ opacity: 0.5 }}>
            {new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase()}
          </span>
        </div>

        <div className={cn(
          "theme-topbar flex flex-col sm:flex-row sm:items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-border gap-3",
          eli5Mode && "eli5-active"
        )} style={{ position: "relative", overflow: "hidden" }}>
          {/* Subtle UFO city banner behind dashboard header */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "url('/aliasist-hero.png')",
            backgroundSize: "cover", backgroundPosition: "center 60%",
            opacity: 0.06, filter: "saturate(1.8)",
            pointerEvents: "none",
          }} />
          <div className="min-w-0 pl-12 sm:pl-0">
            <div className="theme-kicker mb-1.5">
              {eli5Mode ? "Learning Interface" : "// ALIASIST · SIGNAL DECK"}
            </div>
            <h1 className="theme-title text-lg md:text-2xl text-foreground truncate">
              {eli5Mode ? "🎓 Aliasist School" : "Aliasist Pulse Dashboard"}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground/80 hidden sm:block" style={{ color: "hsl(158 14% 62%)" }}>
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

        <div className="flex-1 overflow-y-auto overscroll-contain px-3 md:px-6 py-5 md:py-8 space-y-6 md:space-y-8">
          {/* Watchlist */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="theme-kicker">{eli5Mode ? "Your Toy Box" : "Watchlist"}</div>
              <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(10,203,155,0.2) 0%, transparent 70%)" }} />
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
                    onClick={() => { setSelectedTicker(q.ticker); void track("ticker_selected", q.ticker); }}
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
            <div className="flex items-center gap-3 mb-4">
              <div className="theme-kicker">{eli5Mode ? "Today's Stories" : "Journalism Intelligence"}</div>
              <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(10,203,155,0.2) 0%, transparent 70%)" }} />
            </div>
            <NewsFeed compact eli5Mode={eli5Mode} />
          </section>
        </div>
      </div>
    </div>
  );
}
