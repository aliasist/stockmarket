import { useState } from "react";
import { Link } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import {
  LayoutDashboard, Newspaper, TrendingUp, Settings,
  Zap, Brain, Moon, SunMedium, MessageSquare, Globe2, FileText, Menu, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/ui/logo";
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
  { href: "/research", label: "AI Research", icon: MessageSquare },
  { href: "/top50", label: "Top 50 Companies", icon: Globe2 },
  { href: "/pitch", label: "Pitch Builder", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ eli5Mode, onToggleEli5 }: { eli5Mode: boolean; onToggleEli5: () => void }) {
  const [loc] = useHashLocation();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: latestRun } = useQuery<ScrubRun>({
    queryKey: ["/api/scrub/latest"],
    refetchInterval: 30000,
  });
  const isRunning = latestRun?.status === "running";

  function SidebarInner({ onNav }: { onNav?: () => void }) {
    return (
      <>
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="theme-logo-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <Logo className="h-6 w-6 object-contain opacity-95" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="theme-kicker">Aliasist Signal Deck</div>
              <div className="text-sm font-semibold text-foreground leading-tight">Aliasist Pulse</div>
              <div className="text-xs text-muted-foreground leading-tight">Finance, rewritten with atmosphere</div>
            </div>
            {onNav && (
              <button onClick={onNav} className="text-muted-foreground hover:text-foreground p-1 shrink-0">
                <X size={18} />
              </button>
            )}
          </div>
        </div>
        <div className="px-3 py-3 border-b border-sidebar-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Data Engine</span>
            <div className="flex items-center gap-1">
              <span className={cn("w-1.5 h-1.5 rounded-full", isRunning ? "bg-amber-400 animate-pulse" : "bg-emerald-400")} />
              <span className={cn("font-medium", isRunning ? "text-amber-400" : "text-emerald-400")}>
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
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = loc === item.href || (item.href !== "/" && loc.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <a
                  onClick={onNav}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer border border-transparent",
                    active
                      ? "bg-primary/15 text-primary font-semibold border border-primary/35 shadow-[0_0_12px_rgba(10,203,155,0.08)]"
                      : "text-muted-foreground/80 hover:text-foreground hover:bg-white/5 hover:border-white/10"
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
            <Badge variant="outline" className="text-xs border-border/80 text-foreground">Switch</Badge>
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
            {eli5Mode && <Badge variant="outline" className="text-xs border-primary/40 text-primary">ELI5</Badge>}
          </button>
        </div>
        <div className="p-3 border-t border-border">
          <div className="text-xs text-muted-foreground">
            <div className="flex items-center gap-1 mb-0.5">
              <Zap size={10} className="text-primary" />
              // sync every 15 min
            </div>
            <div className="text-xs opacity-60">// {theme} mode · aliasist.com</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Desktop sidebar — hidden below md */}
      <aside className="hidden md:flex theme-panel bg-sidebar/90 border-r border-sidebar-border flex-col h-full overflow-y-auto overscroll-contain rounded-none">
        <SidebarInner />
      </aside>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-xl bg-sidebar/95 border border-sidebar-border text-muted-foreground hover:text-foreground shadow-lg backdrop-blur-sm"
      >
        <Menu size={18} />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-10 w-72 h-full theme-panel bg-sidebar flex flex-col overflow-y-auto overscroll-contain">
            <SidebarInner onNav={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
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
