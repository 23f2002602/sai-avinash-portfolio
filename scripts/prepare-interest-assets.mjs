import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const allNames = ['tech', 'business', 'editing', 'design', 'photo', 'video', 'writing', 'cooking', 'travel', 'finance', 'economics'];
const names = process.argv.length > 2 ? process.argv.slice(2) : allNames;
if (names.some(name => !allNames.includes(name))) throw new Error('Unknown interest asset');
await mkdir('public/interests-3d', { recursive: true });
for (const name of names) {
  const source = `output/imagegen/interests/${name}.png`;
  const metadata = await sharp(source).metadata();
  if (!metadata.hasAlpha || metadata.width !== 3840 || metadata.height !== 2160) {
    throw new Error(`${name}: expected transparent 3840×2160 PNG`);
  }
  const alphaPlane = await sharp(source).extractChannel('alpha').toBuffer();
  const alpha = await sharp(alphaPlane).stats();
  if (alpha.channels[0].min !== 0 || alpha.channels[0].max !== 255) {
    throw new Error(`${name}: missing transparent or fully opaque pixels`);
  }
  await sharp(source).webp({ quality: 92, alphaQuality: 100, effort: 6 }).toFile(`public/interests-3d/${name}.webp`);
}
