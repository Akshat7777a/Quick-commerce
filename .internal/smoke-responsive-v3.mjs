import { strict as assert } from "node:assert";
import { readdir, readFile, stat } from "node:fs/promises";
import { resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.env.APP_ROOT ?? resolve(import.meta.dirname ?? dirname(fileURLToPath(import.meta.url)), "..");
const SRC = resolve(ROOT, "core/src");

const urls = new Set();
const emojis = new Set();
const obliques = new Set();

const RULE_PATH_RE = /^['"](\.[^"'@]+\.(?:png|jpe?g|webp|svg))['"]/;
const RULE_EMOJI_RE = /['"](?:🥬|🥛|🍋|🥕|🍞|🍪|☕|🛍️|🧼|🧴|🛒|🌾|🥖)["']/;

async function collect(dir) {
  const list = await readdir(dir);
  let result = [];
  for (const name of list) {
    if (name.startsWith(".")) continue;
    const p = resolve(dir, name);
    let s;
    try { s = await stat(p); } catch {}
    if (!s) continue;
    if (s.isDirectory()) {
      result.push(...(await collect(p)));
      continue;
    }
    const ext = (name.match(/\.[^.]+$/)?.[0] || "").toLowerCase();
    if (ext !== ".tsx" && ext !== ".ts" && ext !== ".css") continue;
    result.push(p);
  }
  return result;
}

async function main() {
  const files = await collect(SRC);
  for (const p of files) {
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
