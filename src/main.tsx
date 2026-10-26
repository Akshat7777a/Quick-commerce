import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { registerServiceWorker } from "./lib/pwa";

registerServiceWorker();

const root = document.getElementById("root");

createRoot(root!).render(
  <StrictMode>
    {/* Last line of defence: a crash shows a friendly fallback, never a white screen. */}
    <ErrorBoundary name="app">
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
