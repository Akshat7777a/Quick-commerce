import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Build wrapper for the core + patches layout:
 *   core/     the app itself (source, index.html, public assets)
 *   patches/  numbered, self-contained updates loaded by core at build time
 * The production artifacts (dist/) and the environment file (.env) stay in the
 * repository root, so deploy tooling and local scripts never change.
 */
export default defineConfig({
  root: "core",
  plugins: [react(), tailwindcss()],
  envDir: "..",
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      // The app root is core/, but patches/ sits beside it and is bundled in.
      allow: [".."],
    },
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    sourcemap: false,
  },
});
