import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface CompetitionTimerProps {
  deadline?: Date;
}

const DEFAULT_DEADLINE = new Date("2026-04-04T23:59:59-05:00"); // CDT = UTC-5

const DEFAULT_CHECKLIST_ITEMS = [
  "Research business model",
  "Analyze 3yr financials",
  "Build DCF model",
  "Identify 3 catalysts",
  "Draft investment thesis",
  "Stress test bear case",
  "Generate pitch memo",
];

const LS_KEY = "pitch_checklist";

interface ChecklistState {
  [item: string]: boolean;
}

function loadChecklist(): ChecklistState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      return JSON.parse(raw) as ChecklistState;
    }
  } catch {
    // ignore
  }
  const initial: ChecklistState = {};
  for (const item of DEFAULT_CHECKLIST_ITEMS) {
    initial[item] = false;
  }
  return initial;
}

function saveChecklist(state: ChecklistState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

function getCountdown(deadline: Date): CountdownParts {
  const now = Date.now();
  const diff = Math.max(0, deadline.getTime() - now);
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, totalMs: diff };
}

function urgencyColor(totalMs: number): string {
  const hours = totalMs / 3600000;
  if (hours < 24) return "hsl(350, 90%, 60%)"; // rose
  if (hours < 48) return "hsl(38, 92%, 60%)"; // amber
  return "hsl(168, 76%, 48%)"; // teal
}

export default function CompetitionTimer({ deadline = DEFAULT_DEADLINE }: CompetitionTimerProps) {
  const [countdown, setCountdown] = useState<CountdownParts>(() => getCountdown(deadline));
  const [checklist, setChecklist] = useState<ChecklistState>(loadChecklist);

  useEffect(() => {
    const tick = () => setCountdown(getCountdown(deadline));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const toggleItem = useCallback((item: string) => {
    setChecklist((prev) => {
      const next = { ...prev, [item]: !prev[item] };
      saveChecklist(next);
      return next;
    });
  }, []);

  const items = Object.keys(checklist).length > 0 ? Object.keys(checklist) : DEFAULT_CHECKLIST_ITEMS;
  const checkedCount = items.filter((i) => checklist[i]).length;
  const progressPct = items.length > 0 ? (checkedCount / items.length) * 100 : 0;
  const color = urgencyColor(countdown.totalMs);

  return (
    <div className="theme-panel p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="theme-kicker text-xs">Competition</div>
          <div className="text-sm font-semibold text-foreground">Pitch Deadline</div>
        </div>
        <div
          className="text-xs px-2 py-0.5 rounded-full border font-semibold"
          style={{ color, borderColor: `${color}40`, background: `${color}15` }}
        >
          {countdown.totalMs <= 0 ? "ENDED" : "LIVE"}
        </div>
      </div>

      {/* Countdown */}
      {countdown.totalMs > 0 ? (
        <div
          className="flex items-center justify-center gap-2 py-2 rounded-xl border"
          style={{ borderColor: `${color}30`, background: `${color}08` }}
        >
          <CountUnit value={countdown.days} label="d" color={color} />
          <span className="text-muted-foreground font-bold text-lg pb-1">:</span>
          <CountUnit value={countdown.hours} label="h" color={color} />
          <span className="text-muted-foreground font-bold text-lg pb-1">:</span>
          <CountUnit value={countdown.minutes} label="m" color={color} />
          <span className="text-muted-foreground font-bold text-lg pb-1">:</span>
          <CountUnit value={countdown.seconds} label="s" color={color} />
        </div>
      ) : (
        <div className="text-center py-3 text-rose-400 font-semibold text-sm">
          Competition has ended
        </div>
      )}

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Prep Progress</span>
          <span className="font-medium" style={{ color }}>
            {checkedCount}/{items.length}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%`, background: color }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-1.5">
        {items.map((item) => {
          const checked = checklist[item] ?? false;
          return (
            <button
              key={item}
              onClick={() => toggleItem(item)}
              className="w-full flex items-center gap-2.5 text-left group"
            >
              <div
                className={cn(
                  "w-4 h-4 rounded flex-shrink-0 border transition-all",
                  checked
                    ? "border-transparent"
                    : "border-border/60 bg-transparent group-hover:border-primary/60"
                )}
                style={checked ? { background: color } : {}}
              >
                {checked && (
                  <svg viewBox="0 0 16 16" fill="none" className="w-full h-full p-0.5">
                    <path
                      d="M3 8l3.5 3.5L13 5"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span
                className={cn(
                  "text-xs transition-colors",
                  checked ? "line-through text-muted-foreground" : "text-foreground/80"
                )}
              >
                {item}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CountUnit({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center min-w-[32px]">
      <span className="text-xl font-bold tabular-nums leading-tight" style={{ color }}>
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-xs text-muted-foreground leading-none">{label}</span>
    </div>
  );
}
