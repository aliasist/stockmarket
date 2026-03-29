import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import TickerTape from "../components/TickerTape";
import NewsFeed from "../components/NewsFeed";
import { useQuery } from "@tanstack/react-query";
import { BarChart2, AlertTriangle, HelpCircle, Minus } from "lucide-react";
export default function NewsPage() {
    const [eli5Mode, setEli5Mode] = useState(false);
    const { data: articles = [] } = useQuery({
        queryKey: ["/api/news"],
    });
    const toneCounts = articles.reduce((acc, a) => {
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
    return (_jsxs("div", { className: "dashboard-grid app-shell", children: [_jsx(Sidebar, { eli5Mode: eli5Mode, onToggleEli5: () => setEli5Mode(!eli5Mode) }), _jsxs("div", { className: "main-content flex flex-col", children: [_jsx(TickerTape, {}), _jsxs("div", { className: "theme-topbar px-6 py-4 border-b border-border", children: [_jsx("div", { className: "theme-kicker mb-1", children: "Narrative Scanner" }), _jsx("h1", { className: "theme-title text-2xl text-foreground", children: eli5Mode ? "📰 The News Sorter" : "Journalism Intelligence Feed" }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: eli5Mode
                                    ? "We sort news like candy — yummy facts, scary stories, and wild guesses!"
                                    : "AI-classified news articles sorted by tone and intent" })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-6 space-y-6", children: [_jsx("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-3", children: stats.map((s) => {
                                    const Icon = s.icon;
                                    const count = toneCounts[s.key] || 0;
                                    const pct = articles.length > 0 ? Math.round((count / articles.length) * 100) : 0;
                                    return (_jsxs("div", { className: "theme-panel rounded-2xl p-4", children: [_jsxs("div", { className: `inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md mb-2 ${s.color}`, children: [_jsx(Icon, { size: 11 }), eli5Mode ? eli5ToneLabel(s.key) : s.label] }), _jsx("div", { className: "text-2xl font-bold font-mono text-foreground", children: count }), _jsxs("div", { className: "text-xs text-muted-foreground", children: [pct, "% of feed"] }), _jsx("div", { className: "mt-2 h-1 bg-muted rounded-full overflow-hidden", children: _jsx("div", { className: `h-full rounded-full transition-all duration-700 ${s.color.split(" ")[1]}`, style: { width: `${pct}%`, opacity: 0.8 } }) })] }, s.key));
                                }) }), _jsx(NewsFeed, { compact: false, eli5Mode: eli5Mode })] })] })] }));
}
function eli5ToneLabel(key) {
    const map = {
        fear_mongering: "Scary Stories",
        speculative: "Wild Guesses",
        data_backed: "Real Facts",
        neutral: "Just Info",
    };
    return map[key] || key;
}
