import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
export function AnalyticsSpikes() {
    const { data, isLoading, error } = useQuery({
        queryKey: ["/api/analytics"],
    });
    if (isLoading)
        return _jsx("div", { className: "skeleton h-24 rounded-lg", children: "Loading spikes\u2026" });
    if (error)
        return _jsx("div", { className: "text-red-500", children: "Error loading analytics data." });
    if (!data?.spikes?.length)
        return _jsx("div", { className: "text-muted-foreground", children: "No spikes detected." });
    return (_jsxs("div", { className: "bg-card p-4 rounded-xl shadow", children: [_jsx("div", { className: "theme-kicker mb-2", children: "Analytics Spikes" }), _jsxs("table", { className: "w-full text-xs", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "text-left", children: "Timestamp" }), _jsx("th", { className: "text-left", children: "Value" }), _jsx("th", { className: "text-left", children: "Previous" })] }) }), _jsx("tbody", { children: data.spikes.map((row, i) => (_jsxs("tr", { className: "border-b last:border-none", children: [_jsx("td", { children: row.timestamp }), _jsx("td", { className: "font-bold text-emerald-500", children: row.value }), _jsx("td", { className: "text-muted-foreground", children: row.prev_value })] }, i))) })] })] }));
}
