import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// ─── Types ───────────────────────────────────────────────────────────────────

interface WorkerHealth {
  name: string
  url: string
  healthUrl: string
  ddService: string
  cfWorkerName: string
}

interface HealthResult {
  worker: string
  status: "ok" | "error" | "loading"
  latency: number
  data: Record<string, unknown> | null
  error?: string
}

interface GitCommit {
  sha: string
  message: string
  date: string
  url: string
}

// ─── Config ──────────────────────────────────────────────────────────────────

const WORKERS: WorkerHealth[] = [
  { name: "PulseSist",  url: "https://pulse.aliasist.com",       healthUrl: "https://pulse.aliasist.com/api/health",       ddService: "aliasist-pulse",    cfWorkerName: "stockmarket"      },
  { name: "LLM Chat",   url: "https://assistant.aliasist.com",   healthUrl: "https://assistant.aliasist.com/api/health",   ddService: "aliasist-llm",      cfWorkerName: "llm-chat"         },
  { name: "News",       url: "https://news.aliasist.com",        healthUrl: "https://news.aliasist.com/api/health",        ddService: "aliasist-news",     cfWorkerName: "aliasist-news"    },
  { name: "DataSist",   url: "https://data.aliasist.com",        healthUrl: "https://datasist-worker.bchooper0730.workers.dev/api/health", ddService: "aliasist-datasist", cfWorkerName: "datasist-worker" },
]

const REPOS = [
  { name: "stockmarket",     label: "PulseSist",  url: "https://github.com/aliasist/stockmarket"    },
  { name: "llm-chat",        label: "LLM Chat",   url: "https://github.com/aliasist/llm-chat"       },
  { name: "news-worker",     label: "News",       url: "https://github.com/aliasist/news-worker"    },
  { name: "datasist-worker", label: "DataSist",   url: "https://github.com/aliasist/datasist-worker"},
  { name: "aliasistabductor",label: "Main Site",  url: "https://github.com/aliasist/aliasistabductor"},
]

const DD_SITE = "https://us5.datadoghq.com"
const CF_ACCOUNT = "a05d503b4b184eeedd5c35f6789df7db"

const CF_LINKS = [
  { label: "Workers & Pages",  url: `https://dash.cloudflare.com/${CF_ACCOUNT}/workers-and-pages`                                           },
  { label: "D1 Databases",     url: `https://dash.cloudflare.com/${CF_ACCOUNT}/workers/d1`                                                  },
  { label: "Analytics Engine", url: `https://dash.cloudflare.com/${CF_ACCOUNT}/analytics/analytics-engine`                                  },
  { label: "KV Storage",       url: `https://dash.cloudflare.com/${CF_ACCOUNT}/workers/kv/namespaces`                                       },
  { label: "Worker Secrets",   url: `https://dash.cloudflare.com/${CF_ACCOUNT}/workers/services/view/stockmarket/production/settings/bindings`},
]

