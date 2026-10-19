import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const W = 851;
const H = 315;
const aiBasePath =
  'C:/Users/Neo/.cursor/projects/c-Users-Neo-CMSMuBreda/assets/facebook-cover-mubreda-v4.png';
const outPath = path.join(root, 'public/assets/facebook-cover-mubreda.png');

// Keep the cinematic scene; crop to FB size from the vertical center (safe band)
const meta = await sharp(aiBasePath).metadata();
const targetRatio = W / H;
const srcRatio = meta.width / meta.height;

let extract;
if (srcRatio > targetRatio) {
  // source too wide — crop sides
  const newW = Math.round(meta.height * targetRatio);
  extract = {
    left: Math.round((meta.width - newW) / 2),
    top: 0,
    width: newW,
    height: meta.height,
  };
} else {
  // source too tall — crop top/bottom, keep middle
  const newH = Math.round(meta.width / targetRatio);
  extract = {
    left: 0,
    top: Math.round((meta.height - newH) / 2),
    width: meta.width,
    height: newH,
  };
}

await sharp(aiBasePath)
  .extract(extract)
  .resize(W, H, { fit: 'fill' })
  .png()
  .toFile(outPath);

console.log(JSON.stringify({ extract, out: { width: W, height: H }, outPath }));
