import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';

const dir = 'com.luna.sheets-text.sdPlugin/images';
mkdirSync(dir, { recursive: true });

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

// Dessine une feuille de tableur verte sur fond sombre
function png(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const m = Math.round(size * 0.16);
  const cols = 3, rows = 4;
  const gw = size - 2 * m, gh = size - 2 * m;
  const line = Math.max(1, Math.round(size / 40));
  for (let y = 0; y < size; y++) {
    const o = y * (size * 4 + 1);
    raw[o] = 0;
    for (let x = 0; x < size; x++) {
      let px = [24, 28, 36, 255];
      const inside = x >= m && x < size - m && y >= m && y < size - m;
      if (inside) {
        px = [255, 255, 255, 255];
        const lx = x - m, ly = y - m;
        const onV = [...Array(cols + 1).keys()].some(i => Math.abs(lx - Math.round(i * gw / cols)) < line);
        const onH = [...Array(rows + 1).keys()].some(i => Math.abs(ly - Math.round(i * gh / rows)) < line);
        if (onV || onH) px = [15, 157, 88, 255];
        else if (ly < gh / rows) px = [15, 157, 88, 255];
      }
      const p = o + 1 + x * 4;
      raw[p] = px[0]; raw[p + 1] = px[1]; raw[p + 2] = px[2]; raw[p + 3] = px[3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const [name, size] of [['plugin', 256], ['plugin@2x', 512]]) {
  writeFileSync(`${dir}/${name}.png`, png(size));
}
console.log('Icônes PNG générées');
