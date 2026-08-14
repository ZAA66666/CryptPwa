// 一次性脚本：把 app.js 里各“页面/面板”逻辑原样抽离到 js/pages/<name>.js
// 抽离后 app.js 只保留：共享 helper + 编排（面板切换/状态栏/弹窗/返回键/SW/深链）+ 初始化。
// 关键点：每个页面文件在 app.js 之前加载，函数/变量按全局作用域共享，引用关系不变。
import fs from "fs";
import path from "path";

const root = "D:/Project/WorkBuddy/crypto-pwa";
const appPath = path.join(root, "js", "app.js");
const pageDir = path.join(root, "js", "pages");
const app = fs.readFileSync(appPath, "utf8");
const lines = app.split("\n");

// [name, start, end] —— 1-indexed 闭区间，均含各自的“/* N. 面板 */”注释行
const ranges = [
  ["hash", 439, 476],
  ["enc", 478, 752],
  ["sym", 754, 1019],
  ["asym", 1021, 1502],
  ["qr", 1504, 1745],
  ["guide", 1747, 1758],
  ["incoming", 1762, 1843],
  ["json", 2119, 2321],
  ["cron", 2323, 2465],
  ["rand", 2467, 2642],
  ["txt", 2644, 2713],
];

fs.mkdirSync(pageDir, { recursive: true });
const removed = new Set();
const rangeByStart = new Map();
for (const [name, s, e] of ranges) {
  const block = lines.slice(s - 1, e).join("\n");
  const header =
    `/* =====================================================================\n` +
    ` * 页面：${name}（从 app.js 抽离，独立成文件，便于维护）\n` +
    ` * 本文件只负责本页面/面板的事件绑定与算法调用。\n` +
    ` * 依赖全局 helper（app.js / tools.js 提供）：copyText / addHistory /\n` +
    ` *   maybePromptVault / toast / t / CryptoJS / sha3_512 / JsBarcode / qrcode / jsQR 等。\n` +
    ` * index.html 中本文件在 app.js 之前加载，函数/变量按全局作用域共享。\n` +
    ` * ===================================================================== */\n\n`;
  fs.writeFileSync(path.join(pageDir, name + ".js"), header + block + "\n", "utf8");
  for (let i = s; i <= e; i++) removed.add(i);
  rangeByStart.set(s, name);
  console.log(`wrote js/pages/${name}.js  (${e - s + 1} lines)`);
}

// 重建 app.js：保留未抽离的行；被抽离区间的起始行处插入一个“已抽离”标记
const out = [];
let i = 1;
while (i <= lines.length) {
  if (removed.has(i)) {
    if (rangeByStart.has(i)) {
      const name = rangeByStart.get(i);
      out.push(`/* ▶ ${name} 页面/面板逻辑已抽离到 js/pages/${name}.js（该文件在 app.js 之前加载） */`);
    }
    i++;
    continue;
  }
  out.push(lines[i - 1]);
  i++;
}
fs.writeFileSync(appPath, out.join("\n"), "utf8");
console.log(`app.js rewritten: ${out.length} lines (was ${lines.length})`);
