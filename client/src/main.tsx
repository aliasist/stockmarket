import * as Sentry from "@sentry/react";
Sentry.init({
  dsn: "https://ec0f4be6dfc9d2d3684485f5195966c9@o4511142133760000.ingest.us.sentry.io/4511142160891905",
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
  tracesSampleRate: 0.5,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.05,
  environment: import.meta.env.MODE,
  release: "pulsesist@1.0.0",
});

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if (!window.location.hash) {
  window.location.hash = "#/";
}

createRoot(document.getElementById("root")!).render(<App />);
