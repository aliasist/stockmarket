import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import { AnalyticsSpikes } from "../components/AnalyticsSpikes";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
export default function Dashboard() {
    const [eli5Mode, setEli5Mode] = useState(false);
    const [selectedTicker, setSelectedTicker] = useState("SPY");
    const qc = useQueryClient();
    const { toast } = useToast();
    const { data: quotes = [], isLoading: quotesLoading } = useQuery({
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
    const h = health;
    return (_jsxs("div", { className: "dashboard-grid app-shell", children: [_jsx(Sidebar, { eli5Mode: eli5Mode, onToggleEli5: () => setEli5Mode(!eli5Mode) }), _jsxs("div", { className: "main-content flex flex-col", children: [_jsx(TickerTape, {}), _jsxs("div", { className: cn("theme-topbar flex items-center justify-between px-6 py-4 border-b border-border", eli5Mode && "eli5-active"), children: [_jsxs("div", { children: [_jsx("div", { className: "theme-kicker mb-1", children: eli5Mode ? "Learning Interface" : "Aliasist-Inspired Trading Console" }), _jsx("h1", { className: "theme-title text-2xl text-foreground", children: eli5Mode ? "🎓 Market School Dashboard" : "Market Pulse Dashboard" }), _jsx("p", { className: "text-sm text-muted-foreground", children: eli5Mode
                                            ? "Learning Mode Active — we'll explain everything like you're 5!"
                                            : "Real-time analytics · Recursive scrub every 15 min" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [h && !h.aiConfigured && (_jsx("div", { className: "text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-md", children: "Enable Workers AI for AI features" })), _jsxs(Button, { "data-testid": "button-trigger-scrub", size: "sm", variant: "outline", onClick: () => triggerScrub.mutate(), disabled: triggerScrub.isPending, className: "text-xs gap-1.5 border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary", children: [triggerScrub.isPending ? (_jsx(RefreshCw, { size: 12, className: "animate-spin" })) : (_jsx(Zap, { size: 12 })), "Run Scrub"] })] })] }), _jsx("div", { className: "mt-8", children: _jsx(AnalyticsSpikes, {}) }), _jsxs("div", { className: "flex-1 overflow-y-auto overscroll-contain p-6 space-y-6", children: [_jsxs("section", { children: [_jsx("div", { className: "theme-kicker mb-3", children: eli5Mode ? "Your Toy Box" : "Watchlist" }), quotesLoading ? (_jsx("div", { className: "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3", children: [1, 2, 3, 4, 5, 6].map(i => _jsx("div", { className: "skeleton h-28 rounded-lg" }, i)) })) : (_jsx("div", { className: "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3", children: quotes.map((q) => (_jsx(QuoteCard, { quote: q, active: selectedTicker === q.ticker, onClick: () => setSelectedTicker(q.ticker), eli5Mode: eli5Mode }, q.ticker))) }))] }), _jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-3 gap-6", children: [_jsx("div", { className: "xl:col-span-2", children: _jsx(PriceChart, { ticker: selectedTicker }) }), _jsx("div", { children: _jsx(PredictivePanel, { ticker: selectedTicker, eli5Mode: eli5Mode }) })] }), _jsxs("section", { children: [_jsx("div", { className: "theme-kicker mb-3", children: eli5Mode ? "Today's Stories" : "Journalism Intelligence (Latest)" }), _jsx(NewsFeed, { compact: true, eli5Mode: eli5Mode })] })] })] })] }));
}
