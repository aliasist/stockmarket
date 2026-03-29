import { Suspense, lazy, useEffect, useState } from "react";
import { Switch, Route, Router, Redirect } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "./pages/not-found";
import { ThemeProvider } from "./components/theme-provider";
import { isAuthenticated, refreshAccessToken, isTokenExpired, getUser } from "./lib/auth";
import type { AuthUser } from "./lib/auth";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const NewsPage = lazy(() => import("./pages/NewsPage"));
const VectorsPage = lazy(() => import("./pages/VectorsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));

const LOADING_FALLBACK = (
  <div className="min-h-screen flex items-center justify-center bg-background text-sm text-muted-foreground">
    Loading market console...
  </div>
);

/** Wraps a route so it redirects to /login when the user is not authenticated. */
function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  if (!isAuthenticated()) {
    return <Redirect to="/login" />;
  }
  return <Component />;
}

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    async function initAuth() {
      if (isTokenExpired()) {
        // Try to silently refresh before giving up
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          setAuthChecked(true);
          return;
        }
      }
      const currentUser = await getUser();
      setUser(currentUser);
      setAuthChecked(true);
    }
    initAuth();
  }, []);

  if (!authChecked) {
    return LOADING_FALLBACK;
  }

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <Router hook={useHashLocation}>
          <Suspense fallback={LOADING_FALLBACK}>
            <Switch>
              {/* Public auth routes */}
              <Route path="/login" component={Login} />
              <Route path="/register" component={Register} />

              {/* Protected app routes */}
              <Route path="/">
                {() => <ProtectedRoute component={Dashboard} />}
              </Route>
              <Route path="/news">
                {() => <ProtectedRoute component={NewsPage} />}
              </Route>
              <Route path="/vectors">
                {() => <ProtectedRoute component={VectorsPage} />}
              </Route>
              <Route path="/settings">
                {() => <ProtectedRoute component={SettingsPage} />}
              </Route>

              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
