import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import Sidebar from "../components/Sidebar";
import TickerTape from "../components/TickerTape";
import QuoteCard from "../components/QuoteCard";
import PriceChart from "../components/PriceChart";
import PredictivePanel from "../components/PredictivePanel";
import NewsFeed from "../components/NewsFeed";
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
  const [selectedTicker, setSelectedTicker] = useState("SPY");
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

  const h = health as any;

  return (
    <div className="dashboard-grid app-shell">
      <Sidebar eli5Mode={eli5Mode} onToggleEli5={() => setEli5Mode(!eli5Mode)} />

      <div className="main-content flex flex-col">
        <TickerTape />

        <div className={cn(
          "theme-topbar flex items-center justify-between px-6 py-4 border-b border-border",
          eli5Mode && "eli5-active"
        )}>
          <div>
            <div className="theme-kicker mb-1">
              {eli5Mode ? "Learning Interface" : "Aliasist-Inspired Trading Console"}
            </div>
            <h1 className="theme-title text-2xl text-foreground">
              {eli5Mode ? "🎓 Market School Dashboard" : "Market Pulse Dashboard"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {eli5Mode
                ? "Learning Mode Active — we'll explain everything like you're 5!"
                : "Real-time analytics · Recursive scrub every 15 min"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {h && !h.geminiConfigured && (
              <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-md">
                Set GEMINI_API_KEY for AI features
              </div>
            )}
            <Button
              data-testid="button-trigger-scrub"
              size="sm"
              variant="outline"
              onClick={() => triggerScrub.mutate()}
              disabled={triggerScrub.isPending}
              className="text-xs gap-1.5 border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
            >
              {triggerScrub.isPending ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <Zap size={12} />
              )}
              Run Scrub
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-6">
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

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <PriceChart ticker={selectedTicker} />
            </div>
            <div>
              <PredictivePanel ticker={selectedTicker} eli5Mode={eli5Mode} />
            </div>
          </div>

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
