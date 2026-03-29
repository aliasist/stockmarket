import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import TickerTape from "../components/TickerTape";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
export default function SettingsPage() {
    const [eli5Mode, setEli5Mode] = useState(false);
    const [newTicker, setNewTicker] = useState("");
    const [newName, setNewName] = useState("");
    const [newType, setNewType] = useState("stock");
    const qc = useQueryClient();
    const { toast } = useToast();
    const { data: watchlist = [] } = useQuery({ queryKey: ["/api/watchlist"] });
    const { data: health } = useQuery({ queryKey: ["/api/health"] });
    const h = health;
    const addMutation = useMutation({
        mutationFn: () => apiRequest("POST", "./api/watchlist", { ticker: newTicker, name: newName, type: newType }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["/api/watchlist"] });
            setNewTicker("");
            setNewName("");
            toast({ title: "Added to watchlist" });
        },
        onError: () => toast({ title: "Failed to add", variant: "destructive" }),
    });
    const removeMutation = useMutation({
        mutationFn: (ticker) => apiRequest("DELETE", `./api/watchlist/${ticker}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["/api/watchlist"] });
            toast({ title: "Removed from watchlist" });
        },
    });
    return (_jsxs("div", { className: "dashboard-grid app-shell", children: [_jsx(Sidebar, { eli5Mode: eli5Mode, onToggleEli5: () => setEli5Mode(!eli5Mode) }), _jsxs("div", { className: "main-content flex flex-col", children: [_jsx(TickerTape, {}), _jsxs("div", { className: "theme-topbar px-6 py-4 border-b border-border", children: [_jsx("div", { className: "theme-kicker mb-1", children: "Control Room" }), _jsx("h1", { className: "theme-title text-2xl text-foreground", children: "Settings" }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Configure your watchlist and runtime integrations" })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-6 space-y-8 max-w-2xl", children: [_jsxs("section", { children: [_jsx("h2", { className: "theme-kicker mb-3", children: "API Configuration" }), _jsxs("div", { className: "theme-panel rounded-2xl divide-y divide-border", children: [_jsxs("div", { className: "flex items-center justify-between p-4", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium", children: "Gemini API Key" }), _jsx("div", { className: "text-xs text-muted-foreground", children: "Required for AI analysis, ELI5, and predictive reasoning" })] }), _jsx("div", { className: cn("text-xs px-2 py-1 rounded-full font-medium", h?.aiConfigured
                                                            ? "bg-emerald-500/10 text-emerald-400"
                                                            : "bg-amber-500/10 text-amber-400"), children: h?.aiConfigured ? "Configured" : "Not Set" })] }), !h?.aiConfigured && (_jsxs("div", { className: "p-4 text-xs text-muted-foreground space-y-2", children: [_jsx("p", { children: "To enable AI features, set the environment variable:" }), _jsx("code", { className: "block bg-muted px-3 py-2 rounded font-mono text-foreground", children: "Cloudflare Workers AI binding enabled" }), _jsx("p", { className: "mt-2", children: "This Cloudflare deployment uses Workers AI instead of a Google Gemini key." })] })), _jsxs("div", { className: "flex items-center justify-between p-4", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium", children: "Market Data" }), _jsx("div", { className: "text-xs text-muted-foreground", children: "Yahoo Finance (public API \u2014 no key needed)" })] }), _jsx("div", { className: "text-xs px-2 py-1 rounded-full font-medium bg-emerald-500/10 text-emerald-400", children: "Active" })] }), _jsxs("div", { className: "flex items-center justify-between p-4", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium", children: "Cloudflare Services" }), _jsx("div", { className: "text-xs text-muted-foreground", children: "Optional Workers AI and D1 integration" })] }), _jsx("div", { className: cn("text-xs px-2 py-1 rounded-full font-medium", h?.cloudflareConfigured
                                                            ? "bg-emerald-500/10 text-emerald-400"
                                                            : "bg-amber-500/10 text-amber-400"), children: h?.cloudflareConfigured ? "Configured" : "Optional" })] })] })] }), _jsxs("section", { children: [_jsx("h2", { className: "theme-kicker mb-3", children: "Watchlist" }), _jsxs("div", { className: "flex gap-2 mb-4", children: [_jsx(Input, { "data-testid": "input-ticker", placeholder: "Ticker (e.g. MSFT)", value: newTicker, onChange: (e) => setNewTicker(e.target.value.toUpperCase()), className: "w-28" }), _jsx(Input, { "data-testid": "input-name", placeholder: "Company name", value: newName, onChange: (e) => setNewName(e.target.value), className: "flex-1" }), _jsxs(Select, { value: newType, onValueChange: setNewType, children: [_jsx(SelectTrigger, { className: "w-28", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "stock", children: "Stock" }), _jsx(SelectItem, { value: "etf", children: "ETF" }), _jsx(SelectItem, { value: "crypto", children: "Crypto" }), _jsx(SelectItem, { value: "index", children: "Index" })] })] }), _jsx(Button, { "data-testid": "button-add-watchlist", size: "sm", onClick: () => addMutation.mutate(), disabled: !newTicker || !newName || addMutation.isPending, children: _jsx(Plus, { size: 14 }) })] }), _jsx("div", { className: "theme-panel rounded-2xl divide-y divide-border", children: watchlist.map((item) => (_jsxs("div", { className: "flex items-center justify-between p-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-sm font-mono font-bold text-foreground", children: item.ticker }), _jsx("span", { className: "text-sm text-muted-foreground", children: item.name }), _jsx("span", { className: "text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded capitalize", children: item.type })] }), _jsx("button", { "data-testid": `button-remove-${item.ticker}`, onClick: () => removeMutation.mutate(item.ticker), className: "text-muted-foreground hover:text-rose-400 transition-colors", children: _jsx(Trash2, { size: 14 }) })] }, item.id))) })] })] })] })] }));
}
