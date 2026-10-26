import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { registerServiceWorker } from "./lib/pwa";
import { runPatchLoader } from "./lib/patch-loader";

registerServiceWorker();

async function boot() {
  // Patches register routes/slots/hooks before the first render so a
  // patch-provided page is reachable on a hard load of its URL. Loading
  // happens per patch in try/catch: a broken patch is skipped, never fatal.
  await runPatchLoader();

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      {/* Last line of defence: a crash shows a friendly fallback, never a white screen. */}
      <ErrorBoundary name="app">
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}

void boot();
