const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateFavicons() {
  const svgPath = path.join(__dirname, 'favicon.svg');
  if (!fs.existsSync(svgPath)) {
    console.error('Error: favicon.svg not found at', svgPath);
    process.exit(1);
  }

  const svg = fs.readFileSync(svgPath);

  // 1. Generate standalone PNG favicons
  // Google specifically requires multiples of 48px square (48x48, 96x96, 192x192)
  const pngOutputs = [
    { name: 'favicon-48x48.png', size: 48 },
    { name: 'favicon-96x96.png', size: 96 },
    { name: 'favicon-192x192.png', size: 192 },
    { name: 'favicon-512x512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 }
  ];

  for (const item of pngOutputs) {
    const outPath = path.join(__dirname, item.name);
    await sharp(svg, { density: Math.round(72 * (item.size / 32)) })
      .resize(item.size, item.size)
      .png()
      .toFile(outPath);
    console.log(' Generated ' + item.name + ' (' + item.size + 'x' + item.size + ')');
  }

  // 2. Generate standard multi-image favicon.ico (16, 32, 48)
  const icoSizes = [16, 32, 48];
  const icoBuffers = [];
  for (const s of icoSizes) {
    const buf = await sharp(svg, { density: Math.round(72 * (s / 32)) })
      .resize(s, s)
      .png()
      .toBuffer();
    icoBuffers.push(buf);
  }

  const count = icoBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  let offset = 6 + count * 16;
  const entries = [];
  for (let i = 0; i < count; i++) {
    const size = icoSizes[i];
    const buf = icoBuffers[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(buf.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += buf.length;
  }

  const icoBuf = Buffer.concat([header, ...entries, ...icoBuffers]);
  fs.writeFileSync(path.join(__dirname, 'favicon.ico'), icoBuf);
  console.log(' Generated favicon.ico (multi-size: 16x16, 32x32, 48x48)');
}

generateFavicons().catch(err => {
  console.error('Error generating favicons;', err);
  process.exit(1);
});