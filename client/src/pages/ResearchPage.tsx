import { useState } from "react";
import { Link } from "wouter";
import ResearchChatPanel from "../components/ResearchChatPanel";
import Sidebar from "../components/Sidebar";
import EarningsRadar from "../components/EarningsRadar";
import DCFCalculator from "../components/DCFCalculator";
import { cn } from "@/lib/utils";
import { Search, TrendingUp } from "lucide-react";

type RightTab = "earnings" | "dcf";

export default function ResearchPage() {
  const [eli5Mode, setEli5Mode] = useState(false);
  const [rightTab, setRightTab] = useState<RightTab>("earnings");
  const [ticker, setTicker] = useState("AAPL");
  const [inputValue, setInputValue] = useState("AAPL");

  function handleTickerSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = inputValue.trim().toUpperCase();
    if (t) setTicker(t);
  }

  return (
    <div className="dashboard-grid app-shell">
      <Sidebar eli5Mode={eli5Mode} onToggleEli5={() => setEli5Mode(!eli5Mode)} />
      <div className="main-content flex flex-col min-h-0">
        {/* Header */}
        <header className="theme-topbar shrink-0 px-6 py-5 border-b border-border" style={{ position: "relative", overflow: "hidden" }}>
          {/* Subtle banner image in header background */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "url('/aliasist-command.png')",
            backgroundSize: "cover", backgroundPosition: "center 30%",
            opacity: 0.07, filter: "saturate(1.6)",
            pointerEvents: "none",
          }} />
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="theme-kicker mb-1">Groq · Market-Aware</div>
              <h1 className="theme-title text-2xl text-foreground">Research chat</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Chat is <span className="text-primary font-medium">market-aware</span> and connected to your watchlist —
                ask about any ticker, macro theme, or earnings event.
              </p>
            </div>
            <Link
              href="/pitch"
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
                "border border-primary/30 bg-primary/10 text-primary text-sm font-medium",
                "hover:bg-primary/20 hover:border-primary/50 transition-colors"
              )}
            >
              <TrendingUp size={14} />
              Quick Pitch
            </Link>
          </div>
        </header>

        {/* Two-column body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left: Chat */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-6 flex justify-center items-start">
            <ResearchChatPanel />
          </div>

          {/* Right: Tools panel */}
          <div
            className="w-[360px] shrink-0 border-l border-border flex flex-col min-h-0 overflow-hidden"
            style={{ background: "hsl(var(--card) / 0.4)" }}
          >
            {/* Ticker input */}
            <div className="shrink-0 px-4 pt-4 pb-3 border-b border-border/50">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary/70 mb-1.5">
                Ticker
              </div>
              <form onSubmit={handleTickerSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search
                    size={12}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value.toUpperCase())}
                    placeholder="e.g. AAPL"
                    className={cn(
                      "w-full pl-7 pr-3 py-1.5 rounded-lg text-sm font-mono font-semibold",
                      "bg-white/5 border border-border/60 text-foreground placeholder:text-muted-foreground/50",
                      "focus:outline-none focus:border-primary/50 focus:bg-white/8 transition-colors"
                    )}
                  />
                </div>
                <button
                  type="submit"
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0",
                    "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
                  )}
                >
                  Go
                </button>
              </form>
              {ticker && (
                <div className="mt-1.5 text-[11px] text-muted-foreground">
                  Showing data for{" "}
                  <span className="text-primary font-semibold font-mono">{ticker}</span>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="shrink-0 flex border-b border-border/50">
              {(
                [
                  { id: "earnings", label: "Earnings Radar" },
                  { id: "dcf", label: "DCF Model" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setRightTab(tab.id)}
                  className={cn(
                    "flex-1 px-3 py-2.5 text-xs font-semibold transition-colors",
                    rightTab === tab.id
                      ? "text-primary border-b-2 border-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/3"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4">
              {rightTab === "earnings" ? (
                <EarningsRadar ticker={ticker} />
              ) : (
                <DCFCalculator ticker={ticker} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
