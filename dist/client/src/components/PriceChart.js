import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useState } from "react";
import { cn } from "@/lib/utils";
const RANGES = [
    { label: "1D", range: "1d", interval: "5m" },
    { label: "5D", range: "5d", interval: "15m" },
    { label: "1M", range: "1mo", interval: "1d" },
    { label: "3M", range: "3mo", interval: "1d" },
];
export default function PriceChart({ ticker }) {
    const [rangeIdx, setRangeIdx] = useState(1);
    const { range, interval } = RANGES[rangeIdx];
    const { data: candles = [], isLoading } = useQuery({
        queryKey: ["/api/chart", ticker, range, interval],
        queryFn: async () => {
            const res = await fetch(`./api/chart/${ticker}?range=${range}&interval=${interval}`);
            return res.json();
        },
        refetchInterval: 60000,
    });
    const chartData = candles.map((c) => ({
        time: formatTime(c.timestamp, range),
        price: c.close,
        volume: c.volume,
    }));
    const minPrice = Math.min(...chartData.map((d) => d.price)) * 0.998;
    const maxPrice = Math.max(...chartData.map((d) => d.price)) * 1.002;
    const isUp = chartData.length > 1 && chartData[chartData.length - 1].price >= chartData[0].price;
    const strokeColor = isUp ? "#34d399" : "#f87171";
    const gradientId = `gradient-${ticker}-${rangeIdx}`;
    return (_jsxs("div", { className: "theme-panel rounded-2xl p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { children: [_jsx("div", { className: "theme-kicker mb-1", children: "Price Action" }), _jsxs("div", { className: "text-base font-semibold text-foreground", children: [ticker, " Price"] })] }), _jsx("div", { className: "flex gap-1", children: RANGES.map((r, i) => (_jsx("button", { "data-testid": `button-range-${r.label.toLowerCase()}`, onClick: () => setRangeIdx(i), className: cn("text-xs px-2.5 py-1 rounded-full transition-colors border border-transparent", i === rangeIdx
                                ? "bg-primary/15 text-primary font-medium border-primary/30"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/70"), children: r.label }, r.label))) })] }), isLoading ? (_jsx("div", { className: "h-48 skeleton" })) : (_jsx(ResponsiveContainer, { width: "100%", height: 200, children: _jsxs(AreaChart, { data: chartData, margin: { top: 5, right: 0, left: 0, bottom: 0 }, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: gradientId, x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: strokeColor, stopOpacity: 0.2 }), _jsx("stop", { offset: "95%", stopColor: strokeColor, stopOpacity: 0 })] }) }), _jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "hsl(217 33% 18%)", vertical: false }), _jsx(XAxis, { dataKey: "time", tick: { fill: "hsl(215 20% 65%)", fontSize: 10 }, tickLine: false, axisLine: false, interval: Math.max(1, Math.floor(chartData.length / 6)), minTickGap: 40 }), _jsx(YAxis, { domain: [minPrice, maxPrice], tick: { fill: "hsl(215 20% 65%)", fontSize: 10 }, tickLine: false, axisLine: false, tickFormatter: (v) => "$" + v.toFixed(0), width: 58 }), _jsx(Tooltip, { contentStyle: {
                                background: "hsl(257 29% 11% / 0.95)",
                                border: "1px solid hsl(258 22% 22%)",
                                borderRadius: 12,
                                fontSize: 12,
                            }, formatter: (v) => ["$" + v.toFixed(2), "Price"], labelStyle: { color: "hsl(256 13% 69%)" } }), _jsx(Area, { type: "monotone", dataKey: "price", stroke: strokeColor, strokeWidth: 2, fill: `url(#${gradientId})`, dot: false, activeDot: { r: 4, fill: strokeColor } })] }) }))] }));
}
function formatTime(ts, range) {
    const d = new Date(ts);
    if (range === "1d")
        return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    if (range === "5d")
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
