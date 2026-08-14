// 扫描项目中所有 t("key") / data-i18n / data-i18n-attr 引用，
// 并对比 i18n.js 的 zh / en 字典，找出缺失/不对称 key。
// 改进：keysOf 同时支持「带引号键」("tab.home":) 与「裸键」(appTitle:)。
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const root = process.cwd();
const EXCLUDE = new Set(["node_modules", "webapp", "android", ".git"]);
const SRC_EXT = [".js", ".html", ".mjs"];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (EXCLUDE.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (SRC_EXT.includes(p.slice(p.lastIndexOf(".")))) out.push(p);
  }
  return out;
}

const files = walk(root);
const used = new Set();
const usedRe = /(?:^|[^.\w])t\(\s*["']([A-Za-z][\w.]*?)["']\s*\)/g;
const dataRe = /data-i18n(?:-attr)?="([^"]+)"/g;
for (const f of files) {
  let s;
  try { s = readFileSync(f, "utf8"); } catch { continue; }
  let m;
  while ((m = usedRe.exec(s))) used.add(m[1]);
  while ((m = dataRe.exec(s))) {
    m[1].split(",").forEach((part) => {
      const col = part.indexOf(":");
      const key = (col >= 0 ? part.slice(col + 1) : part).trim();
      if (/^[A-Za-z][\w.]*$/.test(key)) used.add(key);
    });
  }
}

// 解析 i18n.js 的 zh / en 块
const i18n = readFileSync(join(root, "js/utils/i18n.js"), "utf8");
const zhStart = i18n.indexOf("window.I18N = {");
const enMarker = i18n.indexOf("\n  en: {", zhStart);
const zhBlock = i18n.slice(zhStart, enMarker);
const enBlock = i18n.slice(enMarker);

// 同时支持带引号键与裸键；要求值是字符串（冒号后跟 "），排除嵌套对象/数字。
function keysOf(block) {
  const set = new Set();
  const re = /(?:^|[{,]\s*|\n\s*)(["']?)([A-Za-z_$][\w.]*)\1\s*:\s*"/gm;
  let m;
  while ((m = re.exec(block))) set.add(m[2]);
  return set;
}
const zh = keysOf(zhBlock);
const en = keysOf(enBlock);
const keep = (arr) => arr.filter((k) => !/^(li|b|div|span|br|p|ul|ol|table|tr|td|th|input|button|img|a|h\d|small|strong|em|code|pre)$/.test(k));

const missingBoth = [...used].filter((k) => !zh.has(k) && !en.has(k));
const zhNotEn = [...used].filter((k) => zh.has(k) && !en.has(k));   // 英文态会显示中文或 key
const enNotZh = [...used].filter((k) => en.has(k) && !zh.has(k));   // 中文态会显示英文或 key
// 字典整体不对称（含未使用键，供「收齐」参考，已过滤 HTML 标签噪声）
const dictZhNotEn = keep([...zh].filter((k) => !en.has(k)));
const dictEnNotZh = keep([...en].filter((k) => !zh.has(k)));

console.log("== 扫描文件数:", files.length);
console.log("== 使用中的 key 数:", used.size, "| zh:", zh.size, "| en:", en.size);
console.log("\n[1] 缺失（zh/en 都没有，t() 会回退成 key 字面量）:", missingBoth.length);
console.log(missingBoth.join("\n"));
console.log("\n[2] 用了但只有中文（英文态会显示中文或 key）—— 翻译缺口:", zhNotEn.length);
console.log(zhNotEn.join("\n"));
console.log("\n[3] 用了但只有英文（中文态会显示英文或 key）:", enNotZh.length);
console.log(enNotZh.join("\n"));
console.log("\n[4] 字典整体：中文有/英文无（含未使用，已过滤标签）:", dictZhNotEn.length);
console.log(dictZhNotEn.join("\n"));
console.log("\n[5] 字典整体：英文有/中文无（含未使用，已过滤标签）:", dictEnNotZh.length);
console.log(dictEnNotZh.join("\n"));
