import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api";
import { demoSettings } from "./demo-data";
import {
  applyTheme,
  readModeOverride,
  resolveMode,
  writeModeOverride,
  type ThemeMode,
} from "./theme";
import type { StoreSettings } from "./types";

type StoreContextValue = {
  settings: StoreSettings;
  loading: boolean;
  /** Resolved light/dark as currently shown (visitor override included). */
  mode: "light" | "dark";
  refresh: () => Promise<void>;
  save: (patch: Partial<StoreSettings>) => Promise<void>;
  /** Header toggle: flips this visitor between light and dark. */
  toggleMode: () => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(demoSettings);
  const [loading, setLoading] = useState(true);
  const [override, setOverride] = useState<ThemeMode | null>(readModeOverride);
  const [systemTick, setSystemTick] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const fresh = await api.getSettings();
      if (fresh) setSettings(fresh);
    } catch {
      /* keep the last known settings — the storefront stays usable */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(async (patch: Partial<StoreSettings>) => {
    const updated = await api.saveSettings(patch);
    setSettings(updated);
    // Changing the store-wide mode drops any visitor override so the admin
    // immediately sees the default they just picked.
    if (patch.theme_mode !== undefined) {
      writeModeOverride(null);
      setOverride(null);
    }
  }, []);

  const mode = useMemo(
    () => resolveMode(settings, override),
    // systemTick re-resolves "system" when the OS preference changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings, override, systemTick],
  );

  useEffect(() => {
    applyTheme(mode, settings.theme_preset);
  }, [mode, settings.theme_preset]);

  // Follow OS preference live while the resolved mode is "system".
  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => setSystemTick((tick) => tick + 1);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const toggleMode = useCallback(() => {
    const next = resolveMode(settings, override) === "dark" ? "light" : "dark";
    writeModeOverride(next);
    setOverride(next);
  }, [settings, override]);

  const value = useMemo(
    () => ({ settings, loading, mode, refresh, save, toggleMode }),
    [settings, loading, mode, refresh, save, toggleMode],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStoreSettings() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStoreSettings must be used inside StoreProvider");
  return context;
}
