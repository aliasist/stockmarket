import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "wouter";
export default function NotFound() {
    return (_jsxs("div", { className: "min-h-screen flex items-center justify-center flex-col gap-4", children: [_jsx("div", { className: "text-6xl font-bold text-muted-foreground font-mono", children: "404" }), _jsx("p", { className: "text-muted-foreground", children: "Page not found" }), _jsx(Link, { href: "/", children: _jsx("a", { className: "text-primary hover:underline text-sm", children: "\u2190 Back to Dashboard" }) })] }));
}
