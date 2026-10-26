import type { ComponentType, ReactNode } from "react";

/**
 * The only way patches touch the app.
 *
 * The core owns the registries below and the codebase merges nothing else.
 * A patch imports `extensions` and calls what it needs inside its
 * `register()` function; it must never import app internals directly,
 * never mutate modules it does not own, and never assume other patches
 * are enabled (declare those in `depends_on` in its manifest instead).
 *
 * Core change process: adding cases here is a core change. It requires
 * the owner's explicit approval and its own commit, see UPDATING.md.
 */

/** A whole-page route the patch wants to register, e.g. "/coupons-print". */
export type PatchRoute = {
  path: string;
  /** Render without the storefront layout (header/footer absent). */
  bare?: boolean;
  element: ReactNode;
};

/** Named, documented UI positions in the core layout. */
export type PatchSlotName = "home-top" | "checkout-before-summary" | "footer-note";

/** Lifecycle points the core runs for patches, in registration order. */
export type PatchHookName =
  | "before-checkout"
  | "after-checkout"
  | "before-order-confirm";

export type PatchContext = {
  /** Register a route. Declaration order breaks ties; paths are unique. */
  registerRoute(route: PatchRoute): void;
  /** Register a component to render in a named UI position. */
  registerSlot(name: PatchSlotName, component: ComponentType): void;
  /** Register a hook phase callback. Throw inside a hook to abort checkout. */
  registerHook(name: PatchHookName, hook: (payload?: unknown) => void | Promise<void>): void;
  /**
   * Override design tokens (raw CSS custom properties) applied after the
   * theme system, every theme change. Keep overrides small and reversible.
   */
  registerThemeTokens(tokens: Record<string, string>): void;
};

const state = {
  routes: [] as PatchRoute[],
  slots: {} as Record<PatchSlotName, ComponentType[]>,
  hooks: {} as Record<PatchHookName, ((payload?: unknown) => void | Promise<void>)[]>,
  themeTokens: {} as Record<string, string>,
  themeOwners: {} as Record<string, string>,
};

function safeArray(name: PatchHookName) {
  return (state.hooks[name] ??= []);
}

export const extensions = {
  registerRoute(route: PatchRoute) {
    if (!route.path.startsWith("/")) {
      throw new Error(`Patch route "${route.path}" must start with "/"`);
    }
    if (state.routes.some((existing) => existing.path === route.path)) {
      throw new Error(`Patch route "${route.path}" is registered twice`);
    }
    state.routes.push(route);
  },

  registerSlot(name: PatchSlotName, component: ComponentType) {
    (state.slots[name] ??= []).push(component);
  },

  registerHook(name: PatchHookName, hook: (payload?: unknown) => void | Promise<void>) {
    safeArray(name).push(hook);
  },

  registerThemeTokens(tokens: Record<string, string>, owner = "unknown") {
    for (const [key, value] of Object.entries(tokens)) {
      state.themeTokens[key] = value;
      state.themeOwners[key] = owner;
    }
  },

  /** Read back for tests and the loader's own diagnostics. */
  snapshot() {
    return {
      routes: [...state.routes],
      slots: Object.fromEntries(
        Object.entries(state.slots).map(([name, list]) => [name, [...list]]),
      ) as Record<PatchSlotName, ComponentType[]>,
      hooks: { ...state.hooks },
      themeTokens: { ...state.themeTokens },
    };
  },

  hooksFor(name: PatchHookName) {
    return [...(state.hooks[name] ?? [])];
  },

  tokens() {
    return { ...state.themeTokens };
  },

  tokenOwners() {
    return { ...state.themeOwners };
  },
};
