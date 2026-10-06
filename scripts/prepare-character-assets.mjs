import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

await mkdir('public/avinash-3d', { recursive: true });
for (const pose of ['wave', 'hold', 'open', 'sip', 'enjoy', 'grind', 'coffee']) {
  const source = `output/imagegen/${pose}.png`;
  const metadata = await sharp(source).metadata();
  if (!metadata.hasAlpha || metadata.width !== 1536 || metadata.height !== 2048) {
    throw new Error(`${pose}: expected transparent 1536×2048 PNG`);
  }
  await sharp(source).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(`public/avinash-3d/${pose}.webp`);
}
