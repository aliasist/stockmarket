import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
const eli5Names = {
    "SPY": "The Big Toy Box",
    "QQQ": "The Tech Toy Store",
    "BTC-USD": "Magic Internet Candy",
    "AAPL": "The Apple Tree",
    "NVDA": "The Robot Brain Shop",
    "TSLA": "The Electric Car Toy",
};
export default function QuoteCard({ quote, onClick, active, eli5Mode }) {
    const up = quote.change >= 0;
    const Icon = up ? TrendingUp : Math.abs(quote.changePercent) < 0.1 ? Minus : TrendingDown;
    return (_jsxs("button", { "data-testid": `card-quote-${quote.ticker}`, onClick: onClick, className: cn("theme-panel-soft w-full text-left p-4 rounded-2xl transition-all hover:-translate-y-0.5", active
            ? "border-primary/50 bg-primary/8 shadow-[0_0_0_1px_rgba(180,117,255,0.18),0_20px_40px_rgba(18,10,36,0.35)]"
            : "hover:border-primary/20 hover:bg-accent/40"), children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[11px] font-bold uppercase tracking-[0.24em] text-primary/75", children: quote.ticker }), _jsx("div", { className: "text-sm font-medium text-foreground leading-tight mt-0.5", children: eli5Mode ? (eli5Names[quote.ticker] || quote.name) : quote.name })] }), _jsxs("div", { className: cn("flex items-center gap-1 text-xs px-2 py-0.5 rounded-full", up ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"), children: [_jsx(Icon, { size: 10 }), up ? "+" : "", quote.changePercent.toFixed(2), "%"] })] }), _jsx("div", { className: "font-mono text-xl font-bold text-foreground", children: formatPrice(quote.price) }), _jsxs("div", { className: "flex items-center justify-between mt-1", children: [_jsxs("span", { className: cn("text-sm font-mono font-medium", up ? "text-emerald-400" : "text-rose-400"), children: [up ? "▲" : "▼", " ", Math.abs(quote.change).toFixed(2)] }), _jsxs("span", { className: "text-xs text-muted-foreground", children: ["Vol ", formatVolume(quote.volume)] })] })] }));
}
function formatPrice(p) {
    if (p >= 10000)
        return "$" + p.toLocaleString("en-US", { maximumFractionDigits: 0 });
    return "$" + p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatVolume(v) {
    if (v >= 1_000_000_000)
        return (v / 1_000_000_000).toFixed(1) + "B";
    if (v >= 1_000_000)
        return (v / 1_000_000).toFixed(1) + "M";
    if (v >= 1_000)
        return (v / 1_000).toFixed(0) + "K";
    return String(v);
}
