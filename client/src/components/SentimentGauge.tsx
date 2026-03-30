import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface NewsItem {
  title: string;
  tone?: string;
}

interface AnalystRatings {
  buy: number;
  hold: number;
  sell: number;
  strongBuy: number;
  strongSell: number;
  numAnalysts: number;
  consensus: string;
  avgPriceTarget: number;
}

interface SentimentGaugeProps {
  ticker: string;
  news?: NewsItem[];
  ratings?: AnalystRatings;
}

function computeSentiment(news?: NewsItem[], ratings?: AnalystRatings): number {
  let newsScore = 50; // default neutral
  if (news && news.length > 0) {
    let bullish = 0;
    let bearish = 0;
    for (const item of news) {
      if (item.tone === "data_backed") bullish++;
      else if (item.tone === "fear_mongering") bearish++;
    }
    const total = bullish + bearish;
    if (total > 0) {
      newsScore = (bullish / total) * 100;
    } else {
      newsScore = 50;
    }
  }

  let analystScore: number | null = null;
  if (ratings) {
    const { buy, hold, sell, strongBuy, strongSell } = ratings;
    const weightedBull = buy + strongBuy * 1.5;
    const totalVotes = buy + hold + sell + strongBuy + strongSell;
    if (totalVotes > 0) {
      analystScore = (weightedBull / totalVotes) * 100;
    }
  }

  if (analystScore !== null) {
    return 0.4 * newsScore + 0.6 * analystScore;
  }
  return newsScore;
}

function scoreLabel(score: number): string {
  if (score < 33) return "Bearish";
  if (score < 66) return "Neutral";
  return "Bullish";
}

function scoreColor(score: number): string {
  if (score < 33) return "#f43f5e";
  if (score < 66) return "#f59e0b";
  return "#10b981";
}

