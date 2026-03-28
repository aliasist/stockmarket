import { useState } from "react";
import Sidebar from "../components/Sidebar";
import TickerTape from "../components/TickerTape";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface Watchlist {
  id: number;
  ticker: string;
  name: string;
  type: string;
}

export default function SettingsPage() {
  const [eli5Mode, setEli5Mode] = useState(false);
  const [newTicker, setNewTicker] = useState("");
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("stock");
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: watchlist = [] } = useQuery<Watchlist[]>({ queryKey: ["/api/watchlist"] });
  const { data: health } = useQuery({ queryKey: ["/api/health"] });
  const h = health as any;

  const addMutation = useMutation({
    mutationFn: () => apiRequest("POST", "./api/watchlist", { ticker: newTicker, name: newName, type: newType }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/watchlist"] });
      setNewTicker(""); setNewName("");
      toast({ title: "Added to watchlist" });
    },
    onError: () => toast({ title: "Failed to add", variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: (ticker: string) => apiRequest("DELETE", `./api/watchlist/${ticker}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/watchlist"] });
      toast({ title: "Removed from watchlist" });
    },
  });

  return (
    <div className="dashboard-grid">
      <Sidebar eli5Mode={eli5Mode} onToggleEli5={() => setEli5Mode(!eli5Mode)} />
      <div className="main-content flex flex-col">
        <TickerTape />
        <div className="px-6 py-4 border-b border-border">
          <h1 className="text-lg font-bold text-foreground">Settings</h1>
          <p className="text-xs text-muted-foreground">Configure your watchlist and API keys</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-2xl">
          {/* API Status */}
          <section>
            <h2 className="text-sm font-semibold mb-3">API Configuration</h2>
            <div className="bg-card border border-border rounded-lg divide-y divide-border">
              <div className="flex items-center justify-between p-4">
                <div>
                  <div className="text-sm font-medium">Gemini API Key</div>
                  <div className="text-xs text-muted-foreground">Required for AI analysis, ELI5, and predictive reasoning</div>
                </div>
                <div className={cn(
                  "text-xs px-2 py-1 rounded-full font-medium",
                  h?.geminiConfigured
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-amber-500/10 text-amber-400"
                )}>
                  {h?.geminiConfigured ? "Configured" : "Not Set"}
                </div>
              </div>
              {!h?.geminiConfigured && (
                <div className="p-4 text-xs text-muted-foreground space-y-2">
                  <p>To enable AI features, set the environment variable:</p>
                  <code className="block bg-muted px-3 py-2 rounded font-mono text-foreground">
                    GEMINI_API_KEY=your_key_here
                  </code>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Get a free Gemini API key <ExternalLink size={10} />
                  </a>
                  <p className="mt-2">For Vercel deployment: Add it in your project's Environment Variables.</p>
                </div>
              )}

              <div className="flex items-center justify-between p-4">
                <div>
                  <div className="text-sm font-medium">Market Data</div>
                  <div className="text-xs text-muted-foreground">Yahoo Finance (public API — no key needed)</div>
                </div>
                <div className="text-xs px-2 py-1 rounded-full font-medium bg-emerald-500/10 text-emerald-400">
                  Active
                </div>
              </div>
            </div>
          </section>

          {/* Watchlist */}
          <section>
            <h2 className="text-sm font-semibold mb-3">Watchlist</h2>

            {/* Add */}
            <div className="flex gap-2 mb-4">
              <Input
                data-testid="input-ticker"
                placeholder="Ticker (e.g. MSFT)"
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                className="w-28"
              />
              <Input
                data-testid="input-name"
                placeholder="Company name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1"
              />
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="etf">ETF</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="index">Index</SelectItem>
                </SelectContent>
              </Select>
              <Button
                data-testid="button-add-watchlist"
                size="sm"
                onClick={() => addMutation.mutate()}
                disabled={!newTicker || !newName || addMutation.isPending}
              >
                <Plus size={14} />
              </Button>
            </div>

            {/* List */}
            <div className="bg-card border border-border rounded-lg divide-y divide-border">
              {watchlist.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-bold text-foreground">{item.ticker}</span>
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                    <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded capitalize">
                      {item.type}
                    </span>
                  </div>
                  <button
                    data-testid={`button-remove-${item.ticker}`}
                    onClick={() => removeMutation.mutate(item.ticker)}
                    className="text-muted-foreground hover:text-rose-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Supabase / Vercel notes */}
          <section>
            <h2 className="text-sm font-semibold mb-3">Deployment</h2>
            <div className="bg-card border border-border rounded-lg p-4 space-y-3 text-xs text-muted-foreground">
              <div>
                <span className="text-foreground font-medium">Vercel Deployment</span><br />
                Connect your GitHub repo at{" "}
                <a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  vercel.com/new
                </a>
                , then add <code className="bg-muted px-1 rounded text-foreground">GEMINI_API_KEY</code> in Environment Variables.
              </div>
              <div>
                <span className="text-foreground font-medium">Supabase (optional upgrade)</span><br />
                To replace SQLite with Supabase Postgres for cloud-persistent memory, set{" "}
                <code className="bg-muted px-1 rounded text-foreground">DATABASE_URL</code> to your Supabase connection string.
                Free tier at{" "}
                <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  supabase.com
                </a>.
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
