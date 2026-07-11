// Renders the app icon SVG into the PNG sizes needed for PWA + iOS.
// Usage: node scripts/make-icons.mjs   (requires: npm i -D sharp)
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const svg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#0f171f"/>
  <path d="M196 108 L256 178 L316 108" stroke="#ffd451" stroke-width="30" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="92" y="182" width="328" height="228" rx="40" fill="none" stroke="#ffd451" stroke-width="30"/>
  <path d="M222 248 L318 296 L222 344 Z" fill="#ffd451"/>
</svg>`);

for (const [size, name] of [
  [512, "icon-512.png"],
  [192, "icon-192.png"],
  [180, "apple-touch-icon.png"],
  [32, "favicon-32.png"],
]) {
  const png = await sharp(svg).resize(size, size).png().toBuffer();
  writeFileSync(join(root, "public", name), png);
  console.log(`wrote public/${name}`);
}
