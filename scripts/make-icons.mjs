// Generates the PWA icons (orange speech-bubble "NL" mark) as PNGs, no dependencies.
// Run: node scripts/make-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

const BRAND = [0xe8, 0x59, 0x0c];
const WHITE = [0xff, 0xff, 0xff];

// --- minimal PNG encoder (truecolor) ---
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};
function png(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    pixels.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

// --- drawing ---
function makeCanvas(size, color) {
  const px = Buffer.alloc(size * size * 3);
  for (let i = 0; i < size * size; i++) px.set(color, i * 3);
  return px;
}
const put = (px, size, x, y, color) => {
  if (x >= 0 && y >= 0 && x < size && y < size) px.set(color, (y * size + x) * 3);
};
function fillRoundedRect(px, size, x0, y0, x1, y1, r, color) {
  for (let y = Math.round(y0); y < y1; y++) {
    for (let x = Math.round(x0); x < x1; x++) {
      const cx = Math.max(x0 + r, Math.min(x1 - r, x + 0.5));
      const cy = Math.max(y0 + r, Math.min(y1 - r, y + 0.5));
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= r * r) put(px, size, x, y, color);
    }
  }
}
/** downward-pointing tail: triangle from (x0,y) to (x1,y) apex at (xa,ya) */
function fillTail(px, size, x0, x1, y, xa, ya, color) {
  const h = Math.round(ya - y);
  for (let row = 0; row < h; row++) {
    const t = row / h;
    const left = Math.round(x0 + (xa - x0) * t);
    const right = Math.round(x1 + (xa - x1) * t);
    for (let x = left; x <= right; x++) put(px, size, x, Math.round(y) + row, color);
  }
}

/* 5x7 pixel letters */
const GLYPHS = {
  N: ['X...X', 'XX..X', 'X.X.X', 'X.X.X', 'X..XX', 'X...X', 'X...X'],
  L: ['X....', 'X....', 'X....', 'X....', 'X....', 'X....', 'XXXXX']
};
function drawText(px, size, text, cx, cy, cell, color) {
  const cols = text.length * 5 + (text.length - 1);
  const x0 = Math.round(cx - (cols * cell) / 2);
  const y0 = Math.round(cy - (7 * cell) / 2);
  let colOff = 0;
  for (const ch of text) {
    const g = GLYPHS[ch];
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 5; c++) {
        if (g[r][c] === 'X') {
          for (let yy = 0; yy < cell; yy++)
            for (let xx = 0; xx < cell; xx++)
              put(px, size, x0 + (colOff + c) * cell + xx, y0 + r * cell + yy, color);
        }
      }
    }
    colOff += 6;
  }
}

/** the mark: white speech bubble with orange NL, on brand orange */
function drawMark(px, size, ox, oy, s) {
  const bx0 = ox + s * 0.14;
  const bx1 = ox + s * 0.86;
  const by0 = oy + s * 0.18;
  const by1 = oy + s * 0.68;
  const r = s * 0.12;
  fillRoundedRect(px, size, bx0, by0, bx1, by1, r, WHITE);
  // tail: right triangle, straight left edge, hypotenuse back up to the bubble
  fillTail(px, size, ox + s * 0.28, ox + s * 0.48, by1 - 1, ox + s * 0.28, oy + s * 0.82, WHITE);
  const cell = Math.max(1, Math.round(s * 0.045));
  drawText(px, size, 'NL', (bx0 + bx1) / 2, (by0 + by1) / 2, cell, BRAND);
}

function icon(size) {
  const px = makeCanvas(size, BRAND);
  drawMark(px, size, 0, 0, size);
  return png(size, px);
}
function maskableIcon(size) {
  const px = makeCanvas(size, BRAND);
  const s = Math.round(size * 0.78);
  const o = Math.round((size - s) / 2);
  drawMark(px, size, o, o, s);
  return png(size, px);
}

writeFileSync(join(outDir, 'icon-192.png'), icon(192));
writeFileSync(join(outDir, 'icon-512.png'), icon(512));
writeFileSync(join(outDir, 'icon-maskable-512.png'), maskableIcon(512));
writeFileSync(join(outDir, 'apple-touch-icon.png'), icon(180));

/* favicon: same mark as crisp SVG */
const cell = 3.2;
const rects = [];
{
  const cols = 11;
  const x0 = 50 - (cols * cell) / 2;
  const y0 = 43 - (7 * cell) / 2;
  let colOff = 0;
  for (const ch of 'NL') {
    const g = GLYPHS[ch];
    for (let r = 0; r < 7; r++)
      for (let c = 0; c < 5; c++)
        if (g[r][c] === 'X')
          rects.push(
            `<rect x="${(x0 + (colOff + c) * cell).toFixed(1)}" y="${(y0 + r * cell).toFixed(1)}" width="${cell}" height="${cell}" fill="#E8590C"/>`
          );
    colOff += 6;
  }
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<rect width="100" height="100" rx="24" fill="#E8590C"/>
<path d="M22 18 h56 a10 10 0 0 1 10 10 v30 a10 10 0 0 1 -10 10 H46 l-16 16 v-16 h-8 a10 10 0 0 1 -10 -10 V28 a10 10 0 0 1 10 -10 z" fill="#fff" transform="scale(0.86) translate(8,4)"/>
${rects.join('\n')}
</svg>`;
writeFileSync(join(outDir, 'favicon.svg'), svg);

console.log('icons written to', outDir);