const DD_LINKS = [
  { label: "Metrics Explorer",  url: `${DD_SITE}/metric/explorer`                                    },
  { label: "Log Explorer",      url: `${DD_SITE}/logs`                                               },
  { label: "APM Services",      url: `${DD_SITE}/apm/services`                                      },
  { label: "Dashboards",        url: `${DD_SITE}/dashboard/lists`                                   },
  { label: "Monitors & Alerts", url: `${DD_SITE}/monitors/manage`                                   },
  { label: "API Keys",          url: `${DD_SITE}/organization-settings/api-keys`                    },
]

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [health, setHealth] = useState<HealthResult[]>(
    WORKERS.map((w) => ({ worker: w.name, status: "loading", latency: 0, data: null }))
  )
  const [commits, setCommits] = useState<Record<string, GitCommit[]>>({})
  const [refreshing, setRefreshing] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<string>("")

  // ── Health checks ──────────────────────────────────────────────────────────
  const checkHealth = useCallback(async () => {
    setHealth(WORKERS.map((w) => ({ worker: w.name, status: "loading", latency: 0, data: null })))
    const results = await Promise.all(
      WORKERS.map(async (w): Promise<HealthResult> => {
        const start = Date.now()
        try {
          const res = await fetch(w.healthUrl, { signal: AbortSignal.timeout(8000) })
          const latency = Date.now() - start
          const data = res.ok ? await res.json() : null
          return { worker: w.name, status: res.ok ? "ok" : "error", latency, data }
        } catch (e) {
          return { worker: w.name, status: "error", latency: Date.now() - start, data: null, error: String(e) }
        }
      })
    )
    setHealth(results)
    setLastChecked(new Date().toLocaleTimeString())
  }, [])

  // ── GitHub recent commits ──────────────────────────────────────────────────
  const fetchCommits = useCallback(async () => {
    const results = await Promise.all(
      REPOS.map(async (repo) => {
        try {
          const res = await fetch(`https://api.github.com/repos/aliasist/${repo.name}/commits?per_page=3`, {
            headers: { Accept: "application/vnd.github.v3+json" },
          })
          if (!res.ok) return { name: repo.name, commits: [] }
          const data = await res.json() as Array<{ sha: string; commit: { message: string; author: { date: string } }; html_url: string }>
          return {
            name: repo.name,
            commits: data.map((c) => ({
              sha: c.sha.slice(0, 7),
              message: c.commit.message.split("\n")[0].slice(0, 72),
              date: new Date(c.commit.author.date).toLocaleDateString(),
              url: c.html_url,
            })),
          }
        } catch {
          return { name: repo.name, commits: [] }
        }
      })
    )
    const map: Record<string, GitCommit[]> = {}
    results.forEach((r) => { map[r.name] = r.commits })
    setCommits(map)
  }, [])

  useEffect(() => {
    checkHealth()
    fetchCommits()
  }, [checkHealth, fetchCommits])

  // ── News refresh trigger ───────────────────────────────────────────────────
  const triggerRefresh = async (worker: string, endpoint: string) => {
    setRefreshing(worker)
    try {
      await fetch(endpoint, { method: "GET" })
    } catch { /* ignore */ }
    setTimeout(() => setRefreshing(null), 2000)
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-mono tracking-tight">Admin Control Panel</h1>
          <p className="text-sm text-muted-foreground mt-1">Aliasist Suite — Workers, Repos, Monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          {lastChecked && <span className="text-xs text-muted-foreground">Last checked: {lastChecked}</span>}
          <Button size="sm" variant="outline" onClick={() => { checkHealth(); fetchCommits() }} className="font-mono text-xs">
            Refresh All
          </Button>
        </div>
      </div>

      {/* Worker Health Grid */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">Worker Health</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {WORKERS.map((w) => {
            const h = health.find((x) => x.worker === w.name)
            const statusColor = !h || h.status === "loading" ? "bg-yellow-500" : h.status === "ok" ? "bg-emerald-500" : "bg-red-500"
            return (
              <Card key={w.name} className="border-border/50 bg-card/60 backdrop-blur">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-mono">{w.name}</CardTitle>
                    <span className={`w-2.5 h-2.5 rounded-full ${statusColor} shadow-sm`} />
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={h?.status === "ok" ? "default" : h?.status === "error" ? "destructive" : "secondary"} className="text-[10px] h-4">
                      {h?.status ?? "—"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Latency</span>
                    <span className="font-mono text-foreground">{h?.latency ? `${h.latency}ms` : "—"}</span>
                  </div>
                  {h?.data && Object.entries(h.data).slice(0, 3).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-mono text-foreground truncate max-w-[120px]">{String(v)}</span>
                    </div>
                  ))}
                  <div className="flex gap-1.5 pt-1 flex-wrap">
                    <a href={w.url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2">Visit</Button>
                    </a>
                    <a href={`https://dash.cloudflare.com/${CF_ACCOUNT}/workers/services/view/${w.cfWorkerName}/production`} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2">CF</Button>
                    </a>
                    <a href={`${DD_SITE}/metric/explorer?exp_metric=aliasist.api.request&exp_scope=service%3A${w.ddService}`} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2">DD</Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="font-mono text-xs"
            onClick={() => triggerRefresh("news", "https://news.aliasist.com/api/news/refresh")}
            disabled={refreshing === "news"}>
            {refreshing === "news" ? "Refreshing..." : "Force News Refresh"}
          </Button>
          <Button size="sm" variant="outline" className="font-mono text-xs"
            onClick={() => triggerRefresh("scrub", "https://pulse.aliasist.com/api/scrub/trigger")}
            disabled={refreshing === "scrub"}>
            {refreshing === "scrub" ? "Running..." : "Trigger Pulse Scrub"}
          </Button>
          <a href={`${DD_SITE}/dashboard/lists`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="font-mono text-xs">Open DD Dashboard</Button>
          </a>
          <a href={`${DD_SITE}/logs`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="font-mono text-xs">View Logs</Button>
          </a>
          <a href={`${DD_SITE}/monitors/manage`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="font-mono text-xs">Manage Alerts</Button>
          </a>
        </div>
      </section>

      {/* Two-column: CF links + DD links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cloudflare */}
        <Card className="border-border/50 bg-card/60">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              Cloudflare Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1">
            {CF_LINKS.map((l) => (
              <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/40 transition-colors group">
                <span className="text-xs text-foreground group-hover:text-primary transition-colors">{l.label}</span>
                <span className="text-[10px] text-muted-foreground">↗</span>
              </a>
            ))}
          </CardContent>
        </Card>

        {/* Datadog */}
        <Card className="border-border/50 bg-card/60">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              Datadog (us5)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1">
            {DD_LINKS.map((l) => (
              <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/40 transition-colors group">
                <span className="text-xs text-foreground group-hover:text-primary transition-colors">{l.label}</span>
                <span className="text-[10px] text-muted-foreground">↗</span>
              </a>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* GitHub Repo Activity */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">Recent Commits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {REPOS.map((repo) => (
            <Card key={repo.name} className="border-border/50 bg-card/60">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-mono">{repo.label}</CardTitle>
                  <a href={repo.url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="ghost" className="h-5 text-[10px] px-1.5">GitHub ↗</Button>
                  </a>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {commits[repo.name]?.length ? commits[repo.name].map((c) => (
                  <a key={c.sha} href={c.url} target="_blank" rel="noopener noreferrer"
                    className="block hover:bg-muted/30 rounded p-1.5 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-primary shrink-0">{c.sha}</span>
                      <span className="text-xs text-foreground truncate">{c.message}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground ml-7">{c.date}</span>
                  </a>
                )) : (
                  <p className="text-xs text-muted-foreground italic">Loading commits...</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Environment & Secrets Checklist */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">Secrets Checklist</h2>
        <Card className="border-border/50 bg-card/60">
          <CardContent className="px-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
              {[
                { worker: "stockmarket",     key: "GROQ_API_KEY"     },
                { worker: "stockmarket",     key: "GEMINI_API_KEY"   },
                { worker: "stockmarket",     key: "FMP_API_KEY"      },
                { worker: "stockmarket",     key: "DD_API_KEY"       },
                { worker: "llm-chat",        key: "ANTHROPIC_API_KEY"},
                { worker: "llm-chat",        key: "GROQ_API_KEY"     },
                { worker: "llm-chat",        key: "DD_API_KEY"       },
                { worker: "aliasist-news",   key: "GROQ_API_KEY"     },
                { worker: "aliasist-news",   key: "DD_API_KEY"       },
                { worker: "datasist-worker", key: "EIA_API_KEY"      },
                { worker: "datasist-worker", key: "NEON_DATABASE_URL"},
                { worker: "datasist-worker", key: "DD_API_KEY"       },
              ].map(({ worker, key }) => (
                <div key={`${worker}-${key}`} className="flex items-center gap-2 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
                  <span className="font-mono text-[10px] text-muted-foreground">{worker}</span>
                  <span className="font-mono text-xs text-foreground">{key}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">
              Manage all secrets at{" "}
              <a href={`https://dash.cloudflare.com/${CF_ACCOUNT}/workers-and-pages`} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                Cloudflare Workers Settings
              </a>
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
