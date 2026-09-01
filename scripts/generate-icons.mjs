#!/usr/bin/env node
/**
 * Generate PWA PNG icons from public/icon.svg
 *
 * Usage: npm run icons:generate
 */

import sharp from "sharp";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const publicDir = resolve(root, "public");
const svg = readFileSync(resolve(publicDir, "icon.svg"));

const outputs = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
  { file: "favicon-32.png", size: 32 },
  { file: "favicon-16.png", size: 16 },
];

for (const { file, size } of outputs) {
  await sharp(svg).resize(size, size).png().toFile(resolve(publicDir, file));
  console.log(`Wrote public/${file} (${size}x${size})`);
}

console.log("Done.");
