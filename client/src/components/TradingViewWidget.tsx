import { useEffect, useRef, useState } from "react";

interface TradingViewWidgetProps {
  ticker: string;
  theme?: "dark" | "light";
  height?: number;
}

export default function TradingViewWidget({
  ticker,
  theme = "dark",
  height = 400,
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setLoading(true);
    container.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";
    container.appendChild(widgetDiv);

    const config = {
      autosize: true,
      symbol: ticker,
      interval: "D",
      timezone: "Etc/UTC",
      theme: theme,
      style: "1",
      locale: "en",
      withdateranges: true,
      range: "3M",
      hide_side_toolbar: false,
      allow_symbol_change: true,
      save_image: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
    };

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify(config);

    // Hide loading once script has had time to render
    script.onload = () => {
      setTimeout(() => setLoading(false), 800);
    };
    // Fallback: hide loading after timeout even if onload didn't fire
    const timer = setTimeout(() => setLoading(false), 3000);

    container.appendChild(script);

    return () => {
      clearTimeout(timer);
      container.innerHTML = "";
    };
  }, [ticker, theme]);

  return (
    <div className="theme-panel overflow-hidden" style={{ height: height + 16 }}>
      <div className="relative" style={{ height }}>
        {/* Loading skeleton */}
        {loading && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl"
            style={{ background: "hsl(257 43% 9%)" }}
          >
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-xs text-muted-foreground">Loading chart...</span>
          </div>
        )}

        {/* TradingView container */}
        <div
          ref={containerRef}
          className="tradingview-widget-container"
          style={{ height: "100%", width: "100%" }}
        />
      </div>
    </div>
  );
}
