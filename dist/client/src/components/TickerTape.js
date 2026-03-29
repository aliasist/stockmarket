import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
export default function TickerTape() {
    const { data: quotes = [] } = useQuery({
        queryKey: ["/api/quotes"],
        refetchInterval: 30000,
    });
    if (quotes.length === 0)
        return null;
    // Duplicate for seamless loop
    const items = [...quotes, ...quotes];
    return (_jsx("div", { className: "theme-topbar border-b border-border overflow-hidden py-2", children: _jsx("div", { className: "ticker-tape inline-flex gap-8", children: items.map((q, i) => (_jsxs("span", { className: "inline-flex items-center gap-2 text-xs whitespace-nowrap", children: [_jsx("span", { className: "font-bold text-primary/90", children: q.ticker }), _jsx("span", { className: "font-mono text-foreground/90", children: formatPrice(q.price) }), _jsxs("span", { className: cn("font-mono", q.change >= 0 ? "text-emerald-400" : "text-rose-400"), children: [q.change >= 0 ? "+" : "", q.changePercent.toFixed(2), "%"] })] }, i))) }) }));
}
function formatPrice(p) {
    if (p >= 10000)
        return p.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    if (p >= 100)
        return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
