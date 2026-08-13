// 把网页资源收集到 webapp/（Capacitor 的 webDir），供安卓打包使用
// 用法：node scripts/sync-web.mjs   （或 npm run sync）
import { cpSync, rmSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const web = resolve(root, "webapp");
const items = [
  "index.html",
  "css",
  "js",
  "icons",
  "manifest.webmanifest",
  "manifest-en.webmanifest",
  "sw.js",
];

rmSync(web, { recursive: true, force: true });
mkdirSync(web, { recursive: true });
for (const it of items) {
  cpSync(resolve(root, it), resolve(web, it), { recursive: true });
}
console.log("[sync-web] OK → webapp/ :", items.join(", "));
