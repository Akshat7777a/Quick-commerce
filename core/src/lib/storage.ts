/**
 * Safe storage helpers: every browser-storage access is wrapped in try/catch so
 * private mode, disabled storage or quota errors can never crash the store.
 * Used for everything that must survive a reload or a discarded background tab.
 */

export type StorageArea = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

type MaybeStorage = Storage | null | undefined;

/**
 * One storage area, hardened: if the preferred storage throws (private mode,
 * quota, disabled), the fallback object is tried and then the app simply
 * continues from memory.
 */
function area(primary: MaybeStorage, fallback: MaybeStorage): StorageArea {
  return {
    getItem(key) {
      try {
        return primary?.getItem(key) ?? fallback?.getItem(key) ?? null;
      } catch {
        try {
          return fallback?.getItem(key) ?? null;
        } catch {
          return null;
        }
      }
    },
    setItem(key, value) {
      try {
        primary?.setItem(key, value);
        return;
      } catch {
        /* fall through */
      }
      try {
        fallback?.setItem(key, value);
      } catch {
        /* storage unavailable — the app keeps working from memory */
      }
    },
    removeItem(key) {
      try {
        primary?.removeItem(key);
      } catch {
        try {
          fallback?.removeItem(key);
        } catch {
          /* ignore */
        }
      }
    },
  };
}

const local = area(
  typeof localStorage !== "undefined" ? localStorage : undefined,
  typeof sessionStorage !== "undefined" ? sessionStorage : undefined,
);
const session = area(
  typeof sessionStorage !== "undefined" ? sessionStorage : undefined,
  typeof localStorage !== "undefined" ? localStorage : undefined,
);

export function readJSON<T>(key: string, from: StorageArea = local): T | null {
  const raw = from.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJSON(key: string, value: unknown, to: StorageArea = local): void {
  try {
    to.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function removeKey(key: string, from: StorageArea = local): void {
  from.removeItem(key);
}

export { local as localStore, session as sessionStore };
