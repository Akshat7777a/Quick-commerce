/**
 * Generates the PWA icons for L MART from the exact favicon.svg design
 * (forest rounded square, cream "L", gold dot) using plain Node — no deps.
 *
 *   node .logs/gen-icons.mjs
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const OUT = path.resolve("public");
const BG = [16, 51, 39]; // #103327
const CREAM = [247, 244, 236]; // #F7F4EC
const GOLD = [216, 168, 75]; // #D8A84B

const L_POLY = [
  [20, 16],
  [26, 16],
  [26, 42],
  [40, 42],
  [40, 48],
  [20, 48],
];
const DOT = { x: 45, y: 45, r: 4 };

function inPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Signed distance (design units) to a rounded box centred in a 64-unit square. */
function boxDistance(x, y, size, radius) {
  const half = size / 2;
  const qx = Math.abs(x - half) - (half - radius);
  const qy = Math.abs(y - half) - (half - radius);
  return (
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius
  );
}

function renderIcon(size, { maskable }) {
  const SS = 4;
  const W = size * SS;
  const s = W / 64; // hi-res pixels per design unit
  const px = Buffer.alloc(W * W * 4);

  for (let py = 0; py < W; py++) {
    for (let pxi = 0; pxi < W; pxi++) {
      const dx = pxi / s;
      const dy = py / s;

      let sumA = 0;
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;

      for (const [ox, oy] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
        const ux = dx + ox / s;
        const uy = dy + oy / s;

        const bgAlpha = maskable ? 1 : Math.max(0, Math.min(1, 0.5 - boxDistance(ux, uy, 64, 14) * s));

        let color = BG;
        let alpha = bgAlpha;
        if (inPoly(ux, uy, L_POLY)) {
          color = CREAM;
          alpha = 1;
        } else if (Math.hypot(ux - DOT.x, uy - DOT.y) <= DOT.r) {
          color = GOLD;
          alpha = 1;
        }

        sumA += alpha;
        sumR += color[0] * alpha;
        sumG += color[1] * alpha;
        sumB += color[2] * alpha;
      }

      const a = sumA / 4;
      const idx = (py * W + pxi) * 4;
      if (a > 0) {
        px[idx] = Math.round(sumR / sumA);
        px[idx + 1] = Math.round(sumG / sumA);
        px[idx + 2] = Math.round(sumB / sumA);
        px[idx + 3] = Math.round(a * 255);
      }
    }
  }

  // Downsample the supersampled buffer to the target size.
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let a = 0, r = 0, g = 0, b = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const idx = ((y * SS + sy) * W + (x * SS + sx)) * 4;
          const pa = px[idx + 3];
          a += pa;
          r += px[idx] * pa;
          g += px[idx + 1] * pa;
          b += px[idx + 2] * pa;
        }
      }
      const n = SS * SS;
      const o = (y * size + x) * 4;
      out[o + 3] = Math.round(a / n);
      if (a > 0) {
        out[o] = Math.round(r / a);
        out[o + 1] = Math.round(g / a);
        out[o + 2] = Math.round(b / a);
      }
    }
  }
  return out;
}

/* ------------------------------------------------------------------ PNG --- */
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function write(name, size, opts) {
  const file = path.join(OUT, name);
  fs.writeFileSync(file, encodePng(size, size, renderIcon(size, opts)));
  const kb = (fs.statSync(file).size / 1024).toFixed(1);
  console.log(`  ${name.padEnd(26)} ${size}x${size}  ${kb} KB`);
}

console.log("Generating PWA icons…");
write("icon-192.png", 192, { maskable: false });
write("icon-512.png", 512, { maskable: false });
write("icon-maskable-192.png", 192, { maskable: true });
write("icon-maskable-512.png", 512, { maskable: true });
write("apple-touch-icon.png", 180, { maskable: true });
console.log("Done.");
