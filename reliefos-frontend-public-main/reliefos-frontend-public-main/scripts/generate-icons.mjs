import fs from 'fs';
import zlib from 'zlib';

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[i] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([len, typeAndData, crc]);
}

function createPng(size, r = 15, g = 23, b = 42) {
  // 1. Signature
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // 2. IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // 3. Raw image scanlines
  const raw = Buffer.alloc(size * (size * 4 + 1));
  let offset = 0;
  const center = size / 2;
  const radius = size * 0.38;

  for (let y = 0; y < size; y++) {
    raw[offset++] = 0; // filter type None
    for (let x = 0; x < size; x++) {
      // Distance from center for rounded emblem
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Emblem: circle with inner cross / shield
      if (dist < radius) {
        // Red/Orange Dark Zone accent in center
        if (Math.abs(dx) < size * 0.08 || Math.abs(dy) < size * 0.08) {
          raw[offset++] = 239; // Red 239, 68, 68
          raw[offset++] = 68;
          raw[offset++] = 68;
          raw[offset++] = 255;
        } else {
          // White shield inner
          raw[offset++] = 255;
          raw[offset++] = 255;
          raw[offset++] = 255;
          raw[offset++] = 255;
        }
      } else {
        // Navy background #0F172A
        raw[offset++] = r;
        raw[offset++] = g;
        raw[offset++] = b;
        raw[offset++] = 255;
      }
    }
  }

  // 4. Deflate
  const compressed = zlib.deflateSync(raw);
  const idatChunk = makeChunk('IDAT', compressed);

  // 5. IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// Generate 192x192 and 512x512
const png192 = createPng(192);
fs.writeFileSync('public/icon-192.png', png192);
console.log('Generated public/icon-192.png, size:', png192.length);

const png512 = createPng(512);
fs.writeFileSync('public/icon-512.png', png512);
console.log('Generated public/icon-512.png, size:', png512.length);
