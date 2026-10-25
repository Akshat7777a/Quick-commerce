import type { StoreSettings } from "./types";

/** Visitor-level light/dark override (header toggle). null = follow store default. */
export const MODE_OVERRIDE_KEY = "lmart.mode.v1";

export type ThemeMode = "light" | "dark" | "system";

export type ThemePreset = {
  id: string;
  label: string;
  emoji: string;
  /** [primary, gold, clay] swatches for the admin picker. */
  swatch: [string, string, string];
};

/** Festival / branding presets the admin can switch between. */
export const THEME_PRESETS: ThemePreset[] = [
  { id: "default", label: "Classic green", emoji: "🛒", swatch: ["#103327", "#d8a84b", "#b4552f"] },
  { id: "diwali", label: "Diwali", emoji: "🪔", swatch: ["#5b2a86", "#f0b429", "#c2185b"] },
  { id: "holi", label: "Holi", emoji: "🎨", swatch: ["#ad1457", "#ffb300", "#8e24aa"] },
  { id: "christmas", label: "Christmas", emoji: "🎄", swatch: ["#b3261e", "#ffd54f", "#2e7d32"] },
  { id: "eid", label: "Eid", emoji: "🌙", swatch: ["#00695c", "#d4af37", "#1b5e20"] },
  { id: "republic", label: "Republic Day", emoji: "🇮🇳", swatch: ["#ef6c00", "#138808", "#ffd54f"] },
];

export function readModeOverride(): ThemeMode | null {
  try {
    const raw = localStorage.getItem(MODE_OVERRIDE_KEY);
    return raw === "light" || raw === "dark" || raw === "system" ? raw : null;
  } catch {
    return null;
  }
}

export function writeModeOverride(mode: ThemeMode | null): void {
  try {
    if (mode) localStorage.setItem(MODE_OVERRIDE_KEY, mode);
    else localStorage.removeItem(MODE_OVERRIDE_KEY);
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

/** The mode actually shown right now: visitor override beats the store default. */
export function resolveMode(
  settings: Pick<StoreSettings, "theme_mode">,
  override: ThemeMode | null,
): "light" | "dark" {
  const mode = override ?? settings.theme_mode ?? "light";
  if (mode === "system") {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  }
  return mode;
}

/** Push the resolved theme onto <html> (dark class + festival preset attribute). */
export function applyTheme(mode: "light" | "dark", preset: string | null | undefined): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");

  const known =
    preset && THEME_PRESETS.some((item) => item.id === preset) && preset !== "default"
      ? preset
      : null;
  if (known) root.setAttribute("data-theme", known);
  else root.removeAttribute("data-theme");

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", mode === "dark" ? "#0f1511" : "#f7f4ec");
}
