import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "../components/Sidebar";
import TickerTape from "../components/TickerTape";
import { TrendingUp, TrendingDown, Minus, Clock, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
export default function VectorsPage() {
    const [eli5Mode, setEli5Mode] = useState(false);
    const { data: vectors = [], isLoading: vecLoading } = useQuery({
        queryKey: ["/api/vectors"],
        refetchInterval: 30000,
    });
    const { data: runs = [] } = useQuery({
        queryKey: ["/api/scrub/runs"],
        refetchInterval: 30000,
    });
    const bullish = vectors.filter((v) => v.signal === "bullish");
    const bearish = vectors.filter((v) => v.signal === "bearish");
    const neutral = vectors.filter((v) => v.signal === "neutral");
    return (_jsxs("div", { className: "dashboard-grid app-shell", children: [_jsx(Sidebar, { eli5Mode: eli5Mode, onToggleEli5: () => setEli5Mode(!eli5Mode) }), _jsxs("div", { className: "main-content flex flex-col", children: [_jsx(TickerTape, {}), _jsxs("div", { className: "theme-topbar px-6 py-4 border-b border-border", children: [_jsx("div", { className: "theme-kicker mb-1", children: "Signal Mapping" }), _jsx("h1", { className: "theme-title text-2xl text-foreground", children: eli5Mode ? "🔭 The Signal Telescope" : "Logical Market Vectors" }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: eli5Mode
                                    ? "We look at clues and find patterns — like finding candy wrappers to know where the candy is!"
                                    : "Cross-referenced signals from all scraped sources" })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-6 space-y-6", children: [_jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
                                    { label: "Bullish", list: bullish, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", Icon: TrendingUp },
                                    { label: "Bearish", list: bearish, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/30", Icon: TrendingDown },
                                    { label: "Neutral", list: neutral, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", Icon: Minus },
                                ].map((g) => (_jsxs("div", { className: cn("theme-panel rounded-2xl p-4", g.bg), children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(g.Icon, { size: 16, className: g.color }), _jsx("span", { className: cn("text-sm font-semibold", g.color), children: g.label })] }), _jsx("div", { className: "text-3xl font-bold font-mono text-foreground", children: g.list.length }), _jsxs("div", { className: "text-xs text-muted-foreground", children: ["Avg confidence: ", g.list.length > 0
                                                    ? Math.round(g.list.reduce((a, v) => a + v.confidence, 0) / g.list.length * 100)
                                                    : 0, "%"] })] }, g.label))) }), _jsxs("div", { children: [_jsx("div", { className: "theme-kicker mb-3", children: "All Vectors" }), vecLoading ? (_jsx("div", { className: "space-y-3", children: [1, 2, 3].map(i => _jsx("div", { className: "skeleton h-24 rounded-lg" }, i)) })) : vectors.length === 0 ? (_jsx("div", { className: "text-center py-10 text-muted-foreground text-sm", children: "No vectors yet. Trigger a scrub from the dashboard to start analysis." })) : (_jsx("div", { className: "space-y-3", children: vectors.map((v) => {
                                            let sources = [];
                                            try {
                                                sources = JSON.parse(v.sources);
                                            }
                                            catch {
                                                sources = [];
                                            }
                                            return (_jsx("div", { className: "theme-panel rounded-2xl p-4", children: _jsx("div", { className: "flex items-start justify-between gap-4", children: _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2 flex-wrap", children: [_jsx(SignalBadge, { signal: v.signal }), v.ticker && (_jsx(Badge, { variant: "outline", className: "text-xs font-mono", children: v.ticker })), _jsxs("span", { className: "text-xs text-muted-foreground", children: [Math.round(v.confidence * 100), "% confidence"] }), _jsxs("div", { className: "flex items-center gap-1 text-xs text-muted-foreground", children: [_jsx(Clock, { size: 10 }), formatTime(v.createdAt)] })] }), _jsx("div", { className: "h-1 bg-muted rounded-full overflow-hidden mb-3 max-w-xs", children: _jsx("div", { className: cn("h-full rounded-full confidence-fill", confBg(v.signal)), style: { width: `${Math.round(v.confidence * 100)}%` } }) }), _jsx("p", { className: "text-sm text-foreground leading-relaxed", children: v.reasoning }), sources.length > 0 && (_jsx("div", { className: "mt-2 flex flex-wrap gap-1.5", children: sources.slice(0, 3).map((s, i) => (_jsxs("a", { href: s, target: "_blank", rel: "noopener noreferrer", className: "text-xs text-primary hover:underline truncate max-w-xs", children: [s.replace(/^https?:\/\//, "").slice(0, 60), "\u2026"] }, i))) }))] }) }) }, v.id));
                                        }) }))] }), _jsxs("div", { children: [_jsxs("div", { className: "theme-kicker mb-3", children: [_jsx(Database, { size: 12, className: "inline mr-1" }), "Scrub Memory (Recent Runs)"] }), _jsx("div", { className: "theme-panel rounded-2xl overflow-x-auto", children: _jsxs("table", { className: "w-full text-xs", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-border text-muted-foreground", children: [_jsx("th", { className: "text-left py-2 pr-4 font-medium", children: "Run Time" }), _jsx("th", { className: "text-left py-2 pr-4 font-medium", children: "Status" }), _jsx("th", { className: "text-left py-2 pr-4 font-medium", children: "Vectors" }), _jsx("th", { className: "text-left py-2 font-medium", children: "Summary" })] }) }), _jsx("tbody", { children: runs.map((r) => (_jsxs("tr", { className: "border-b border-border/50 hover:bg-accent/20", children: [_jsx("td", { className: "py-2 pr-4 text-muted-foreground font-mono", children: formatTime(r.runAt) }), _jsx("td", { className: "py-2 pr-4", children: _jsx(StatusBadge, { status: r.status }) }), _jsx("td", { className: "py-2 pr-4 font-mono text-foreground", children: r.vectorsFound }), _jsx("td", { className: "py-2 text-muted-foreground truncate max-w-xs", children: r.summary || "—" })] }, r.id))) })] }) })] })] })] })] }));
}
function SignalBadge({ signal }) {
    const map = {
        bullish: { label: "Bullish", class: "signal-bullish" },
        bearish: { label: "Bearish", class: "signal-bearish" },
        neutral: { label: "Neutral", class: "signal-neutral" },
    };
    const cfg = map[signal] || map.neutral;
    return _jsx("span", { className: cn("text-xs px-2 py-0.5 rounded-full font-medium", cfg.class), children: cfg.label });
}
function StatusBadge({ status }) {
    const map = {
        done: "text-emerald-400",
        running: "text-amber-400",
        error: "text-rose-400",
        pending: "text-muted-foreground",
    };
    return _jsx("span", { className: cn("font-medium capitalize", map[status] || "text-muted-foreground"), children: status });
}
function confBg(signal) {
    if (signal === "bullish")
        return "bg-emerald-400";
    if (signal === "bearish")
        return "bg-rose-400";
    return "bg-amber-400";
}
function formatTime(iso) {
    try {
        return format(new Date(iso), "MMM d, h:mm a");
    }
    catch {
        return iso;
    }
}
