import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Suspense, lazy } from "react";
import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "./pages/not-found";
import { ThemeProvider } from "./components/theme-provider";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NewsPage = lazy(() => import("./pages/NewsPage"));
const VectorsPage = lazy(() => import("./pages/VectorsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
export default function App() {
    return (_jsx(ThemeProvider, { children: _jsxs(QueryClientProvider, { client: queryClient, children: [_jsx(Router, { hook: useHashLocation, children: _jsx(Suspense, { fallback: _jsx("div", { className: "min-h-screen flex items-center justify-center bg-background text-sm text-muted-foreground", children: "Loading market console..." }), children: _jsxs(Switch, { children: [_jsx(Route, { path: "/", component: Dashboard }), _jsx(Route, { path: "/news", component: NewsPage }), _jsx(Route, { path: "/vectors", component: VectorsPage }), _jsx(Route, { path: "/settings", component: SettingsPage }), _jsx(Route, { component: NotFound })] }) }) }), _jsx(Toaster, {})] }) }));
}
