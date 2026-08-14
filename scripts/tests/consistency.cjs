/* CryptPwa 静态一致性测试：
 * 1. 所有 js 语法检查（先由外部 node --check 完成）
 * 2. i18n zh/en 键对齐
 * 3. HTML 中 data-i18n 键必须存在于 i18n
 * 4. JS 中 document.getElementById / querySelector('#id') 引用的 id 必须存在于 index.html
 * 5. sw.js ASSETS 缓存清单 vs 实际文件
 * 6. HTML 引用的本地资源文件存在
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
let pass = 0, fail = 0;
const ok = (m) => { pass++; console.log("  ✔ " + m); };
const bad = (m) => { fail++; console.log("  ✘ " + m); };

const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf-8");

/* ---- 2. i18n 键对齐 ---- */
global.window = {};
require(path.join(ROOT, "js/i18n.js"));
const zh = global.window.I18N.zh, en = global.window.I18N.en;
const zhKeys = Object.keys(zh), enKeys = Object.keys(en);
const missingEn = zhKeys.filter(k => !(k in en));
const missingZh = enKeys.filter(k => !(k in zh));
if (!missingEn.length && !missingZh.length) ok(`i18n 键对齐（zh=${zhKeys.length} / en=${enKeys.length}）`);
else bad(`i18n 键不一致: en缺=${missingEn.join(",")||"无"} zh缺=${missingZh.join(",")||"无"}`);

/* ---- 3. HTML data-i18n 键存在性 ---- */
const html = read("index.html");
const htmlKeys = [...new Set([...html.matchAll(/data-i18n(?:-attr)?="(?:[a-zA-Z]+:)?([a-zA-Z0-9.]+)"/g)].map(m => m[1]))];
const badHtml = htmlKeys.filter(k => !(k in zh) && !(k in en));
if (!badHtml.length) ok(`HTML data-i18n ${htmlKeys.length} 个键全部存在`);
else bad(`HTML 引用不存在的 i18n 键: ${badHtml.join(",")}`);

/* ---- 4. JS 引用的 id 存在性 ---- */
const idsInHtml = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
const jsFiles = ["js/app.js", "js/settings.js", "js/i18n.js"];
const missingIds = [];
for (const f of jsFiles) {
  const src = read(f);
  const refs = [
    ...[...src.matchAll(/getElementById\("([^"]+)"\)/g)].map(m => m[1]),
    ...[...src.matchAll(/\$\("([^"]+)"\)/g)].map(m => m[1]),
  ];
  for (const id of new Set(refs)) {
    /* 动态渲染：settings.js 用 innerHTML 模板/ensureEl 创建的子页元素；app.js toast 动态建 #app-toast */
    const isDynamic = src.includes(`id="${id}"`) || src.includes(`ensureEl("${id}"`) || src.includes(`el.id = "${id}"`);
    if (!idsInHtml.has(id) && !isDynamic) missingIds.push(`${f} → #${id}`);
  }
}
if (!missingIds.length) ok(`JS 引用的全部 id 均存在于 index.html`);
else bad(`JS 引用了不存在的 id:\n    ${missingIds.join("\n    ")}`);

/* ---- 5. sw.js ASSETS ---- */
const sw = read("sw.js");
const assetsSeg = sw.match(/ASSETS\s*=\s*\[([\s\S]*?)\]/);
const assets = assetsSeg
  ? [...assetsSeg[1].matchAll(/"([^"]+)"/g)].map(m => m[1])
  : [...sw.matchAll(/"([^"]+)"/g)].map(m => m[1]).filter(a => !a.startsWith("http") && !["install", "activate", "fetch", "GET"].includes(a));
const missingFiles = assets.filter(a => !fs.existsSync(path.join(ROOT, a)));
if (!missingFiles.length) ok(`sw.js 缓存清单 ${assets.length} 项全部存在`);
else bad(`sw.js 缓存清单缺文件: ${missingFiles.join(",")}`);

/* ---- 6. HTML 本地资源存在性 ---- */
const localRefs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1]).filter(r => !/^(https?:|data:|#|manifest)/.test(r));
const missingRes = localRefs.filter(r => !fs.existsSync(path.join(ROOT, r)));
if (!missingRes.length) ok(`HTML 引用本地资源 ${localRefs.length} 项全部存在`);
else bad(`HTML 资源缺失: ${missingRes.join(",")}`);

console.log(`\n结果: ${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
