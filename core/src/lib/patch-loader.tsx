import type { ComponentType, ReactNode } from "react";
import { ErrorBoundary } from "../components/ErrorBoundary";
import type { PatchHookName, PatchRoute, PatchSlotName } from "./extensions";
import { extensions } from "./extensions";

/**
 * Build-time patch loader.
 *
 * - Discovers every `patches/<nnn-name>/` folder next to `core/` at build
 *   time (Vite glob, so there is no runtime file scanning).
 * - Reads its manifest.json: `id, title, enabled, depends_on, ...`.
 * - Sorted by folder number, each patch is initialised inside its own
 *   try/catch. A patch that fails to load or throws while registering is
 *   logged and skipped; the core keeps booting normally. Rendering pieces
 *   (routes and slots) are additionally wrapped in PatchIsland, so a
 *   runtime crash inside a patch stays contained to it.
 *
 * Switch a patch off with `"enabled": false` in its manifest, no deletion
 * needed. To remove one, delete its folder AFTER running its down migration
 * if it declared `requires_db_migration: true` (see the patch's README).
 */

export type PatchManifest = {
  id: string;
  title: string;
  date: string;
  version: string;
  description: string;
  depends_on?: string[];
  enabled: boolean;
  requires_db_migration?: boolean;
};

export type PatchModule = {
  default: {
    register: (context: PatchContextLike) => void;
  };
};

type PatchContextLike = {
  registerRoute: (route: PatchRoute) => void;
  registerSlot: (name: PatchSlotName, component: ComponentType) => void;
  registerHook: (name: PatchHookName, hook: (payload?: unknown) => void | Promise<void>) => void;
  registerThemeTokens: (tokens: Record<string, string>) => void;
};

const patchModules = import.meta.glob<PatchModule>("../../../patches/*/patch.{ts,tsx}");
const manifests = import.meta.glob<PatchManifest>("../../../patches/*/manifest.json", {
  eager: true,
  import: "default",
});
/** Global quick-switch: ids listed here are skipped, no deletion needed. */
const globalConfig = import.meta.glob<{ disabled?: string[] }>(
  "../../../patches/patches.config.json",
  { eager: true, import: "default" },
);
const globallyDisabled = new Set(Object.values(globalConfig)[0]?.disabled ?? []);

const allPatches: { manifest: PatchManifest; source: string; key: string }[] = Object.entries(manifests)
  .map(([path, manifest]) => {
    // Vite glob keys look like "../../../patches/001-foo/manifest.json".
    const key = path.replace(/\/manifest\.json$/, "");
    const source = key.replace(/^.*?patches\//, "patches/");
    return { manifest, source, key };
  })
  .sort((a, b) => a.source.localeCompare(b.source));

const skipped: string[] = [];
let loaded = 0;

function missingDependencies(manifest: PatchManifest): string[] {
  return (manifest.depends_on ?? []).filter(
    (id) => !allPatches.some((p) => p.manifest.id === id && p.manifest.enabled),
  );
}

async function initialise(source: string, key: string, manifest: PatchManifest) {
  const missing = missingDependencies(manifest);
  if (missing.length > 0) {
    skipped.push(`${source} (missing deps: ${missing.join(", ")})`);
    return;
  }
  const loader = patchModules[`${key}/patch.tsx`] ?? patchModules[`${key}/patch.ts`];
  if (!loader) {
    skipped.push(`${source} (no patch.ts entry found)`);
    return;
  }
  const imported = await loader();
  imported.default.register(extensions as unknown as PatchContextLike);
  loaded += 1;
}

export async function runPatchLoader(): Promise<void> {
  for (const { source, key, manifest } of allPatches) {
    if (!manifest.enabled) {
      skipped.push(`${source} (disabled in manifest)`);
      continue;
    }
    if (globallyDisabled.has(manifest.id)) {
      skipped.push(`${source} (disabled in patches.config.json)`);
      continue;
    }
    try {
      await initialise(source, key, manifest);
    } catch (error) {
      skipped.push(`${source} (${error instanceof Error ? error.message : String(error)})`);
      console.error(`[patches] Failed to load ${source}, skipping.`, error);
    }
  }

  if (skipped.length > 0) {
    if (import.meta.env.DEV) {
      console.info(`[patches] Loaded ${loaded}, skipped: ${skipped.join("; ")}`);
    }
  } else if (loaded > 0) {
    if (import.meta.env.DEV) {
      console.info(`[patches] Loaded ${loaded} patch${loaded === 1 ? "" : "es"}.`);
    }
  }
}

/** Wraps a patch-rendered subtree so one crash stays inside one patch. */
export function PatchIsland({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary variant="section" name="patch">
      {children}
    </ErrorBoundary>
  );
}

/** Current token overrides from enabled patches (read by the theme system). */
export function patchTokens(): Record<string, string> {
  return extensions.tokens();
}

/** Routes registered by enabled patches, in registration order. */
export function patchRoutes() {
  return extensions.snapshot().routes;
}

/**
 * Core lifecycle hooks. Runs every callback registered by enabled patches
 * for a phase, in registration order. A hook that throws aborts the phase
 * (used to block an order); unexpected hook errors in non-blocking phases
 * are logged and ignored so the customer keeps flowing.
 */
export async function runPatchHooks(
  name: PatchHookName,
  payload?: unknown,
  opts: { blocking?: boolean } = {},
): Promise<void> {
  for (const hook of extensions.hooksFor(name)) {
    try {
      await hook(payload);
    } catch (error) {
      if (opts.blocking) throw error;
      console.error(`[patches] ${name} hook failed, continuing.`, error);
    }
  }
}

/**
 * Renders everything a patch registered in a named UI slot, each in its own
 * ErrorBoundary island. Renders nothing when no patch uses the slot, so the
 * core layout is byte-for-byte what it was before patches existed.
 */
export function PatchSlot({ name }: { name: PatchSlotName }) {
  const components = extensions.snapshot().slots[name] ?? [];
  if (components.length === 0) return null;
  return (
    <>
      {components.map((Component, index) => (
        <ErrorBoundary key={index} variant="section" name={`patch slot:${name}#${index}`}>
          <Component />
        </ErrorBoundary>
      ))}
    </>
  );
}
