import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

await mkdir('public/theme-3d', { recursive: true });
for (const name of ['headphones', 'tuning-dial', 'beans', 'brew', 'milk', 'stir']) {
  const source = `output/imagegen/theme/${name}.png`;
  const metadata = await sharp(source).metadata();
  if (!metadata.hasAlpha || metadata.width !== 2048 || metadata.height !== 2048) {
    throw new Error(`${name}: expected transparent 2048×2048 PNG`);
  }
  const alphaPlane = await sharp(source).extractChannel('alpha').toBuffer();
  const alpha = await sharp(alphaPlane).stats();
  if (alpha.channels[0].min !== 0 || alpha.channels[0].max !== 255) throw new Error(`${name}: missing transparent/opaque pixels`);
  await sharp(source).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(`public/theme-3d/${name}.webp`);
}
