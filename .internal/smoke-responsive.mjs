import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { resolve, dirname, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";

import { readdir } from "node:fs/promises";

const ROOT = process.env.APP_ROOT ?? dirname(dirname(fileURLToPath(import.meta.url)));
const SRC = resolve(ROOT, "core/src");

const RULE_PATH_RE = /^\s*(from|import)\s+["']([^"'@.+]+\.(?:png|jpe?g|webp))["']/;
const RULE_EMOJI_CHEAT = /\p{Emoji_Presentation}|\p{Emoji}\s*(?==)|["'](?:🥬|🥛|🍋|🥕|🍞|🍪|☕|🛍️|🧼|🧴|🛒|🌾|🥖)(?:[^"' ]|$)/u;
const RULE_EMBASH = /[^\u2014]-/; /* placeholder, em-dash rule checked below */

const urls = new Set();
const emojis = new Set();
const obliques = new Set();

function walk(entries) {
  for (const entry of entries) {
    const { name, path: p, isDirectory } = entry;
    if (name === "node_modules" || name.startsWith(".")) continue;
    if (isDirectory) {
      const children = readdir(p);
      entries.push({ name, path: p, isDirectory: false });
      entries.push(...children);
      continue;
    }
    const ext = extname(name).toLowerCase();
    if (ext !== ".tsx" && ext !== ".ts" && ext !== ".css") continue;
    entries.push({ name, path: p, isDirectory: false });
  }
}

async function main() {
  const entries = [];
  const dir = await readdir(SRC).then((list) => list.map((f) => ({ name: f, path: resolve(SRC, f) })));
  entries.push(...dir);
  const kept = entries.filter((e) => !e.name.startsWith("."));
  entries.push(...kept);

  const suspense = Promise.all(
    entries
      .map(({ path: p }) => {
        const ext = extname(p).toLowerCase();
        if (ext !== ".tsx" && ext !== ".ts" && ext !== ".css") return;
        return readFile(p, "utf8").then((text) => {
          const name = basename(p);
          return { p, text, name, ext };
        });
      })
      .filter(Boolean)
  );

  const files = await suspense;

  for (const { p, text, name, ext } of files) {
    if (name.startsWith(".")) continue;
    // URL rule
    let m;
    while ((m = RULE_PATH_RE.exec(text)) !== null) {
      urls.add(m[2]);
    }
    // emoji cheat rule
    let ec;
    while ((ec = RULE_EMOJI_CHEAT.exec(text)) !== null) {
      emojis.add({ file: name, match: ec[0], line: text.slice(0, ec.index).split("\n").length });
    }
    // em-dash rule (emdash char anywhere in bare code text is prohibited)
    if (/—/.test(text)) {
      obliques.add(name);
    }
  }

  console.group("phase-3 rule scan");
  console.log("files scanned:", files.length);
  console.log("off-site image references:", [...urls].sort());
  console.log("emoji found in code:", [...emojis].map((e) => `${e.file}: ${e.match} @L${e.line}`).sort());
  console.log("em-dash chars in source:", [...obliques].sort());
  console.groupEnd();

  assert(urls.size === 0, "Expected no remote image references; found: " + [...urls].join(", "));
  assert(emojis.size === 0, "Expected no emoji in code; found " + emojis.size);
  assert(obliques.size === 0, "Expected no em-dash chars in code; found " + obliques.size);
  console.log("OK: rule scan passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
