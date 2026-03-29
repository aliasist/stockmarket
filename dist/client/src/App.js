import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "./pages/Dashboard";
import NewsPage from "./pages/NewsPage";
import VectorsPage from "./pages/VectorsPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/not-found";
import { ThemeProvider } from "./components/theme-provider";
export default function App() {
    return (_jsx(ThemeProvider, { children: _jsxs(QueryClientProvider, { client: queryClient, children: [_jsx(Router, { hook: useHashLocation, children: _jsxs(Switch, { children: [_jsx(Route, { path: "/", component: Dashboard }), _jsx(Route, { path: "/news", component: NewsPage }), _jsx(Route, { path: "/vectors", component: VectorsPage }), _jsx(Route, { path: "/settings", component: SettingsPage }), _jsx(Route, { component: NotFound })] }) }), _jsx(Toaster, {})] }) }));
}
