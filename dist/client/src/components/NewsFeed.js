import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, AlertTriangle, HelpCircle, BarChart2, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
const toneConfig = {
    fear_mongering: { label: "Fear", icon: AlertTriangle, class: "tone-fear" },
    speculative: { label: "Speculative", icon: HelpCircle, class: "tone-speculative" },
    data_backed: { label: "Data-Backed", icon: BarChart2, class: "tone-data" },
    neutral: { label: "Neutral", icon: Minus, class: "tone-neutral" },
};
export default function NewsFeed({ compact = false, eli5Mode = false }) {
    const [toneFilter, setToneFilter] = useState("all");
    const { data: articles = [], isLoading } = useQuery({
        queryKey: ["/api/news"],
        refetchInterval: 60000,
    });
    const filtered = toneFilter === "all"
        ? articles
        : articles.filter((a) => a.tone === toneFilter);
    const displayed = compact ? filtered.slice(0, 8) : filtered;
    return (_jsxs("div", { className: "theme-panel rounded-2xl overflow-hidden", children: [_jsxs("div", { className: "flex items-center justify-between px-4 py-3 border-b border-border", children: [_jsx("span", { className: "text-sm font-semibold", children: eli5Mode ? "📰 What's in the News?" : "Journalism Intelligence Feed" }), _jsxs(Badge, { variant: "outline", className: "text-xs border-primary/20 bg-primary/5 text-primary", children: [articles.length, " stories"] })] }), !compact && (_jsxs("div", { className: "flex gap-1.5 px-4 py-2 border-b border-border overflow-x-auto", children: [_jsx("button", { onClick: () => setToneFilter("all"), className: cn("text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors border border-transparent", toneFilter === "all"
                            ? "bg-primary/15 text-primary border-primary/30"
                            : "text-muted-foreground hover:text-foreground bg-muted border-border/60"), children: "All" }), Object.entries(toneConfig).map(([key, cfg]) => (_jsx("button", { "data-testid": `button-filter-${key}`, onClick: () => setToneFilter(key), className: cn("text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors border border-transparent", toneFilter === key ? cfg.class : "text-muted-foreground hover:text-foreground bg-muted border-border/60"), children: cfg.label }, key)))] })), _jsx(ScrollArea, { className: compact ? "h-72" : "h-[500px]", children: isLoading ? (_jsx("div", { className: "p-4 space-y-3", children: [1, 2, 3, 4].map(i => (_jsxs("div", { className: "space-y-1.5", children: [_jsx("div", { className: "skeleton h-4 w-full rounded" }), _jsx("div", { className: "skeleton h-3 w-2/3 rounded" })] }, i))) })) : displayed.length === 0 ? (_jsx("div", { className: "text-center py-8 text-muted-foreground text-sm", children: articles.length === 0
                        ? "Scanning news sources... First scrub is running."
                        : "No articles match this filter." })) : (_jsx("div", { className: "divide-y divide-border/50", children: displayed.map((article) => {
                        const tone = article.tone || "neutral";
                        const cfg = toneConfig[tone] || toneConfig.neutral;
                        const Icon = cfg.icon;
                        return (_jsx("article", { "data-testid": `article-${article.id}`, className: "px-4 py-3 hover:bg-accent/20 transition-colors", children: _jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-1.5 mb-1 flex-wrap", children: [_jsxs("span", { className: cn("inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full", cfg.class), children: [_jsx(Icon, { size: 9 }), eli5Mode ? eli5Tone(tone) : cfg.label] }), _jsx("span", { className: "text-xs text-muted-foreground capitalize", children: sourceLabel(article.source) }), article.ticker && (_jsx("span", { className: "text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded", children: article.ticker }))] }), _jsx("a", { href: article.url, target: "_blank", rel: "noopener noreferrer", className: "text-sm text-foreground hover:text-primary transition-colors line-clamp-2 font-medium", children: article.title }), article.summary && (_jsx("p", { className: "text-xs text-muted-foreground mt-1 line-clamp-2", children: eli5Mode ? eli5Summary(article.summary, tone) : article.summary })), !article.summary && article.toneReasoning && (_jsx("p", { className: "text-xs text-muted-foreground mt-1 italic", children: article.toneReasoning }))] }), _jsx("a", { href: article.url, target: "_blank", rel: "noopener noreferrer", className: "text-muted-foreground hover:text-primary transition-colors mt-0.5 flex-shrink-0", children: _jsx(ExternalLink, { size: 12 }) })] }) }, article.id));
                    }) })) })] }));
}
function sourceLabel(src) {
    const map = {
        hackernews: "Hacker News",
        reddit: "Reddit",
        bluesky: "BlueSky",
        yahoo_finance: "Yahoo Finance",
    };
    return map[src] || src;
}
function eli5Tone(tone) {
    const map = {
        fear_mongering: "😱 Scary Story",
        speculative: "🤔 Maybe?",
        data_backed: "📊 Real Facts",
        neutral: "😐 Just News",
    };
    return map[tone] || "News";
}
function eli5Summary(summary, tone) {
    // Prepend an ELI5 emoji hint
    const prefix = {
        fear_mongering: "Watch out! ",
        speculative: "Someone thinks... ",
        data_backed: "The numbers show: ",
        neutral: "",
    };
    return (prefix[tone] || "") + summary;
}
