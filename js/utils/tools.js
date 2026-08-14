/* =====================================================================
 * tools.js —— 通用工具函数（驼峰命名）
 * 可独立调用，无副作用，便于复用与测试
 * 依赖：CryptoJS（如需 base64/hex 等已提供独立实现，不强依赖）
 * ===================================================================== */

/* UTF-8 字节长度（中文按 3 字节计） */
function utf8ByteLength(str) {
  if (!str) return 0;
  return new TextEncoder().encode(str).length;
}

/* 字节 ↔ 16 进制 */
function bytesToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function hexToBytes(hex) {
  hex = String(hex || "").replace(/\s+/g, "");
  if (!/^[0-9a-fA-F]*$/.test(hex) || hex.length % 2 !== 0) throw new Error("非法 Hex");
  const u = new Uint8Array(hex.length / 2);
  for (let i = 0; i < u.length; i++) u[i] = parseInt(hex.substr(i * 2, 2), 16);
  return u;
}

/* 字节 ↔ Base64 */
function bytesToBase64(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function base64ToBytes(b64) {
  const bin = atob(String(b64 || "").replace(/\s+/g, ""));
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}

/* UTF-8 字符串 ↔ Base64 */
function utf8ToBase64(str) { return bytesToBase64(new TextEncoder().encode(str || "")); }
function base64ToUtf8(b64) { return new TextDecoder().decode(base64ToBytes(b64)); }

/* Unicode 转义（\uXXXX + surrogate pair） */
function unicodeEscape(str) {
  let out = "";
  for (const ch of String(str || "")) {
    const cp = ch.codePointAt(0);
    if (cp <= 0xffff) out += "\\u" + cp.toString(16).padStart(4, "0");
    else {
      const c = cp - 0x10000;
      out += "\\u" + ((c >> 10) + 0xd800).toString(16).padStart(4, "0") +
             "\\u" + ((c % 0x400) + 0xdc00).toString(16).padStart(4, "0");
    }
  }
  return out;
}
function unicodeUnescape(str) {
  return String(str || "")
    .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

/* 随机字符串生成 */
function randStr(len, pool) {
  const p = pool || "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  const u = new Uint8Array(len);
  crypto.getRandomValues(u);
  for (let i = 0; i < len; i++) out += p[u[i] % p.length];
  return out;
}

/* 对称密钥规则：AES 16/24/32、DES 8、3DES 24、其他任意 */
function symKeyRule(algo) {
  const a = String(algo || "").toUpperCase();
  if (a.startsWith("AES")) return { min: 16, recommended: [16, 24, 32] };
  if (a === "DES") return { min: 8, recommended: [8] };
  if (a === "3DES" || a === "TRIPLEDES") return { min: 24, recommended: [24] };
  return { min: 1, recommended: [] };  // 流密码任意
}

/* 哈希取数据指纹（前 N 字符） */
function previewHash(str, n) { return String(str || "").slice(0, n || 24); }

/* HTML 转义（防止注入） */
function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/* URL 参数读写 */
function readUrlParams(key) {
  try { return new URLSearchParams(location.search).get(key); } catch (e) { return null; }
}

/* 时间戳格式化（短） */
function fmtTimeShort(ts) {
  try { return new Date(ts).toISOString().slice(5, 16).replace("T", " "); } catch (e) { return ""; }
}

/* JSON 安全解析 */
function safeParse(json, fallback) {
  try { return JSON.parse(json); } catch (e) { return fallback; }
}

/* 暴露到 window.tools 命名空间（避免全局污染） */
window.tools = {
  utf8ByteLength, bytesToHex, hexToBytes,
  bytesToBase64, base64ToBytes,
  utf8ToBase64, base64ToUtf8,
  unicodeEscape, unicodeUnescape,
  randStr, symKeyRule, previewHash,
  escapeHtml, readUrlParams, fmtTimeShort, safeParse,
};