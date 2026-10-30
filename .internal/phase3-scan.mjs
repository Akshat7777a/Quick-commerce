import { readdir, readFile, stat } from "node:fs/promises";
import { resolve, basename } from "node:path";

const SRC = resolve(new URL(import.meta.url).pathname.replace(/^[a-zA-Z]+:\\//, "/").replace(/\/[^/]+$/, ""), "..", "core/src").replace(/\\/+/g, "/").replace(/[\/]+$/, "/");

const EMOJI_LITERAL = /['"](?:🥬|🥛|🍋|🥕|🍞|🍪|☕|🛍️|🧼|🧴|🛒|🌾|🥖)["']|(<span[^>]*>\s*[\p{Emoji_Presentation}\p{Emoji}]+<\/span>)/u;
const GLASS = /backdrop-blur[-:]/;
const BAD_GRADIENT = /linear-gradient\(\s*#[0-9a-fA-F]{6,}/;
const EMOJI_CLASS = /(-space-x-1|rounded-full(?!.*\b(?:bg-(cream-2|cream-soft))\b))/;

const scan = async (root) => {
  const issues = [];
  const queue = [root];
  const seen = new Set();
  while (queue.length) {
    const dir = queue.shift();
    const files = await readdir(dir);
    for (const name of files) {
      if (name.startsWith(".")) continue;
      const p = resolve(dir, name);
      let s;
      try { s = await stat(p); } catch {}
      if (!s) continue;
      if (s.isDirectory()) { queue.push(p); continue; }
      const ext = (name.match(/\.[^.]+$/)?.[0] || "").toLowerCase();
      if (ext !== ".tsx" && ext !== ".ts" && ext !== ".css") continue;
      const text = await readFile(p, "utf8");
      const base = basename(p);
      for (let i = 0; i < text.length; i++) {
        if (text[i] === "—") issues.push({ file: base, line: text.slice(0, i).split("\n").length, kind: "emdash" });
      }
      if (EMOJI_LITERAL.test(text)) issues.push({ file: base, line: 1, kind: "emoji_literal" });
      if (GLASS.test(text)) issues.push({ file: base, line: 1, kind: "glass" });
      if (BAD_GRADIENT.test(text)) issues.push({ file: base, line: 1, kind: "gradient" });
      if (EMOJI_CLASS.test(text)) issues.push({ file: base, line: 1, kind: "emoji_class" });
    }
  }
  return issues;
};

const main = async () => {
  const issues = await scan(SRC);
  console.group("phase 3 scan");
  console.log("sources:", SRC);
  console.log("issues found:", issues.length);
  if (issues.length) console.log("issues:", JSON.stringify(issues, null, 2));
  console.groupEnd();

  const bad = issues.filter((i) => i.kind === "emdash" || i.kind === "emoji_literal" || i.kind === "glass" || i.kind === "gradient");
  const ok = bad.length === 0;
  console.log("verdict:", ok ? "clean" : `${bad.length} rule violations`);
  if (!ok) {
    console.log("violations:", bad.map((i) => `${i.file}:${i.line} ${i.kind}`).join("\n"));
    process.exit(1);
  }
};

main().catch((err) => { console.error(err); process.exit(1); });
