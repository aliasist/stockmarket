import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: number;
  variant?: "icon" | "full"; // icon = UFO only, full = UFO + "aliasist" text
}

export default function Logo({ className, size = 28, variant = "icon" }: LogoProps) {
  if (variant === "full") {
    // Full lockup: UFO icon + "aliasist" wordmark side by side
    return (
      <svg
        viewBox="0 0 200 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width={size * 5}
        height={size * 1.2}
        className={cn("", className)}
        aria-label="Aliasist"
      >
        <defs>
          <linearGradient id="ufo-grad-full" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
          <filter id="glow-full">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        {/* UFO icon scaled to fit left side, scaled and translated */}
        <g transform="translate(2, 4) scale(0.38)">
          <path
            d="M 99.922,17.594 C 98.75,11.344 84.634,8.459 65.7,9.774 63.108,5.45 57.739,2.628 51.473,2.26 50.285,0.543 47.711,-0.372 44.973,0.141 42.235,0.654 40.167,2.439 39.681,4.471 33.974,7.084 29.992,11.659 29.142,16.628 11.019,22.262 -1.094,30.063 0.078,36.314 c 1.202,6.408 16.011,9.277 35.668,7.711 1.925,1.294 4.643,2.171 7.826,2.531 -0.885,-0.904 -1.729,-1.926 -2.521,-3.051 0.858,-0.099 1.724,-0.205 2.596,-0.32 0.762,1.323 1.571,2.515 2.413,3.545 2.363,0.065 4.911,-0.131 7.531,-0.622 7.335,-1.375 13.294,-4.696 15.877,-8.406 18.89,-5.66 31.655,-13.701 30.454,-20.108 z M 50.539,29.831 c -13.173,2.471 -24.318,1.983 -24.894,-1.085 -0.223,-1.187 1.173,-2.587 3.724,-3.999 0.11,0.652 0.354,1.271 0.899,1.856 1.538,0.324 3.147,0.509 4.787,0.589 -0.203,-1.647 -0.294,-3.264 -0.288,-4.833 0.957,-0.351 1.972,-0.694 3.041,-1.027 0.06,1.892 0.235,3.864 0.541,5.883 3.97,-0.114 7.965,-0.711 11.446,-1.364 5.907,-1.107 13.24,-2.461 18.553,-5.939 0.339,-0.851 0.283,-1.669 0.069,-2.49 2.897,0.392 4.711,1.191 4.934,2.38 0.574,3.068 -9.638,7.559 -22.812,10.029 z"
            fill="url(#ufo-grad-full)"
            filter="url(#glow-full)"
          />
        </g>
        {/* "aliasist" wordmark */}
        <text
          x="48"
          y="32"
          fontFamily="'Outfit', system-ui, sans-serif"
          fontSize="22"
          fontWeight="700"
          letterSpacing="-0.5"
          fill="#f0fdf4"
        >
          aliasist
        </text>
      </svg>
    );
  }

  // Icon only variant
  return (
    <svg
      viewBox="0 0 100 58.4275"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size * 0.584}
      className={cn("", className)}
      aria-label="Aliasist"
    >
      <defs>
        <linearGradient id="ufo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <path
        d="M 99.922,17.594 C 98.75,11.344 84.634,8.459 65.7,9.774 63.108,5.45 57.739,2.628 51.473,2.26 50.285,0.543 47.711,-0.372 44.973,0.141 42.235,0.654 40.167,2.439 39.681,4.471 33.974,7.084 29.992,11.659 29.142,16.628 11.019,22.262 -1.094,30.063 0.078,36.314 c 1.202,6.408 16.011,9.277 35.668,7.711 1.925,1.294 4.643,2.171 7.826,2.531 -0.885,-0.904 -1.729,-1.926 -2.521,-3.051 0.858,-0.099 1.724,-0.205 2.596,-0.32 0.762,1.323 1.571,2.515 2.413,3.545 2.363,0.065 4.911,-0.131 7.531,-0.622 7.335,-1.375 13.294,-4.696 15.877,-8.406 18.89,-5.66 31.655,-13.701 30.454,-20.108 z M 50.539,29.831 c -13.173,2.471 -24.318,1.983 -24.894,-1.085 -0.223,-1.187 1.173,-2.587 3.724,-3.999 0.11,0.652 0.354,1.271 0.899,1.856 1.538,0.324 3.147,0.509 4.787,0.589 -0.203,-1.647 -0.294,-3.264 -0.288,-4.833 0.957,-0.351 1.972,-0.694 3.041,-1.027 0.06,1.892 0.235,3.864 0.541,5.883 3.97,-0.114 7.965,-0.711 11.446,-1.364 5.907,-1.107 13.24,-2.461 18.553,-5.939 0.339,-0.851 0.283,-1.669 0.069,-2.49 2.897,0.392 4.711,1.191 4.934,2.38 0.574,3.068 -9.638,7.559 -22.812,10.029 z"
        fill="url(#ufo-grad)"
        filter="url(#glow)"
      />
    </svg>
  );
}
