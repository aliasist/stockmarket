import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { LayoutDashboard, Newspaper, TrendingUp, Settings, Zap, Brain, Moon, SunMedium } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "./theme-provider";
const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/news", label: "News Feed", icon: Newspaper },
    { href: "/vectors", label: "Market Vectors", icon: TrendingUp },
    { href: "/settings", label: "Settings", icon: Settings },
];
export default function Sidebar({ eli5Mode, onToggleEli5 }) {
    const [loc] = useHashLocation();
    const { theme, toggleTheme } = useTheme();
    const { data: latestRun } = useQuery({
        queryKey: ["/api/scrub/latest"],
        refetchInterval: 30000,
    });
    const isRunning = latestRun?.status === "running";
    return (_jsxs("aside", { className: "theme-panel bg-sidebar/90 border-r border-sidebar-border flex flex-col h-full overflow-y-auto overscroll-contain rounded-none", children: [_jsx("div", { className: "p-4 border-b border-sidebar-border", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "theme-logo-ring flex h-12 w-12 items-center justify-center rounded-2xl", children: _jsx("img", { src: "/saucer-DiBJND36.svg", alt: "Market Pulse logo", className: "h-7 w-7 object-contain opacity-95" }) }), _jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "theme-kicker", children: "Aliasist Signal Deck" }), _jsx("div", { className: "text-sm font-semibold text-foreground leading-tight", children: "Market Pulse" }), _jsx("div", { className: "text-xs text-muted-foreground leading-tight", children: "Finance, rewritten with atmosphere" })] })] }) }), _jsxs("div", { className: "px-3 py-3 border-b border-sidebar-border", children: [_jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsx("span", { className: "text-muted-foreground", children: "Data Engine" }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: cn("w-1.5 h-1.5 rounded-full", isRunning ? "bg-amber-400 animate-pulse" : "bg-emerald-400") }), _jsx("span", { className: cn("font-medium", isRunning ? "text-amber-400" : "text-emerald-400"), children: isRunning ? "Scanning..." : "Active" })] })] }), latestRun && (_jsxs("div", { className: "text-xs text-muted-foreground mt-0.5", children: [latestRun.vectorsFound, " vectors \u00B7 ", timeAgo(latestRun.runAt)] }))] }), _jsx("nav", { className: "flex-1 p-2 space-y-0.5", children: navItems.map((item) => {
                    const Icon = item.icon;
                    const active = loc === item.href || (item.href !== "/" && loc.startsWith(item.href));
                    return (_jsx(Link, { href: item.href, children: _jsxs("a", { className: cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer border border-transparent", active
                                ? "bg-primary/12 text-primary font-medium border-primary/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/60 hover:border-border/70"), children: [_jsx(Icon, { size: 16 }), item.label] }) }, item.href));
                }) }), _jsxs("div", { className: "p-3 border-t border-border space-y-2", children: [_jsxs("button", { onClick: toggleTheme, "data-testid": "button-theme-toggle", className: "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all border bg-muted/50 text-muted-foreground border-border hover:text-foreground hover:bg-accent/70", children: [theme === "dark" ? _jsx(Moon, { size: 16 }) : _jsx(SunMedium, { size: 16 }), _jsx("span", { className: "flex-1 text-left", children: theme === "dark" ? "Dark Mode" : "Normal Mode" }), _jsx(Badge, { variant: "outline", className: "text-xs border-border/80 text-foreground", children: "Switch" })] }), _jsxs("button", { onClick: onToggleEli5, "data-testid": "button-eli5-toggle", className: cn("w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all border", eli5Mode
                            ? "bg-primary/12 text-primary border-primary/30"
                            : "bg-muted/50 text-muted-foreground border-border hover:text-foreground hover:bg-accent/70"), children: [_jsx(Brain, { size: 16 }), _jsx("span", { className: "flex-1 text-left", children: "Learning Mode" }), eli5Mode && (_jsx(Badge, { variant: "outline", className: "text-xs border-primary/40 text-primary", children: "ELI5" }))] }), eli5Mode && (_jsx("p", { className: "text-xs text-muted-foreground mt-1.5 px-1", children: "Financial terms explained with toys & candy" }))] }), _jsx("div", { className: "p-3 border-t border-border", children: _jsxs("div", { className: "text-xs text-muted-foreground", children: [_jsxs("div", { className: "flex items-center gap-1 mb-0.5", children: [_jsx(Zap, { size: 10, className: "text-primary" }), "Refreshes every 15 min"] }), _jsxs("div", { className: "text-xs opacity-60", children: ["Theme: ", theme, " \u00B7 Aliasist.com"] })] }) })] }));
}
function timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)
        return "just now";
    if (mins < 60)
        return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)
        return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}
