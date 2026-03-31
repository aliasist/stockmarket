import { useState } from "react";
import Sidebar from "../components/Sidebar";
import TickerTape from "../components/TickerTape";
import NewsFeed from "../components/NewsFeed";
import { useQuery } from "@tanstack/react-query";
import { BarChart2, AlertTriangle, HelpCircle, Minus } from "lucide-react";

interface NewsArticle {
  tone?: string;
}

export default function NewsPage() {
  const [eli5Mode, setEli5Mode] = useState(false);

  const { data: articles = [] } = useQuery<NewsArticle[]>({
    queryKey: ["/api/news"],
  });

  const toneCounts = articles.reduce((acc: Record<string, number>, a) => {
    const t = a.tone || "neutral";
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const stats = [
    { label: "Fear-Mongering", key: "fear_mongering", icon: AlertTriangle, color: "text-rose-400 bg-rose-500/10" },
    { label: "Speculative", key: "speculative", icon: HelpCircle, color: "text-amber-400 bg-amber-500/10" },
    { label: "Data-Backed", key: "data_backed", icon: BarChart2, color: "text-cyan-400 bg-cyan-500/10" },
    { label: "Neutral", key: "neutral", icon: Minus, color: "text-slate-400 bg-slate-500/10" },
  ];

  return (
    <div className="dashboard-grid app-shell">
      <Sidebar eli5Mode={eli5Mode} onToggleEli5={() => setEli5Mode(!eli5Mode)} />
      <div className="main-content flex flex-col">
        <TickerTape />
        <div className="theme-topbar px-6 py-4 border-b border-border" style={{ position: "relative", overflow: "hidden" }}>
          {/* Subtle neural intelligence banner */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "url('/aliasist-brain.png')",
            backgroundSize: "cover", backgroundPosition: "center 25%",
            opacity: 0.07, filter: "saturate(1.5)",
            pointerEvents: "none",
          }} />
          <div className="theme-kicker mb-1">Narrative Scanner</div>
          <h1 className="theme-title text-2xl text-foreground">
            {eli5Mode ? "📰 The News Sorter" : "Journalism Intelligence Feed"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {eli5Mode
              ? "We sort news like candy — yummy facts, scary stories, and wild guesses!"
              : "AI-classified news articles sorted by tone and intent"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((s) => {
              const Icon = s.icon;
              const count = toneCounts[s.key] || 0;
              const pct = articles.length > 0 ? Math.round((count / articles.length) * 100) : 0;
              return (
                <div key={s.key} className="theme-panel rounded-2xl p-4">
                  <div className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md mb-2 ${s.color}`}>
                    <Icon size={11} />
                    {eli5Mode ? eli5ToneLabel(s.key) : s.label}
                  </div>
                  <div className="text-2xl font-bold font-mono text-foreground">{count}</div>
                  <div className="text-xs text-muted-foreground">{pct}% of feed</div>
                  <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${s.color.split(" ")[1]}`}
                      style={{ width: `${pct}%`, opacity: 0.8 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <NewsFeed compact={false} eli5Mode={eli5Mode} />
        </div>
      </div>
    </div>
  );
}

function eli5ToneLabel(key: string): string {
  const map: Record<string, string> = {
    fear_mongering: "Scary Stories",
    speculative: "Wild Guesses",
    data_backed: "Real Facts",
    neutral: "Just Info",
  };
  return map[key] || key;
}
