import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { Brain, TrendingUp, TrendingDown, Minus, RefreshCw, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import Eli5Tooltip from "./Eli5Tooltip";
const FINANCIAL_TERMS = [
    "Quantitative Tightening",
    "Moving Average Convergence Divergence",
    "Federal Reserve",
    "Yield Curve",
    "Market Capitalization",
    "Volatility Index",
];
export default function PredictivePanel({ ticker, eli5Mode }) {
    const { data: prediction, isLoading: predLoading, refetch: refetchPred } = useQuery({
        queryKey: ["/api/predict", ticker],
        queryFn: async () => {
            const res = await fetch(`./api/predict/${ticker}`);
            return res.json();
        },
        staleTime: 5 * 60 * 1000,
    });
    const { data: vectors = [], isLoading: vecLoading } = useQuery({
        queryKey: ["/api/vectors"],
        refetchInterval: 60000,
    });
    const tickerVectors = vectors.filter((v) => !v.ticker || v.ticker === ticker).slice(0, 5);
    const isLoading = predLoading || vecLoading;
    return (_jsxs("div", { className: cn("rounded-2xl border p-4 space-y-4", eli5Mode ? "eli5-active" : "theme-panel"), children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Brain, { size: 16, className: "text-primary" }), _jsx("span", { className: "text-sm font-semibold", children: eli5Mode ? "🧠 What's the Market Thinking?" : "Predictive Reasoning" }), eli5Mode && _jsx("span", { className: "text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full", children: "ELI5" })] }), _jsx("button", { "data-testid": "button-refresh-prediction", onClick: () => refetchPred(), className: "text-muted-foreground hover:text-foreground transition-colors", children: _jsx(RefreshCw, { size: 14 }) })] }), isLoading ? (_jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "skeleton h-10 rounded" }), _jsx("div", { className: "skeleton h-16 rounded" })] })) : prediction ? (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(SignalIcon, { signal: prediction.prediction, size: 20 }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("span", { className: cn("text-sm font-bold capitalize", signalColor(prediction.prediction)), children: eli5Mode ? eli5Signal(prediction.prediction) : prediction.prediction }), _jsxs("div", { className: "flex items-center gap-1 text-xs text-muted-foreground", children: [_jsx(Clock, { size: 10 }), prediction.timeframe] })] }), _jsx("div", { className: "h-1.5 bg-muted rounded-full overflow-hidden", children: _jsx("div", { className: cn("h-full rounded-full confidence-fill", confidenceBg(prediction.prediction)), style: { width: `${Math.round(prediction.confidence * 100)}%` } }) }), _jsxs("div", { className: "text-xs text-muted-foreground mt-0.5", children: [Math.round(prediction.confidence * 100), "% confidence"] })] })] }), _jsx("div", { className: cn("text-sm leading-relaxed p-3 rounded-md", eli5Mode ? "bg-primary/10 text-foreground" : "bg-muted/50 text-foreground/80"), children: prediction.reasoning })] })) : null, _jsxs("div", { children: [_jsx("div", { className: "theme-kicker mb-2", children: eli5Mode ? "What Signals Are We Seeing?" : "Logical Market Vectors" }), vecLoading ? (_jsx("div", { className: "space-y-1.5", children: [1, 2, 3].map(i => _jsx("div", { className: "skeleton h-12 rounded" }, i)) })) : tickerVectors.length === 0 ? (_jsx("div", { className: "text-xs text-muted-foreground text-center py-4", children: "Scrub in progress \u2014 vectors will appear here" })) : (_jsx("div", { className: "space-y-2", children: tickerVectors.map((v) => (_jsxs("div", { className: "p-2.5 rounded-xl bg-muted/30 border border-border/50", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(SignalIcon, { signal: v.signal, size: 12 }), _jsxs("span", { className: cn("text-xs font-semibold capitalize", signalColor(v.signal)), children: [v.ticker || "MACRO", " \u2014 ", v.signal] })] }), _jsxs("span", { className: "text-xs text-muted-foreground", children: [Math.round(v.confidence * 100), "%"] })] }), _jsx("p", { className: "text-sm text-foreground/75 leading-relaxed", children: v.reasoning })] }, v.id))) }))] }), eli5Mode && (_jsxs("div", { className: "border-t border-primary/20 pt-3", children: [_jsx("div", { className: "text-xs font-semibold text-primary mb-2", children: "Tap a term to learn it:" }), _jsx("div", { className: "flex flex-wrap gap-1.5", children: FINANCIAL_TERMS.map((term) => (_jsx(Eli5Tooltip, { term: term }, term))) })] }))] }));
}
function SignalIcon({ signal, size }) {
    const props = { size, strokeWidth: 2.5 };
    if (signal === "bullish")
        return _jsx(TrendingUp, { ...props, className: "text-emerald-400" });
    if (signal === "bearish")
        return _jsx(TrendingDown, { ...props, className: "text-rose-400" });
    return _jsx(Minus, { ...props, className: "text-amber-400" });
}
function signalColor(s) {
    if (s === "bullish")
        return "text-emerald-400";
    if (s === "bearish")
        return "text-rose-400";
    return "text-amber-400";
}
function confidenceBg(s) {
    if (s === "bullish")
        return "bg-emerald-400";
    if (s === "bearish")
        return "bg-rose-400";
    return "bg-amber-400";
}
function eli5Signal(s) {
    if (s === "bullish")
        return "Going UP 🚀 (Like candy prices on Halloween!)";
    if (s === "bearish")
        return "Going DOWN 😬 (Like when your ice cream melts...)";
    return "Staying the same 🤷 (Like swings with no wind)";
}