// SVG arc helpers
const RADIUS = 70;
const CX = 90;
const CY = 90;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export default function SentimentGauge({ ticker, news, ratings }: SentimentGaugeProps) {
  const score = useMemo(() => computeSentiment(news, ratings), [news, ratings]);
  const label = scoreLabel(score);
  const color = scoreColor(score);

  // Gauge spans 180 degrees (-90 to +90 in display, mapped to 0-180 rotation)
  // Score 0 → -90deg (left), Score 100 → +90deg (right)
  const needleAngle = -90 + (score / 100) * 180; // in degrees from top (polar)
  // Convert to display angle for SVG: we place the arc from 180° to 360° (bottom half up)
  // Actually let's place the arc from 210° to 330° for a cleaner look
  // Let's use -180 to 0 deg from center (a standard semi-circle at top)

  // Arc is 180 degrees: starts at 180deg (left) ends at 0deg (right) — top semicircle
  // Using angles from SVG perspective: 180deg = left, 0deg = right
  // Score 0 = leftmost (180), Score 100 = rightmost (0), Score 50 = top (90)

  const needleSvgAngle = 180 - (score / 100) * 180; // 180 at score=0, 0 at score=100
  const needleEndX = CX + (RADIUS - 10) * Math.cos((needleSvgAngle * Math.PI) / 180);
  const needleEndY = CY - (RADIUS - 10) * Math.sin((needleSvgAngle * Math.PI) / 180);

  // Analyst data
  const totalAnalysts = ratings
    ? ratings.buy + ratings.hold + ratings.sell + ratings.strongBuy + ratings.strongSell
    : 0;
  const buyCount = ratings ? ratings.buy + ratings.strongBuy : 0;
  const holdCount = ratings ? ratings.hold : 0;
  const sellCount = ratings ? ratings.sell + ratings.strongSell : 0;

  const buyPct = totalAnalysts > 0 ? (buyCount / totalAnalysts) * 100 : 0;
  const holdPct = totalAnalysts > 0 ? (holdCount / totalAnalysts) * 100 : 0;
  const sellPct = totalAnalysts > 0 ? (sellCount / totalAnalysts) * 100 : 0;

  return (
    <div className={cn("theme-panel p-4 space-y-4")}>
      <div className="flex items-center justify-between">
        <div>
          <div className="theme-kicker text-xs">Sentiment</div>
          <div className="text-sm font-semibold text-foreground">{ticker}</div>
        </div>
        <div
          className="text-xs font-semibold px-2 py-0.5 rounded-full border"
          style={{ color, borderColor: `${color}40`, background: `${color}15` }}
        >
          {label}
        </div>
      </div>

      {/* SVG Gauge */}
      <div className="flex flex-col items-center">
        <svg width="180" height="100" viewBox="0 0 180 100" className="overflow-visible">
          {/* Background arc — full 180° */}
          <path
            d={describeArc(CX, CY, RADIUS, 180, 360)}
            fill="none"
            stroke="hsl(257 43% 15%)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Bearish zone 0–33 → 180°–120° */}
          <path
            d={describeArc(CX, CY, RADIUS, 180, 180 + 60)}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="14"
            strokeLinecap="butt"
            opacity="0.35"
          />
          {/* Neutral zone 33–66 → 120°–60° */}
          <path
            d={describeArc(CX, CY, RADIUS, 240, 300)}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="14"
            strokeLinecap="butt"
            opacity="0.35"
          />
          {/* Bullish zone 66–100 → 60°–0° */}
          <path
            d={describeArc(CX, CY, RADIUS, 300, 360)}
            fill="none"
            stroke="#10b981"
            strokeWidth="14"
            strokeLinecap="butt"
            opacity="0.35"
          />

          {/* Active score arc */}
          <path
            d={describeArc(CX, CY, RADIUS, 180, 180 + (score / 100) * 180)}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* Needle */}
          <line
            x1={CX}
            y1={CY}
            x2={needleEndX}
            y2={needleEndY}
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.9"
          />
          {/* Needle pivot */}
          <circle cx={CX} cy={CY} r="5" fill={color} />

          {/* Zone labels */}
          <text x="14" y="98" fill="#f43f5e" fontSize="9" opacity="0.7">Bear</text>
          <text x="80" y="20" fill="#f59e0b" fontSize="9" opacity="0.7" textAnchor="middle">Neutral</text>
          <text x="155" y="98" fill="#10b981" fontSize="9" opacity="0.7" textAnchor="end">Bull</text>
        </svg>

        {/* Score display */}
        <div className="text-center -mt-1">
          <div className="text-lg font-bold" style={{ color }}>{label}</div>
          <div className="text-xs text-muted-foreground">{Math.round(score)}/100</div>
        </div>
      </div>

      {/* Analyst breakdown */}
      {ratings && totalAnalysts > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Analyst Ratings ({totalAnalysts})
          </div>

          {/* Buy bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-emerald-400">Buy</span>
              <span className="text-muted-foreground">{buyCount}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${buyPct}%` }}
              />
            </div>
          </div>

          {/* Hold bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-amber-400">Hold</span>
              <span className="text-muted-foreground">{holdCount}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: `${holdPct}%` }}
              />
            </div>
          </div>

          {/* Sell bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-rose-400">Sell</span>
              <span className="text-muted-foreground">{sellCount}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-rose-500 transition-all duration-500"
                style={{ width: `${sellPct}%` }}
              />
            </div>
          </div>

          {/* Price target + consensus */}
          <div className="pt-2 flex items-center justify-between border-t border-border/50">
            <div>
              <div className="text-xs text-muted-foreground">Avg Target</div>
              <div className="text-sm font-semibold text-foreground">
                ${ratings.avgPriceTarget.toFixed(2)}
              </div>
            </div>
            <div
              className="text-xs font-semibold px-2 py-1 rounded-md border"
              style={{ color, borderColor: `${color}40`, background: `${color}15` }}
            >
              {ratings.consensus}
            </div>
          </div>
        </div>
      )}

      {(!ratings || totalAnalysts === 0) && (
        <div className="text-xs text-muted-foreground text-center py-2">
          No analyst ratings available
        </div>
      )}
    </div>
  );
}
