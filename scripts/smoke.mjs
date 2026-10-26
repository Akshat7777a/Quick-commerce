#!/usr/bin/env node
/**
 * Pre-deploy smoke test. Run:
 *   node scripts/smoke.mjs
 *
 * Expects the production build to exist (npm run build). Starts a static
 * preview of dist/ on port 4199, then checks that the app actually boots and
 * renders with JavaScript running, using headless Chrome --dump-dom
 * (no extra dependencies). Exit code 0 only on SMOKE OK.
 */
import { spawn } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const PORT = 4199;
const BASE = `http://localhost:${PORT}`;

const failures = [];
const ok = (label) => console.log(`  pass  ${label}`);
const fail = (label, detail) => {
  failures.push(label);
  console.log(`  FAIL  ${label}${detail ? `: ${detail}` : ""}`);
};

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    process.env["ProgramFiles"] ? path.join(process.env["ProgramFiles"], "Google", "Chrome", "Application", "chrome.exe") : null,
  ].filter(Boolean);
  return candidates.find((c) => existsSync(c)) ?? null;
}

async function waitForServer(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

function dumpDom(url) {
  const chrome = findChrome();
  if (!chrome) throw new Error("Chrome not found. Set CHROME_PATH env var.");
  return execFileSync(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--user-data-dir=" + path.join(ROOT, ".logs", "smoke-chrome-profile"),
    "--virtual-time-budget=8000", // let the SPA finish booting
    "--dump-dom",
    url,
  ], { timeout: 60_000, encoding: "utf8" });
}

async function main() {
  if (!existsSync(DIST)) {
    console.error("dist/ missing. Run: npm run build");
    process.exit(2);
  }

  console.log("Smoke test");
  console.log("  1. serving dist/ …");

  const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "preview", "--port", String(PORT), "--strictPort"], {
    cwd: ROOT,
    stdio: "ignore",
    detached: false,
  });
  try {
    if (!(await waitForServer(BASE + "/"))) {
      fail("preview server", "did not come up on " + BASE);
      return finish();
    }
    ok("preview server up");

    // --- 2. static and entry checks -------------------------------------
    const home = await fetch(BASE + "/").then((r) => r.text());
    home.includes("<title>L MART ONLINE")
      ? ok("home 200, title present")
      : fail("home title", "expected L MART ONLINE title");

    for (const [label, file] of [
      ["manifest.webmanifest", "manifest.webmanifest"],
      ["service worker", "sw.js"],
      ["favicon", "favicon.svg"],
    ]) {
      const res = await fetch(`${BASE}/${file}`);
      res.ok ? ok(`${label} reachable (${res.status})`) : fail(label, `HTTP ${res.status}`);
    }

    // every referenced JS/CSS asset must exist
    const assets = [...home.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
    for (const asset of assets) {
      try {
        const res = await fetch(BASE + asset);
        res.ok ? ok(`asset ${path.basename(asset)}`) : fail(`asset ${asset}`, `HTTP ${res.status}`);
      } catch (e) {
        fail(`asset ${asset}`, String(e));
      }
    }
    if (assets.length === 0) fail("dist assets", "no /assets/ links found in index.html");

    // --- 3. the SPA really boots (Chrome, JS executing) ------------------
    const dom = dumpDom(BASE + "/");
    dom.includes("L MART") && dom.length > 2000
      ? ok("home renders (JS booted)")
      : fail("home render", "page shell did not render");
    !dom.includes("Something went wrong")
      ? ok("no error-boundary fallback on home")
      : fail("home crash", "error boundary fallback visible");

    const shop = dumpDom(BASE + "/shop");
    shop.includes("product") || shop.includes("Loading")
      ? ok("shop page renders")
      : fail("shop render", "unrecognised content");

    const bad = dumpDom(BASE + "/definitely-not-a-route");
    bad.includes("page") || bad.includes("L MART")
      ? ok("unknown route handled (404 page or shell)")
      : fail("404 handling", "blank page on unknown route");
  } finally {
    server.kill();
  }

  return finish();
}

function finish() {
  console.log("");
  if (failures.length > 0) {
    console.log(`SMOKE FAILED: ${failures.length} check(s) failed. Do not deploy.`);
    process.exit(1);
  }
  console.log("SMOKE OK: deploy may proceed.");
  console.log(
    "Manual before go-live: add-to-cart click, checkout form fill, real phone,\n" +
      "and the browser console should be clean. See ROLLBACK.md / UPDATING.md.",
  );
}

main().catch((error) => {
  console.error(`SMOKE ERROR: ${error?.message ?? error}`);
  process.exit(1);
});
