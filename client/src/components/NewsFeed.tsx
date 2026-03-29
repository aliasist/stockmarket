import { useQuery } from "@tanstack/react-query";
import { ExternalLink, AlertTriangle, HelpCircle, BarChart2, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

interface NewsArticle {
  id: number;
  title: string;
  source: string;
  url: string;
  publishedAt?: string;
  summary?: string;
  tone?: string;
  toneReasoning?: string;
  ticker?: string;
}

const toneConfig: Record<string, { label: string; icon: typeof AlertTriangle; class: string }> = {
  fear_mongering: { label: "Fear", icon: AlertTriangle, class: "tone-fear" },
  speculative: { label: "Speculative", icon: HelpCircle, class: "tone-speculative" },
  data_backed: { label: "Data-Backed", icon: BarChart2, class: "tone-data" },
  neutral: { label: "Neutral", icon: Minus, class: "tone-neutral" },
};

export default function NewsFeed({ compact = false, eli5Mode = false }: { compact?: boolean; eli5Mode?: boolean }) {
  const [toneFilter, setToneFilter] = useState<string>("all");

  const { data: articles = [], isLoading } = useQuery<NewsArticle[]>({
    queryKey: ["/api/news"],
    refetchInterval: 60000,
  });

  const filtered = toneFilter === "all"
    ? articles
    : articles.filter((a) => a.tone === toneFilter);

  const displayed = compact ? filtered.slice(0, 8) : filtered;

  return (
    <div className="theme-panel rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold">
          {eli5Mode ? "📰 What's in the News?" : "Journalism Intelligence Feed"}
        </span>
        <Badge variant="outline" className="text-xs border-primary/20 bg-primary/5 text-primary">
          {articles.length} stories
        </Badge>
      </div>

      {!compact && (
        <div className="flex gap-1.5 px-4 py-2 border-b border-border overflow-x-auto">
          <button
            onClick={() => setToneFilter("all")}
            className={cn(
              "text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors border border-transparent",
              toneFilter === "all"
                ? "bg-primary/15 text-primary border-primary/30"
                : "text-muted-foreground hover:text-foreground bg-muted border-border/60"
            )}
          >
            All
          </button>
          {Object.entries(toneConfig).map(([key, cfg]) => (
            <button
              key={key}
              data-testid={`button-filter-${key}`}
              onClick={() => setToneFilter(key)}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors border border-transparent",
                toneFilter === key ? cfg.class : "text-muted-foreground hover:text-foreground bg-muted border-border/60"
              )}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      )}

      <ScrollArea className={compact ? "h-72" : "h-[500px]"}>
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="space-y-1.5">
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-3 w-2/3 rounded" />
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {articles.length === 0
              ? "Scanning news sources... First scrub is running."
              : "No articles match this filter."}
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {displayed.map((article) => {
              const tone = article.tone || "neutral";
              const cfg = toneConfig[tone] || toneConfig.neutral;
              const Icon = cfg.icon;
              return (
                <article
                  key={article.id}
                  data-testid={`article-${article.id}`}
                  className="px-4 py-3 hover:bg-accent/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className={cn("inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full", cfg.class)}>
                            <Icon size={9} />
                            {eli5Mode ? eli5Tone(tone) : cfg.label}
                          </span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {sourceLabel(article.source)}
                        </span>
                        {article.ticker && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            {article.ticker}
                          </span>
                        )}
                      </div>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-foreground hover:text-primary transition-colors line-clamp-2 font-medium"
                      >
                        {article.title}
                      </a>
                      {article.summary && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {eli5Mode ? eli5Summary(article.summary, tone) : article.summary}
                        </p>
                      )}
                      {!article.summary && article.toneReasoning && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          {article.toneReasoning}
                        </p>
                      )}
                    </div>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors mt-0.5 flex-shrink-0"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function sourceLabel(src: string): string {
  const map: Record<string, string> = {
    hackernews: "Hacker News",
    reddit: "Reddit",
    bluesky: "BlueSky",
    yahoo_finance: "Yahoo Finance",
  };
  return map[src] || src;
}

function eli5Tone(tone: string): string {
  const map: Record<string, string> = {
    fear_mongering: "😱 Scary Story",
    speculative: "🤔 Maybe?",
    data_backed: "📊 Real Facts",
    neutral: "😐 Just News",
  };
  return map[tone] || "News";
}

function eli5Summary(summary: string, tone: string): string {
  // Prepend an ELI5 emoji hint
  const prefix: Record<string, string> = {
    fear_mongering: "Watch out! ",
    speculative: "Someone thinks... ",
    data_backed: "The numbers show: ",
    neutral: "",
  };
  return (prefix[tone] || "") + summary;
}
