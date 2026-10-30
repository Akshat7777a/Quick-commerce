import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = resolve(import.meta.dirname ?? dirname(fileURLToPath(import.meta.url)), "../core/src");
const INDEX_CSS = resolve(SRC, "index.css");

const EMOJI_BAD = /['"](?:🥬|🥛|🍋|🥕|🍞|🍪|☕|🛍️|🧼|🧴|🛒|🌾|🥖)["']|(<span[^>]*>\s*[\p{Emoji_Presentation}\p{Emoji}]+<\/span>)/u;

const EMOJI_HIGH_CLASS = /rounded-full(?=.*bg-(cream|forest|ink|gold|clay|cream-\d))/;

const GLASS = /backdrop-blur[-:]/;

const BAD_GRADIENT = /linear-gradient\(.*#000000.*\)/;

const RUND_FILL_KIND = /(\b(?:btn|chip|input|PlaceCard|categoryCard|skeletonCard)[^{]*)?\{[\s\S]*?\b(?:rounded-full|ring-1 ring-white\/|shadow-0)/;
const RUND_KIND = /rounded-full(?!.*\b(?:chip-active|btn-primary|chip-active|chip-active|chip-active)\b)/;

const validate_tsx = async (p) => {
  const text = await readFile(p, "utf8");
  const base = basename(p);
  const lines = text.split("\n");
  const issues = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = i + 1;
    if (/—/.test(line)) issues.push({ file: base, line: lineNo, kind: "emdash", text: line.trimEnd() });
    const emojiMatch = line.match(EMOJI_BAD);
    if (emojiMatch) issues.push({ file: base, line: lineNo, kind: "emoji", text: line.trimEnd() });
    if (GLASS.test(line)) issues.push({ file: base, line: lineNo, kind: "glass", text: line.trimEnd() });
    if (BAD_GRADIENT.test(line)) issues.push({ file: base, line: lineNo, kind: "gradient", text: line.trimEnd() });
  }
  return issues;
};

const validate_css = async (p) => {
  const text = await readFile(p, "utf8");
  const base = basename(p);
  const lines = text.split("\n");
  const issues = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = i + 1;
    if (/—/.test(line)) issues.push({ file: base, line: lineNo, kind: "emdash", text: line.trimEnd() });
    if (line.match(EMOJI_BAD)) issues.push({ file: base, line: lineNo, kind: "emoji", text: line.trimEnd() });
    if (line.match(GLASS)) issues.push({ file: base, line: lineNo, kind: "glass", text: line.trimEnd() });
    if (line.match(BAD_GRADIENT)) issues.push({ file: base, line: lineNo, kind: "gradient", text: line.trimEnd() });
  }
  return issues;
};

const main = async () => {
  const files = [
    resolve(SRC, "index.css"),
  ];

  const cssIssues = await validate_css(resolve(SRC, "index.css"));
  const tsxIssues = (await Promise.all(
    (await new Bun?.file?.() ? [] : []).concat(
      ["Home.tsx", "Shop.tsx", "ProductPage.tsx", "Header.tsx", "ProductCard.tsx", "ui.tsx", "CartDrawer.tsx", "CouponCard.tsx", "BannerCarousel.tsx", "Footer.tsx", "InstallButton.tsx"]
        .map((n) => resolve(SRC, "pages/admin", n)).concat(
          ["Home.tsx", "Shop.tsx", "ProductPage.tsx", "Header.tsx", "ProductCard.tsx", "ui.tsx", "CartDrawer.tsx", "CouponCard.tsx", "BannerCarousel.tsx", "Footer.tsx", "InstallButton.tsx"]
            .map((n) => resolve(SRC, "pages", n)).concat(
              ["Home.tsx", "Shop.tsx", "ProductPage.tsx", "Header.tsx", "ProductCard.tsx", "ui.tsx", "CartDrawer.tsx", "CouponCard.tsx", "BannerCarousel.tsx", "Footer.tsx", "InstallButton.tsx"]
                .map((n) => resolve(SRC, "components", n))
            )
        )
    )
      .filter(async (p) => (await stat(p))?.isFile())
      .filter(async (p) => (await stat(p))?.isFile())
      .filter(async (p) => {
        try { return (await stat(p))?.isFile(); } catch { return false; }
      })
      .map(async (p) => ({ p, text: await readFile(p, "utf8"), base: basename(p) }))
  )).flatMap(({ p, text, base }) => {
    const lines = text.split("\n");
    const issues = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNo = i + 1;
      if (/—/.test(line)) issues.push({ file: base, line: lineNo, kind: "emdash", text: line.trimEnd() });
      const emojiMatch = line.match(EMOJI_BAD);
      if (emojiMatch) issues.push({ file: base, line: lineNo, kind: "emoji", text: line.trimEnd() });
      if (GLASS.test(line)) issues.push({ file: base, line: lineNo, kind: "glass", text: line.trimEnd() });
      if (BAD_GRADIENT.test(line)) issues.push({ file: base, line: lineNo, kind: "gradient", text: line.trimEnd() });
    }
    return issues;
  });

  const findings = [];
  for (const { file, line, kind, text } of cssIssues) findings.push(`${file}:${line} ${kind}`);
  for (let i = 0; i < tsxIssues.length; i++) findings.push(`${tsxIssues[i].file}:${tsxIssues[i].line} ${tsxIssues[i].kind}`);
  const results = { css: cssIssues, tsx: tsxIssues, total: cssIssues.length + tsxIssues.length };

  console.log(JSON.stringify({ ok: results.total === 0, results, summary: "Phase 3 rule scan completed.  " + (results.total === 0 ? "clean" : `${results.total} issues found`) }));
};

main().catch((err) => { console.error(err); process.exit(1); });
