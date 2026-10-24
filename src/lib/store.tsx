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
import type { StoreSettings } from "./types";

type StoreContextValue = {
  settings: StoreSettings;
  loading: boolean;
  refresh: () => Promise<void>;
  save: (patch: Partial<StoreSettings>) => Promise<void>;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(demoSettings);
  const [loading, setLoading] = useState(true);

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
  }, []);

  const value = useMemo(
    () => ({ settings, loading, refresh, save }),
    [settings, loading, refresh, save],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStoreSettings() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStoreSettings must be used inside StoreProvider");
  return context;
}
