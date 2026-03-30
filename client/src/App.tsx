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
const ResearchPage = lazy(() => import("./pages/ResearchPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const Top50Page = lazy(() => import("./pages/Top50Page"));

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <Router hook={useHashLocation}>
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center bg-background text-sm text-muted-foreground">
                Loading market console...
              </div>
            }
          >
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/news" component={NewsPage} />
              <Route path="/vectors" component={VectorsPage} />
              <Route path="/research" component={ResearchPage} />
              <Route path="/settings" component={SettingsPage} />
              <Route path="/top50" component={Top50Page} />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
