/**
 * PWA install plumbing: service-worker registration, the `beforeinstallprompt`
 * capture browsers fire once the install criteria are met, and the platform
 * detection used to show the right instructions when the browser offers no
 * prompt (iOS Safari never does).
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallPlatform = "ios" | "android" | "desktop";

export type InstallState = {
  /** The app is already running as an installed app — hide install UI. */
  installed: boolean;
  /** Chrome/Android/Edge: the browser is offering its native install prompt. */
  canPrompt: boolean;
  platform: InstallPlatform;
};

let deferred: BeforeInstallPromptEvent | null = null;
let standalone = false;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  // iOS Safari exposes its own flag.
  if ((navigator as Navigator & { standalone?: boolean }).standalone === true) return true;
  return false;
}

export function detectPlatform(): InstallPlatform {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  // iPadOS 13+ reports itself as macOS.
  if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

if (typeof window !== "undefined") {
  standalone = detectStandalone();

  window.addEventListener("beforeinstallprompt", (event) => {
    // Keep the browser's default banner from competing with our own button.
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    deferred = null;
    standalone = true;
    notify();
  });

  window.matchMedia?.("(display-mode: standalone)").addEventListener("change", (event) => {
    standalone = event.matches;
    notify();
  });
}

/** Call once at startup — registers /sw.js, required for installability. */
export function registerServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (location.protocol !== "https:" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
    return; // service workers need a secure context
  }
  navigator.serviceWorker.register("/sw.js").catch(() => {
    // Offline support unavailable — the app itself still works.
  });
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getInstallState(): InstallState {
  return {
    installed: standalone,
    canPrompt: deferred !== null,
    platform: detectPlatform(),
  };
}

/** Triggers the browser's native install dialog. Consumed at most once. */
export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferred) return "unavailable";
  const event = deferred;
  deferred = null;
  notify();
  try {
    await event.prompt();
    const { outcome } = await event.userChoice;
    return outcome;
  } catch {
    return "dismissed";
  }
}
