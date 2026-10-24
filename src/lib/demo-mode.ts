import { useSyncExternalStore } from "react";

export type DemoStatus = "checking" | "live" | "demo";

let status: DemoStatus = "checking";
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export const demoMode = {
  status: () => status,
  isEnabled: () => status === "demo",
  /** The database schema is missing — switch to local preview data. */
  enable() {
    if (status === "demo") return;
    status = "demo";
    notify();
  },
  /** A real Supabase request succeeded — never fall back again. */
  markLive() {
    if (status !== "checking") return;
    status = "live";
    notify();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

/** "checking" until the first request resolves, then "live" or "demo". */
export function useDemoStatus(): DemoStatus {
  return useSyncExternalStore(demoMode.subscribe, demoMode.status, demoMode.status);
}

/** True while the app is running on local preview data. */
export function useDemoMode() {
  return useDemoStatus() === "demo";
}
