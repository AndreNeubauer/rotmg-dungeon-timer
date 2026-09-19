#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");
mkdirSync(publicDir, { recursive: true });

const files = [
  "dungeons.json",
  "exalt-backgrounds.json",
  "wr-times.json",
  "leaderboard-config.json",
  "leaderboard-config.example.json",
  "runs.json.example",
];

for (const file of files) {
  const src = join(root, file);
  if (!existsSync(src)) continue;
  copyFileSync(src, join(publicDir, file));
  console.log(`sync-public-data: ${file} → public/`);
}
