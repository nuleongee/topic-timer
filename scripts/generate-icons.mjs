// PWA 아이콘 생성 스크립트
// 실행: npm i --no-save sharp png-to-ico && node scripts/generate-icons.mjs
//
// - icon.svg (투명 여백 + 라운드): macOS 독·런처·파비콘용 → pwa-*.png, favicon.ico
// - icon-square.svg (풀블리드): iOS·maskable용 → apple-touch-icon, maskable
import sharp from "sharp";
import pngToIco from "png-to-ico";
import { writeFile, unlink } from "node:fs/promises";

const pub = new URL("../public/", import.meta.url).pathname;
const rounded = `${pub}icon.svg`;
const square = `${pub}icon-square.svg`;

const render = (src, size, out) =>
  sharp(src, { density: 288 }).resize(size, size).png().toFile(`${pub}${out}`);

await render(rounded, 64, "pwa-64x64.png");
await render(rounded, 192, "pwa-192x192.png");
await render(rounded, 512, "pwa-512x512.png");
await render(square, 512, "maskable-icon-512x512.png");
await render(square, 180, "apple-touch-icon-180x180.png");

await render(rounded, 48, "favicon-tmp.png");
await writeFile(`${pub}favicon.ico`, await pngToIco([`${pub}favicon-tmp.png`]));
await unlink(`${pub}favicon-tmp.png`);

console.log("아이콘 생성 완료");
