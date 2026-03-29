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
          {/* Aliasist UFO Logo */}
          <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary/15 border border-primary/30 flex-shrink-0">
            <svg viewBox="0 0 100 47" width="26" height="16" fill="currentColor" className="text-primary" aria-label="Aliasist UFO">
              <path d="M99.922,17.594C98.75,11.344,84.634,8.459,65.7,9.774c-2.592-4.324-7.961-7.146-14.227-7.514c-1.188-1.717-3.762-2.632-6.5-2.119s-4.806,2.298-5.292,4.33c-5.707,2.613-9.689,7.188-10.539,12.157C11.019,22.262-1.094,30.063,0.078,36.314c1.202,6.408,16.011,9.277,35.668,7.711c1.925,1.294,4.643,2.171,7.826,2.531c-0.885-0.904-1.729-1.926-2.521-3.051c0.858-0.099,1.724-0.205,2.596-0.32c0.762,1.323,1.571,2.515,2.413,3.545c2.363,0.065,4.911-0.131,7.531-0.622c7.335-1.375,13.294-4.696,15.877-8.406C88.358,32.042,101.123,24.001,99.922,17.594zM50.539,29.831c-13.173,2.471-24.318,1.983-24.894-1.085c-0.223-1.187,1.173-2.587,3.724-3.999c0.11,0.652,0.354,1.271,0.899,1.856c1.538,0.324,3.147,0.509,4.787,0.589c-0.203-1.647-0.294-3.264-0.288-4.833c0.957-0.351,1.972-0.694,3.041-1.027c0.06,1.892,0.235,3.864,0.541,5.883c3.97-0.114,7.965-0.711,11.446-1.364c5.907-1.107,13.24-2.461,18.553-5.939c0.339-0.851,0.283-1.669,0.069-2.49c2.897,0.392,4.711,1.191,4.934,2.38C73.925,22.87,63.713,27.361,50.539,29.831z"/>
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold text-foreground leading-tight">Market Pulse</div>
            <div className="text-xs text-primary/70 leading-tight">by Aliasist.com</div>
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
            Financial terms explained. 
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-1 mb-0.5">
            <Zap size={10} className="text-primary" />
            Scanning every 15 min 👽
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
