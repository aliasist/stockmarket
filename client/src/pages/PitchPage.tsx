import { useState, useEffect, useRef } from "react";
import { Search, Loader2, FileText, Clock, ChevronRight, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Sidebar from "../components/Sidebar";
import PitchMemo, { type PitchData, type AiSections } from "../components/PitchMemo";

// ── Constants ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = "pitch_history";
const MAX_HISTORY = 10;

const LOADING_STEPS = [
  "Fetching market data...",
  "Loading fundamentals...",
  "Running AI analysis...",
  "Formatting memo...",
] as const;

// ── Helpers ────────────────────────────────────────────────────────────────────
function loadHistory(): PitchData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PitchData[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: PitchData[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  } catch {
    // quota exceeded — silently ignore
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function truncate(str: string, len: number): string {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "…" : str;
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-8 text-center gap-6 py-20">
      <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
        <FileText size={36} className="text-primary/60" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Generate Your First Pitch</h2>
        <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
          Enter a stock ticker on the left to generate a professional investment memo
          powered by real market data and Groq AI analysis.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg text-xs text-muted-foreground">
        {["Real FMP market data", "Groq AI narrative", "Print-ready export"].map((feat) => (
          <div key={feat} className="bg-muted/30 border border-border/50 rounded-lg px-3 py-2.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            {feat}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────────────────
interface LoadingSkeletonProps {
  step: number;
}

function LoadingSkeleton({ step }: LoadingSkeletonProps) {
  return (
    <div className="flex-1 p-6 space-y-5 animate-pulse">
      {/* Header skeleton */}
      <div className="theme-panel rounded-2xl p-6 border-l-4 border-l-primary">
        <div className="h-3 w-24 bg-muted rounded mb-3" />
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-48 bg-muted rounded-lg" />
          <div className="h-6 w-16 bg-primary/20 rounded-lg" />
        </div>
        <div className="h-4 w-32 bg-muted rounded" />
      </div>

      {/* Progress steps */}
      <div className="theme-panel rounded-xl p-5">
        <div className="theme-kicker mb-4">Generating Memo</div>
        <div className="space-y-3">
          {LOADING_STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                i < step ? "bg-primary" : i === step ? "bg-primary/40" : "bg-muted"
              )}>
                {i < step ? (
                  <span className="text-[8px] text-primary-foreground font-bold">✓</span>
                ) : i === step ? (
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse block" />
                ) : null}
              </div>
              <span className={cn(
                "text-sm transition-colors",
                i < step ? "text-primary" : i === step ? "text-foreground font-medium" : "text-muted-foreground"
              )}>
                {label}
              </span>
              {i === step && (
                <Loader2 size={14} className="text-primary animate-spin ml-auto" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Card skeletons */}
      {[1, 2, 3].map((n) => (
        <div key={n} className="theme-panel rounded-xl p-5 border-l-4 border-l-muted space-y-3">
          <div className="h-3 w-32 bg-muted rounded" />
          <div className="space-y-2">
            <div className="h-3 w-full bg-muted rounded" />
            <div className="h-3 w-5/6 bg-muted rounded" />
            <div className="h-3 w-4/6 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function PitchPage() {
  const [eli5Mode, setEli5Mode] = useState(false);
  const [ticker, setTicker] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [currentPitch, setCurrentPitch] = useState<PitchData | null>(null);
  const [history, setHistory] = useState<PitchData[]>(loadHistory);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fade in when pitch appears
  useEffect(() => {
    if (currentPitch) {
      setVisible(false);
      requestAnimationFrame(() => {
        setTimeout(() => setVisible(true), 30);
      });
    }
  }, [currentPitch]);

  // ── Step-advance timer ───────────────────────────────────────────────────────
  const advanceStep = (startStep: number, maxStep: number): Promise<void> => {
    return new Promise((resolve) => {
      let step = startStep;
      setLoadStep(step);
      const iv = setInterval(() => {
        step += 1;
        setLoadStep(step);
        if (step >= maxStep) {
          clearInterval(iv);
          resolve();
        }
      }, 800);
    });
  };

  // ── Generate pitch ───────────────────────────────────────────────────────────
  const generatePitch = async () => {
    const symbol = ticker.trim().toUpperCase();
    if (!symbol) {
      inputRef.current?.focus();
      return;
    }

    setIsGenerating(true);
    setError(null);
    setCurrentPitch(null);
    setLoadStep(0);

    let price: number | undefined;
    let profileData: Record<string, unknown> = {};
    let metricsData: Record<string, unknown>[] = [];
    let ratingsData: Record<string, unknown> = {};
    let peersData: string[] = [];
    let earningsData: Record<string, unknown>[] = [];
    let incomeData: Record<string, unknown>[] = [];

    try {
      // Step 1: fetch price from chart endpoint
      setLoadStep(0);
      try {
        const chartRes = await fetch(`./api/chart/${symbol}?range=1d&interval=1d`);
        if (chartRes.ok) {
          const chartJson = await chartRes.json() as Record<string, unknown>[];
          if (Array.isArray(chartJson) && chartJson.length > 0) {
            const last = chartJson[chartJson.length - 1] as Record<string, unknown>;
            price = Number(last.close ?? last.c ?? last.price);
            if (isNaN(price)) price = undefined;
          }
        }
      } catch {
        // non-fatal — price stays undefined
      }

      // Step 2: fetch FMP pitch data (profile, metrics, ratings, peers, earnings, income)
      setLoadStep(1);
      try {
        const pitchRes = await fetch(`./api/fmp/pitch/${symbol}`);
        if (pitchRes.ok) {
          const pitchJson = await pitchRes.json() as Record<string, unknown>;
          profileData = (pitchJson.profile as Record<string, unknown>) ?? {};
          metricsData = Array.isArray(pitchJson.metrics)
            ? (pitchJson.metrics as Record<string, unknown>[])
            : [];
          ratingsData = (pitchJson.ratings as Record<string, unknown>) ?? {};
          peersData = Array.isArray(pitchJson.peers)
            ? (pitchJson.peers as string[])
            : [];
          earningsData = Array.isArray(pitchJson.earnings)
            ? (pitchJson.earnings as Record<string, unknown>[])
            : [];
          incomeData = Array.isArray(pitchJson.income)
            ? (pitchJson.income as Record<string, unknown>[])
            : [];
        }
      } catch {
        // non-fatal — continue with AI only
      }

      const resolvedName = companyName.trim() ||
        String(profileData.companyName ?? profileData.name ?? symbol);
      const mktCap = profileData.mktCap
        ? (Number(profileData.mktCap) / 1e9).toFixed(1)
        : "N/A";
      const m0 = metricsData[0] ?? {};

      // Build income table for prompt
      const incomeTable = incomeData.slice(0, 4).map((r) => {
        const row = r as Record<string, unknown>;
        const rev = Number(row.revenue ?? row.totalRevenue ?? 0);
        const ni = Number(row.netIncome ?? row.netIncomeApplicableToCommonShares ?? 0);
        return `  ${String(row.date ?? "").slice(0, 7)}: Revenue $${(rev / 1e9).toFixed(2)}B, Net Income $${(ni / 1e9).toFixed(2)}B`;
      }).join("\n") || "  No historical income data available.";

      // Step 3: AI analysis
      setLoadStep(2);

      const SYSTEM_PROMPT =
        "You are a senior equity research analyst at a top-tier hedge fund. Generate a professional stock pitch memo with the following sections. Be specific with numbers. Use analyst-quality language. Format your response as a JSON object with no markdown fences.";

      const DATA_PROMPT = `Generate a professional equity pitch memo for ${symbol}.

Company: ${resolvedName}, Sector: ${String(profileData.sector ?? "N/A")}, Industry: ${String(profileData.industry ?? "N/A")}
Current Price: $${price?.toFixed(2) ?? "N/A"} | Market Cap: $${mktCap}B | 52W Range: ${String(profileData.range ?? "N/A")}

Recent Financials (from annual reports):
${incomeTable}

Key Metrics:
P/E: ${m0.peRatioTTM ?? m0.peRatio ?? "N/A"} | EV/EBITDA: ${m0.evToEBITDATTM ?? m0.evToEbitda ?? "N/A"} | ROE: ${m0.returnOnEquityTTM ?? m0.returnOnEquity ?? "N/A"} | Debt/Equity: ${m0.debtEquityRatioTTM ?? m0.debtToEquity ?? "N/A"}

Analyst Consensus: ${String((ratingsData as Record<string, unknown>).consensus ?? "N/A")} | Avg Price Target: $${(ratingsData as Record<string, unknown>).priceTarget ?? (ratingsData as Record<string, unknown>).targetMeanPrice ?? "N/A"}

Peers: ${peersData.slice(0, 8).join(", ") || "N/A"}

Return a JSON object with these exact keys:
{
  "executiveSummary": "2-3 sentences summarizing the investment case",
  "businessOverview": "3-4 sentences describing the business model and competitive position",
  "investmentThesis": "4-5 sentences - the bull case, what the market is missing",
  "bearCase": "2-3 sentences - key risks and why the thesis could be wrong",
  "catalysts": ["catalyst 1", "catalyst 2", "catalyst 3"],
  "valuation": "3-4 sentences on valuation - is it cheap or expensive vs peers and history",
  "priceTarget": "$XXX (XX% upside/downside)",
  "recommendation": "BUY"
}`;

      let aiSections: AiSections = {
        executiveSummary: "",
        businessOverview: "",
        investmentThesis: "",
        bearCase: "",
        catalysts: [],
        valuation: "",
        priceTarget: "N/A",
        recommendation: "HOLD",
      };

      try {
        const chatRes = await fetch("./api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: DATA_PROMPT },
            ],
          }),
        });

        if (chatRes.ok) {
          const chatJson = await chatRes.json() as Record<string, unknown>;
          // The server might return { content: "..." } or { message: "..." } or the object directly
          let rawText =
            typeof chatJson.content === "string" ? chatJson.content :
            typeof chatJson.message === "string" ? chatJson.message :
            typeof chatJson.response === "string" ? chatJson.response :
            JSON.stringify(chatJson);

          // Strip markdown fences if present
          rawText = rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

          // Find JSON object in response
          const firstBrace = rawText.indexOf("{");
          const lastBrace = rawText.lastIndexOf("}");
          if (firstBrace !== -1 && lastBrace !== -1) {
            rawText = rawText.slice(firstBrace, lastBrace + 1);
          }

          try {
            const parsed = JSON.parse(rawText) as Partial<AiSections>;
            aiSections = {
              executiveSummary: parsed.executiveSummary ?? "",
              businessOverview: parsed.businessOverview ?? "",
              investmentThesis: parsed.investmentThesis ?? "",
              bearCase: parsed.bearCase ?? "",
              catalysts: Array.isArray(parsed.catalysts) ? parsed.catalysts : [],
              valuation: parsed.valuation ?? "",
              priceTarget: parsed.priceTarget ?? "See analyst consensus",
              recommendation: (["BUY", "HOLD", "SELL"].includes(String(parsed.recommendation).toUpperCase())
                ? String(parsed.recommendation).toUpperCase()
                : "HOLD") as AiSections["recommendation"],
            };
          } catch {
            // AI returned malformed JSON — keep defaults
          }
        }
      } catch {
        // AI failed — pitch will show FMP data only with empty AI sections
      }

      // Step 4: Format
      setLoadStep(3);
      await new Promise((resolve) => setTimeout(resolve, 400));

      const newPitch: PitchData = {
        ticker: symbol,
        companyName: resolvedName,
        price,
        generatedAt: new Date().toISOString(),
        profile: profileData,
        metrics: metricsData,
        ratings: ratingsData,
        peers: peersData,
        earnings: earningsData,
        income: incomeData,
        aiSections,
      };

      setCurrentPitch(newPitch);

      // Save to history
      const updated = [newPitch, ...history.filter((h) => h.ticker !== symbol)];
      setHistory(updated);
      saveHistory(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsGenerating(false);
      setLoadStep(0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isGenerating) {
      void generatePitch();
    }
  };

  const loadFromHistory = (item: PitchData) => {
    setCurrentPitch(item);
    setTicker(item.ticker);
    setCompanyName(item.companyName !== item.ticker ? item.companyName : "");
  };

  return (
    <div className="dashboard-grid app-shell">
      <Sidebar eli5Mode={eli5Mode} onToggleEli5={() => setEli5Mode((v) => !v)} />

      <div className="main-content flex flex-col min-h-0">
        {/* ── Topbar ──────────────────────────────── */}
        <header className="theme-topbar shrink-0 px-6 py-4 border-b border-border flex items-center justify-between print-hide">
          <div>
            <div className="theme-kicker mb-1">Groq · FMP Data</div>
            <h1 className="theme-title text-2xl text-foreground">Stock Pitch Builder</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Professional investment memos generated in seconds
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 border border-border/60 px-2.5 py-1.5 rounded-lg">
              <Sparkles size={11} className="text-primary" />
              AI-powered
            </div>
          </div>
        </header>

        {/* ── Body ────────────────────────────────── */}
        <div className="flex flex-1 min-h-0">
          {/* ── Left Panel: Controls + History ──── */}
          <aside className="w-80 shrink-0 border-r border-border flex flex-col h-full overflow-hidden print-hide">
            {/* Ticker input */}
            <div className="p-4 border-b border-border space-y-3">
              <div className="theme-kicker">Generate Pitch</div>

              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  onKeyDown={handleKeyDown}
                  placeholder="AAPL"
                  maxLength={10}
                  className={cn(
                    "w-full pl-9 pr-4 py-2.5 rounded-xl text-base font-mono font-semibold",
                    "bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/50",
                    "outline-none transition-all duration-200",
                    "focus:border-primary focus:ring-2 focus:ring-primary/20",
                    "focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)]"
                  )}
                />
              </div>

              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company name (optional)"
                className={cn(
                  "w-full px-3 py-2 rounded-lg text-sm",
                  "bg-muted/30 border border-border/70 text-foreground placeholder:text-muted-foreground/50",
                  "outline-none transition-all duration-200",
                  "focus:border-primary/60 focus:ring-1 focus:ring-primary/15"
                )}
              />

              <button
                onClick={() => void generatePitch()}
                disabled={isGenerating || !ticker.trim()}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200",
                  "bg-gradient-to-r from-primary to-[hsl(168_76%_38%)]",
                  "text-primary-foreground shadow-md",
                  "hover:shadow-[0_0_16px_hsl(var(--primary)/0.4)]",
                  "hover:brightness-110",
                  "disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:brightness-100"
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Generate Pitch
                  </>
                )}
              </button>

              {error && (
                <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2.5 text-xs text-rose-400">
                  <X size={12} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* History list */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {history.length > 0 ? (
                <>
                  <div className="px-4 pt-4 pb-2">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Clock size={10} />
                      Recent Pitches
                    </div>
                  </div>
                  <div className="px-2 pb-4 space-y-1">
                    {history.map((item, i) => {
                      const isActive = currentPitch?.generatedAt === item.generatedAt;
                      return (
                        <button
                          key={i}
                          onClick={() => loadFromHistory(item)}
                          className={cn(
                            "w-full text-left px-3 py-2.5 rounded-xl transition-all group border",
                            isActive
                              ? "bg-primary/10 border-primary/25 text-primary"
                              : "border-transparent hover:bg-muted/50 hover:border-border/60 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={cn(
                              "font-mono font-bold text-sm",
                              isActive ? "text-primary" : "text-foreground"
                            )}>
                              {item.ticker}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className={cn(
                                "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                                item.aiSections.recommendation === "BUY"
                                  ? "bg-emerald-500/15 text-emerald-400"
                                  : item.aiSections.recommendation === "SELL"
                                    ? "bg-rose-500/15 text-rose-400"
                                    : "bg-amber-500/15 text-amber-400"
                              )}>
                                {item.aiSections.recommendation}
                              </span>
                              <ChevronRight size={12} className="opacity-40 group-hover:opacity-70 transition-opacity" />
                            </div>
                          </div>
                          <div className="text-[10px] text-muted-foreground/80 leading-snug line-clamp-1">
                            {truncate(item.aiSections.executiveSummary, 60)}
                          </div>
                          <div className="text-[10px] text-muted-foreground/50 mt-0.5">
                            {formatDate(item.generatedAt)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full px-4 text-center gap-2 text-muted-foreground">
                  <FileText size={28} className="opacity-30" />
                  <p className="text-xs">No pitches yet — generate your first one above.</p>
                </div>
              )}
            </div>
          </aside>

          {/* ── Right Panel: Memo ──────────────────── */}
          <main className="flex-1 flex flex-col min-h-0 overflow-y-auto overscroll-contain">
            {isGenerating ? (
              <LoadingSkeleton step={loadStep} />
            ) : currentPitch ? (
              <div
                className={cn(
                  "flex-1 p-6 transition-opacity duration-500 fade-in-up",
                  visible ? "opacity-100" : "opacity-0"
                )}
              >
                <PitchMemo data={currentPitch} onPrint={() => window.print()} />
              </div>
            ) : (
              <EmptyState />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
