import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BookOpen, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
export default function Eli5Tooltip({ term }) {
    const [open, setOpen] = useState(false);
    const { data, isLoading } = useQuery({
        queryKey: ["/api/eli5", term],
        queryFn: async () => {
            const res = await fetch(`./api/eli5/${encodeURIComponent(term)}`);
            return res.json();
        },
        enabled: open,
        staleTime: Infinity, // cached forever
    });
    return (_jsxs(Popover, { open: open, onOpenChange: setOpen, children: [_jsx(PopoverTrigger, { asChild: true, children: _jsxs("button", { "data-testid": `button-eli5-${term.replace(/\s+/g, "-").toLowerCase()}`, className: "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-colors border border-purple-500/20", children: [_jsx(BookOpen, { size: 10 }), term] }) }), _jsx(PopoverContent, { className: "w-64 bg-card border-purple-500/30 p-3", side: "top", children: _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "text-xs font-bold text-purple-300 flex items-center gap-1", children: [_jsx("span", { children: "\uD83C\uDF93" }), " ", term] }), isLoading ? (_jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [_jsx(Loader2, { size: 12, className: "animate-spin" }), "Asking the teacher..."] })) : data ? (_jsx("p", { className: "text-xs text-foreground leading-relaxed", children: data.explanation })) : null] }) })] }));
}
