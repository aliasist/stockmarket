/**
 * NvdaRadarChart — 6-axis SVG radar/spider chart
 * Compares NVDA vs PLTR vs GOOGL on key investment dimensions
 * Pure SVG — no external chart lib needed
 */

interface StockScores {
  name: string;
  color: string;
  scores: number[]; // 0–10 per axis
}

const AXES = [
  "Revenue\nGrowth",
  "FCF\nQuality",
  "Valuation",
  "Moat",
  "Bear Case\nStrength",
  "Analyst\nConviction",
];

const STOCKS: StockScores[] = [
  { name: "NVDA", color: "hsl(165, 90%, 42%)", scores: [9, 10, 7, 9, 5, 10] },
  { name: "PLTR", color: "hsl(213, 94%, 68%)", scores: [10, 9, 4, 9, 3, 8] },
  { name: "GOOGL", color: "hsl(40, 96%, 62%)", scores: [7, 9, 9, 9, 6, 10] },
];

const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 76;
const N = AXES.length;

function polarToXY(angle: number, r: number) {
  // start at top (-π/2), go clockwise
  const rad = (angle * Math.PI) / 180 - Math.PI / 2;
  return {
    x: CENTER + r * Math.cos(rad),
    y: CENTER + r * Math.sin(rad),
  };
}

function getPoints(scores: number[]): string {
  return scores
    .map((s, i) => {
      const angle = (360 / N) * i;
      const r = (s / 10) * RADIUS;
      const { x, y } = polarToXY(angle, r);
      return `${x},${y}`;
    })
    .join(" ");
}

function hexColor(color: string, alpha: number): string {
  // append opacity via CSS — just return the color string with inline style
  return color;
}

export default function NvdaRadarChart() {
  const gridLevels = [2, 4, 6, 8, 10];

  return (
    <div className="theme-panel p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="theme-kicker text-xs">6-Factor Comparison</div>
          <div className="text-sm font-semibold text-foreground">
            NVDA vs Peers
          </div>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3">
          {STOCKS.map((s) => (
            <div key={s.name} className="flex items-center gap-1">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: s.color }}
              />
              <span className="text-xs font-medium" style={{ color: s.color }}>
                {s.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ overflow: "visible" }}
        >
          {/* Grid rings */}
          {gridLevels.map((level) => {
            const r = (level / 10) * RADIUS;
            const pts = Array.from({ length: N }, (_, i) => {
              const angle = (360 / N) * i;
              const { x, y } = polarToXY(angle, r);
              return `${x},${y}`;
            }).join(" ");
            return (
              <polygon
                key={level}
                points={pts}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="0.8"
                opacity="0.6"
              />
            );
          })}

          {/* Axis lines */}
          {AXES.map((_, i) => {
            const angle = (360 / N) * i;
            const { x, y } = polarToXY(angle, RADIUS);
            return (
              <line
                key={i}
                x1={CENTER}
                y1={CENTER}
                x2={x}
                y2={y}
                stroke="hsl(var(--border))"
                strokeWidth="0.8"
                opacity="0.5"
              />
            );
          })}

          {/* Stock polygons — background first, then foreground */}
          {[...STOCKS].reverse().map((stock) => (
            <polygon
              key={stock.name + "-fill"}
              points={getPoints(stock.scores)}
              fill={stock.color}
              fillOpacity="0.12"
              stroke={stock.color}
              strokeWidth={stock.name === "NVDA" ? 2.2 : 1.5}
              strokeOpacity="0.85"
            />
          ))}

          {/* Dots on NVDA vertices */}
          {STOCKS[0].scores.map((s, i) => {
            const angle = (360 / N) * i;
            const r = (s / 10) * RADIUS;
            const { x, y } = polarToXY(angle, r);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={3}
                fill={STOCKS[0].color}
                stroke="hsl(var(--background))"
                strokeWidth="1"
              />
            );
          })}

          {/* Axis labels */}
          {AXES.map((label, i) => {
            const angle = (360 / N) * i;
            const { x, y } = polarToXY(angle, RADIUS + 18);
            const lines = label.split("\n");
            const isLeft = x < CENTER - 4;
            const anchor = isLeft ? "end" : x > CENTER + 4 ? "start" : "middle";
            return (
              <text
                key={i}
                x={x}
                y={y}
                textAnchor={anchor}
                dominantBaseline="middle"
                fontSize="8"
                fill="hsl(var(--muted-foreground))"
                fontFamily="var(--font-sans, sans-serif)"
              >
                {lines.map((line, li) => (
                  <tspan key={li} x={x} dy={li === 0 ? 0 : "1.1em"}>
                    {line}
                  </tspan>
                ))}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Score table */}
      <div className="space-y-1.5 text-xs">
        {AXES.map((axis, i) => (
          <div key={axis} className="flex items-center gap-2">
            <div className="text-muted-foreground w-24 truncate leading-tight">
              {axis.replace("\n", " ")}
            </div>
            {STOCKS.map((s) => (
              <div key={s.name} className="flex items-center gap-1 w-12">
                <div
                  className="h-1 rounded-full"
                  style={{
                    width: `${(s.scores[i] / 10) * 32}px`,
                    background: s.color,
                    opacity: 0.8,
                  }}
                />
                <span
                  className="font-mono font-bold w-4 text-right"
                  style={{ color: s.color }}
                >
                  {s.scores[i]}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Totals */}
      <div
        className="flex justify-between rounded-lg px-3 py-2 text-xs"
        style={{ background: "hsl(var(--primary) / 0.07)" }}
      >
        <span className="text-muted-foreground font-medium">Total Score</span>
        {STOCKS.map((s) => (
          <span key={s.name} className="font-bold font-mono" style={{ color: s.color }}>
            {s.name}: {s.scores.reduce((a, b) => a + b, 0)}/60
          </span>
        ))}
      </div>
    </div>
  );
}
