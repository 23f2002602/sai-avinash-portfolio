import sharp from 'sharp';
import { readdir, mkdir } from 'node:fs/promises';

// Local review artifact only; never modifies source or public assets.
const items = [];
for (const group of ['interests', 'theme']) {
  for (const name of await readdir(`output/imagegen/${group}`)) {
    if (name.endsWith('.png') && !name.endsWith('-chroma.png')) items.push({ group, name });
  }
}
const tileWidth = 360, tileHeight = 250, columns = 4;
const layers = [];
for (const [index, item] of items.entries()) {
  const background = index % 2 ? '#fff1d8' : '#182c47';
  const raster = await sharp(`output/imagegen/${item.group}/${item.name}`)
    .resize(340, 210, { fit: 'contain', background }).flatten({ background }).png().toBuffer();
  const left = (index % columns) * tileWidth, top = Math.floor(index / columns) * tileHeight;
  layers.push({ input: raster, left: left + 10, top });
  layers.push({ input: Buffer.from(`<svg width="360" height="30"><text x="12" y="20" fill="#fff1d8" font-family="sans-serif" font-size="16">${item.group}/${item.name}</text></svg>`), left, top: top + 215 });
}
await mkdir('output/imagegen/review', { recursive: true });
await sharp({ create: { width: columns * tileWidth, height: Math.ceil(items.length / columns) * tileHeight, channels: 3, background: '#182c47' } })
  .composite(layers).png().toFile('output/imagegen/review/contact-sheet.png');
console.log(`Reviewed ${items.length} cutouts: output/imagegen/review/contact-sheet.png`);
