import { Link } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import {
  LayoutDashboard, Newspaper, TrendingUp, Settings,
  Activity, Zap, Brain, Moon, SunMedium
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "./theme-provider";

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
  const { theme, toggleTheme } = useTheme();

  const { data: latestRun } = useQuery<ScrubRun>({
    queryKey: ["/api/scrub/latest"],
    refetchInterval: 30000,
  });

  const isRunning = latestRun?.status === "running";

  return (
    <aside className="theme-panel bg-sidebar/90 border-r border-sidebar-border flex flex-col h-full overflow-y-auto overscroll-contain rounded-none">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex flex-col items-start">
          <div className="text-lg font-bold text-foreground leading-tight">Aliasist Pulse</div>
          <div className="text-xs text-muted-foreground leading-tight mt-1">Private Market Dashboard</div>
        </div>
      </div>

      <div className="px-3 py-3 border-b border-sidebar-border">
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

      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = loc === item.href || (item.href !== "/" && loc.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <a className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer border border-transparent",
                active
                  ? "bg-primary/12 text-primary font-medium border-primary/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/60 hover:border-border/70"
              )}>
                <Icon size={16} />
                {item.label}
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border space-y-2">
        <button
          onClick={toggleTheme}
          data-testid="button-theme-toggle"
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all border bg-muted/50 text-muted-foreground border-border hover:text-foreground hover:bg-accent/70"
        >
          {theme === "dark" ? <Moon size={16} /> : <SunMedium size={16} />}
          <span className="flex-1 text-left">{theme === "dark" ? "Dark Mode" : "Normal Mode"}</span>
          <Badge variant="outline" className="text-xs border-border/80 text-foreground">
            Switch
          </Badge>
        </button>
        <button
          onClick={onToggleEli5}
          data-testid="button-eli5-toggle"
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all border",
            eli5Mode
              ? "bg-primary/12 text-primary border-primary/30"
              : "bg-muted/50 text-muted-foreground border-border hover:text-foreground hover:bg-accent/70"
          )}
        >
          <Brain size={16} />
          <span className="flex-1 text-left">Learning Mode</span>
          {eli5Mode && (
            <Badge variant="outline" className="text-xs border-primary/40 text-primary">ELI5</Badge>
          )}
        </button>
        {eli5Mode && (
          <p className="text-xs text-muted-foreground mt-1.5 px-1">
            Financial terms explained with toys & candy
          </p>
        )}
      </div>

      <div className="p-3 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-1 mb-0.5">
            <Zap size={10} className="text-primary" />
            Refreshes every 15 min
          </div>
          <div className="text-xs opacity-60">Theme: {theme} · Aliasist.com</div>
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
