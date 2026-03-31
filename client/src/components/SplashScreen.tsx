import { useEffect, useState } from "react";

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 400);
    const t2 = setTimeout(() => setPhase("out"), 1800);
    const t3 = setTimeout(() => onDone(), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "hsl(220, 18%, 7%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transition: "opacity 0.6s ease",
        opacity: phase === "out" ? 0 : 1,
        pointerEvents: phase === "out" ? "none" : "all",
      }}
    >
      {/* Hero brand image — faded behind everything */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "url('/aliasist-hero.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        opacity: 0.12,
        filter: "blur(2px) saturate(1.4)",
      }} />

      {/* Dot grid background */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "radial-gradient(circle, hsl(165 90% 42% / 0.1) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }} />

      {/* Glow halo behind UFO */}
      <div style={{
        position: "absolute",
        width: 320,
        height: 320,
        borderRadius: "50%",
        background: "radial-gradient(circle, hsl(165 90% 42% / 0.15) 0%, transparent 70%)",
        animation: "pulse 2s ease-in-out infinite",
      }} />

      {/* UFO SVG — the aliasist UFO path */}
      <svg
        viewBox="0 0 100 58.4275"
        width={160}
        style={{
          filter: "drop-shadow(0 0 20px hsl(165, 90%, 42%))",
          animation: "floatUfo 3s ease-in-out infinite",
          position: "relative",
          zIndex: 1,
          transform: phase === "in" ? "translateY(12px)" : "translateY(0)",
          transition: "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <defs>
          <linearGradient id="splash-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0acb9b" />
            <stop offset="100%" stopColor="#06b077" />
          </linearGradient>
        </defs>
        <path
          d="M 99.922,17.594 C 98.75,11.344 84.634,8.459 65.7,9.774 63.108,5.45 57.739,2.628 51.473,2.26 50.285,0.543 47.711,-0.372 44.973,0.141 42.235,0.654 40.167,2.439 39.681,4.471 33.974,7.084 29.992,11.659 29.142,16.628 11.019,22.262 -1.094,30.063 0.078,36.314 c 1.202,6.408 16.011,9.277 35.668,7.711 1.925,1.294 4.643,2.171 7.826,2.531 -0.885,-0.904 -1.729,-1.926 -2.521,-3.051 0.858,-0.099 1.724,-0.205 2.596,-0.32 0.762,1.323 1.571,2.515 2.413,3.545 2.363,0.065 4.911,-0.131 7.531,-0.622 7.335,-1.375 13.294,-4.696 15.877,-8.406 18.89,-5.66 31.655,-13.701 30.454,-20.108 z M 50.539,29.831 c -13.173,2.471 -24.318,1.983 -24.894,-1.085 -0.223,-1.187 1.173,-2.587 3.724,-3.999 0.11,0.652 0.354,1.271 0.899,1.856 1.538,0.324 3.147,0.509 4.787,0.589 -0.203,-1.647 -0.294,-3.264 -0.288,-4.833 0.957,-0.351 1.972,-0.694 3.041,-1.027 0.06,1.892 0.235,3.864 0.541,5.883 3.97,-0.114 7.965,-0.711 11.446,-1.364 5.907,-1.107 13.24,-2.461 18.553,-5.939 0.339,-0.851 0.283,-1.669 0.069,-2.49 2.897,0.392 4.711,1.191 4.934,2.38 0.574,3.068 -9.638,7.559 -22.812,10.029 z"
          fill="url(#splash-grad)"
        />
      </svg>

      {/* Brand name */}
      <div style={{
        marginTop: 28,
        fontFamily: "'Space Grotesk', 'Outfit', sans-serif",
        fontSize: 28,
        fontWeight: 700,
        color: "#eef1ef",
        letterSpacing: "0.08em",
        position: "relative",
        zIndex: 1,
        opacity: phase === "in" ? 0 : 1,
        transform: phase === "in" ? "translateY(8px)" : "translateY(0)",
        transition: "opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s",
      }}>
        ALIASIST <span style={{ color: "#0acb9b" }}>PULSE</span>
      </div>

      {/* Tagline */}
      <div style={{
        marginTop: 8,
        fontFamily: "'JetBrains Mono', 'Space Mono', monospace",
        fontSize: 11,
        color: "hsl(165, 90%, 42%)",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        position: "relative",
        zIndex: 1,
        opacity: phase === "in" ? 0 : 0.75,
        transition: "opacity 0.5s ease 0.4s",
      }}>
        // market intelligence · initialized
      </div>

      {/* Loading bar */}
      <div style={{
        marginTop: 40,
        width: 200,
        height: 2,
        background: "hsl(220 15% 17%)",
        borderRadius: 999,
        overflow: "hidden",
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{
          height: "100%",
          background: "hsl(165, 90%, 42%)",
          borderRadius: 999,
          animation: "loadBar 1.6s ease forwards",
          boxShadow: "0 0 8px hsl(165, 90%, 42%)",
        }} />
      </div>

      <style>{`
        @keyframes floatUfo {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes loadBar {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
