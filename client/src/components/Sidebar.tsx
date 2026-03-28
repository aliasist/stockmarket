import { Link, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import {
  LayoutDashboard, Newspaper, TrendingUp, Settings,
  Activity, Zap, Brain
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface ScrubRun {
  id: number;
  status: string;
  runAt: string;
  vectorsFound: number;
}

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/news", label: "News Feed", icon: Newspaper },
  { href: "/vectors", label: "Market Vectors", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ eli5Mode, onToggleEli5 }: {
  eli5Mode: boolean;
  onToggleEli5: () => void;
}) {
  const [loc] = useHashLocation();

  const { data: latestRun } = useQuery<ScrubRun>({
    queryKey: ["/api/scrub/latest"],
    refetchInterval: 30000,
  });

  const isRunning = latestRun?.status === "running";

  return (
    <aside className="bg-card border-r border-border flex flex-col h-full overflow-y-auto overscroll-contain">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-label="Market Pulse logo">
            <rect width="32" height="32" rx="8" fill="hsl(191 97% 45% / 0.15)" />
            {/* Pulse line */}
            <polyline
              points="4,16 8,16 10,10 12,22 15,8 18,24 20,14 22,14 28,14"
              stroke="hsl(191 97% 45%)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          <div>
            <div className="text-sm font-bold text-foreground leading-tight">Market Pulse</div>
            <div className="text-xs text-muted-foreground leading-tight">&amp; Pedagogy</div>
          </div>
        </div>
      </div>

      {/* Scrub Status */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Data Engine</span>
          <div className="flex items-center gap-1">
            <span className={cn(
              "w-1.5 h-1.5 rounded-full",
              isRunning ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
            )} />
            <span className={cn(
              "font-medium",
              isRunning ? "text-amber-400" : "text-emerald-400"
            )}>
              {isRunning ? "Scanning..." : "Active"}
            </span>
          </div>
        </div>
        {latestRun && (
          <div className="text-xs text-muted-foreground mt-0.5">
            {latestRun.vectorsFound} vectors · {timeAgo(latestRun.runAt)}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = loc === item.href || (item.href !== "/" && loc.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <a className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}>
                <Icon size={16} />
                {item.label}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* ELI5 Toggle */}
      <div className="p-3 border-t border-border">
        <button
          onClick={onToggleEli5}
          data-testid="button-eli5-toggle"
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all",
            eli5Mode
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
              : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <Brain size={16} />
          <span className="flex-1 text-left">Learning Mode</span>
          {eli5Mode && (
            <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-300">ELI5</Badge>
          )}
        </button>
        {eli5Mode && (
          <p className="text-xs text-muted-foreground mt-1.5 px-1">
            Financial terms explained with toys & candy
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-1 mb-0.5">
            <Zap size={10} className="text-primary" />
            Refreshes every 15 min
          </div>
          <div className="text-xs opacity-60">Aliasist.com · dev@aliasist.com</div>
        </div>
      </div>
    </aside>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
