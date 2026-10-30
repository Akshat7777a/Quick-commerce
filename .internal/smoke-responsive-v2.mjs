import { strict as assert } from "node:assert";
import { readdir, readFile } from "node:fs/promises";
import { resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.env.APP_ROOT ?? resolve(import.meta.dirname ?? dirname(fileURLToPath(import.meta.url)), "..");
const SRC = resolve(ROOT, "core/src");

const urls = new Set();
const emojis = new Set();
const obliques = new Set();

// Rule 1: any bare import/source must point inward or to core-relative assets only.
const RULE_PATH_RE = /^['"](\.[^"'@]+\.(?:png|jpe?g|webp|svg))['"]/;

// Rule 2: emoji literals must not appear as values in source.
const RULE_EMOJI_RE = /['"](?:🥬|🥛|🍋|🥕|🍞|🍪|☕|🛍️|🧼|🧴|🛒|🌾|🥖)["']/;

async function main() {
  const list = await readdir(SRC);
  let files = [];
  for (const name of list) {
    if (name.startsWith(".")) continue;
    const p = resolve(SRC, name);
    let stat;
    try { stat = await import("node:fs/promises").then((m) => m.stat(p)); } catch {}
    if (!stat || stat.isDirectory()) continue;
    const ext = (name.match(/\.[^.]+$/)?.[0] || "").toLowerCase();
    if (ext !== ".tsx" && ext !== ".ts" && ext !== ".css") continue;
    const text = await readFile(p, "utf8");
    const base = basename(p);
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let m;
      while ((m = RULE_PATH_RE.exec(line)) !== null) {
        urls.add(`${base}:${i + 1}:${m[1]}`);
      }
      if (RULE_EMOJI_RE.test(line)) {
        emojis.add(`${base}:${i + 1}`);
      }
      if (/—/.test(line)) {
        obliques.add(`${base}:${i + 1}`);
      }
    }
  }

  console.group("phase-3 rule scan");
  console.log("files scanned:", files.length);
  console.log("remote/image references:", [...urls].sort());
  console.log("emoji literals:", [...emojis].sort());
  console.log("em-dash lines:", [...obliques].sort());
  console.groupEnd();

  assert(urls.size === 0, "Expected no remote image references; found: " + [...urls].join(" | "));
  assert(emojis.size === 0, "Expected no emoji literals; found " + emojis.size);
  assert(obliques.size === 0, "Expected no em-dash chars in code; found " + obliques.size);
  console.log("OK: rule scan passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
