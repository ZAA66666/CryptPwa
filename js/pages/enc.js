/* =====================================================================
 * 页面：enc（从 app.js 抽离，独立成文件，便于维护）
 * 本文件只负责本页面/面板的事件绑定与算法调用。
 * 依赖全局 helper（app.js / tools.js 提供）：copyText / addHistory /
 *   maybePromptVault / toast / t / CryptoJS / sha3_512 / JsBarcode / qrcode / jsQR 等。
 * index.html 中本文件在 app.js 之前加载，函数/变量按全局作用域共享。
 * ===================================================================== */

/* ---------- 3. 编码面板（Base64 / Hex / URL） ---------- */
const encInput = document.getElementById("enc-input");
const encMethodSeg = document.getElementById("enc-method");
let encLastOp = "enc"; // 上次执行的操作：enc 编码 / dec 解码（切方式时跟随重算）

// 当前选中的编码方式：b64 / hex / url
function getEncMethod() {
  const a = encMethodSeg.querySelector("button.active");
  return a ? a.dataset.v : "b64";
}
if (encMethodSeg) {
  encMethodSeg.querySelectorAll("button").forEach((b) => {
    b.addEventListener("click", () => {
      encMethodSeg.querySelectorAll("button").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      // 已有输入时，跟随上次操作（编码/解码）自动重新计算，避免「先按编码再切方式不执行」
      if (encInput && encInput.value.trim()) encDo(encLastOp);
    });
  });
}

function bytesToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function hexToBytes(hex) {
  hex = hex.replace(/\s+/g, "");
  if (!/^[0-9a-fA-F]*$/.test(hex) || hex.length % 2 !== 0) throw new Error("非法 Hex");
  const u = new Uint8Array(hex.length / 2);
  for (let i = 0; i < u.length; i++) u[i] = parseInt(hex.substr(i * 2, 2), 16);
  return u;
}

// ===== 编码扩展：Base32 / Base58 / Unicode / JWT（纯 JS，离线可用） =====
const B32_ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32Encode(bytes) {
  let bits = 0, value = 0, out = "";
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) { out += B32_ALPHA[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32_ALPHA[(value << (5 - bits)) & 31];
  while (out.length % 8) out += "=";
  return out;
}
function base32Decode(str) {
  str = str.replace(/=+$/, "").toUpperCase().replace(/\s+/g, "");
  let bits = 0, value = 0; const out = [];
  for (const ch of str) {
    const idx = B32_ALPHA.indexOf(ch);
    if (idx === -1) throw new Error("非法 Base32 字符：" + ch);
    value = (value << 5) | idx; bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 0xff); bits -= 8; }
  }
  return new Uint8Array(out);
}
const B58_ALPHA = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function base58Encode(bytes) {
  let num = BigInt(0);
  for (const b of bytes) num = num * 256n + BigInt(b);
  let out = "";
  while (num > 0n) { const r = num % 58n; out = B58_ALPHA[Number(r)] + out; num /= 58n; }
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) out = "1" + out;   // 前导零
  return out;
}
function base58Decode(str) {
  str = str.trim();
  let num = BigInt(0);
  for (const ch of str) {
    const idx = B58_ALPHA.indexOf(ch);
    if (idx === -1) throw new Error("非法 Base58 字符：" + ch);
    num = num * 58n + BigInt(idx);
  }
  let hex = num.toString(16);
  if (hex.length % 2) hex = "0" + hex;
  const bytes = hexToBytes(hex);
  const lead = (str.match(/^1+/) || [""])[0].length;   // 前导 '1' → 前导零字节
  const out = new Uint8Array(lead + bytes.length);
  for (let i = 0; i < bytes.length; i++) out[lead + i] = bytes[i];
  return out;
}
function toUnicodeEscapes(str) {
  let out = "";
  for (const ch of str) {
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
function fromUnicodeEscapes(str) {
  return str
    .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}
function b64urlEncode(str) { return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function b64urlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return decodeURIComponent(escape(atob(str)));
}
function jwtDecode(token) {
  const parts = token.split(".");
  if (parts.length < 2) throw new Error("JWT 至少应包含 header.payload 两部分");
  const header = JSON.parse(b64urlDecode(parts[0]));
  const payload = JSON.parse(b64urlDecode(parts[1]));
  let s = "Header:\n" + JSON.stringify(header, null, 2);
  s += "\n\nPayload:\n" + JSON.stringify(payload, null, 2);
  if (parts[2]) s += "\n\nSignature (base64url):\n" + parts[2];
  return s;
}
function jwtEncode(inp) {
  const obj = JSON.parse(inp);
  let header, payload;
  if (obj && typeof obj === "object" && ("header" in obj) && ("payload" in obj)) {
    header = obj.header; payload = obj.payload;
  } else {
    header = { alg: "HS256", typ: "JWT" }; payload = obj;
  }
  return b64urlEncode(JSON.stringify(header)) + "." + b64urlEncode(JSON.stringify(payload)) + ".";
}

/* ===== 编码扩展 2：Octal / ASCII / HTML entity / UTF-16 / Roman（纯 JS，离线可用） ===== */
function toOctal(str) {
  return Array.from(str).map((ch) => {
    const cp = ch.codePointAt(0);
    return cp.toString(8).padStart(4, "0");
  }).join(" ");
}
function fromOctal(str) {
  return str.trim().split(/\s+/).map((o) => {
    if (!/^[0-7]+$/.test(o)) throw new Error("非法八进制：" + o);
    return String.fromCodePoint(parseInt(o, 8));
  }).join("");
}
function toAsciiDec(str) {
  return Array.from(str).map((ch) => ch.codePointAt(0)).join(" ");
}
function fromAsciiDec(str) {
  return str.trim().split(/[\s,]+/).map((n) => {
    if (!/^\d+$/.test(n)) throw new Error("非法十进制：" + n);
    const v = parseInt(n, 10);
    if (v > 0x10ffff) throw new Error("超出 Unicode 范围：" + n);
    return String.fromCodePoint(v);
  }).join("");
}
function htmlEntityEncode(str) {
  return str
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function htmlEntityDecode(str) {
  const ta = document.createElement("textarea");
  ta.innerHTML = str;
  return ta.value;
}
function utf16Encode(str) {
  let out = "";
  for (let i = 0; i < str.length; i++) out += "\\u" + str.charCodeAt(i).toString(16).padStart(4, "0");
  return out;
}
function utf16Decode(str) {
  return str.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}
const ROMAN_NUM = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
function toRoman(str) {
  return str.trim().split(/[\s,]+/).map((tok) => {
    if (!/^\d+$/.test(tok)) throw new Error(t("enc.romInt") + tok);
    let n = parseInt(tok, 10);
    if (n < 1 || n > 3999) throw new Error(t("enc.romRange") + tok);
    let out = "";
    for (const [v, sym] of ROMAN_NUM) { while (n >= v) { out += sym; n -= v; } }
    return out;
  }).join(" ");
}
function fromRoman(str) {
  return str.trim().split(/[\s,]+/).map((tok) => {
    const up = tok.toUpperCase();
    let n = 0, i = 0;
    for (const [v, sym] of ROMAN_NUM) {
      while (up.startsWith(sym, i)) { n += v; i += sym.length; }
    }
    if (i !== up.length) throw new Error(t("enc.romInvalid") + tok);
    if (toRoman(String(n)) !== up) throw new Error(t("enc.romInvalid") + tok);
    return String(n);
  }).join(" ");
}

// action: "enc" 编码 / "dec" 解码
function encDo(action) {
  encLastOp = action;
  const inp = encInput.value;
  const out = document.getElementById("enc-output");
  if (!inp) { out.value = ""; if (window.toast) toast(t("enc.empty")); return; }
  const method = getEncMethod(); // b64 / hex / url
  try {
    let result;
    if (action === "enc") {
      switch (method) {
        case "b64": result = utf8ToBase64(inp); break;
        case "hex": result = bytesToHex(new TextEncoder().encode(inp)); break;
        case "url": result = encodeURIComponent(inp); break;
        case "b32": result = base32Encode(new TextEncoder().encode(inp)); break;
        case "b58": result = base58Encode(new TextEncoder().encode(inp)); break;
        case "unicode": result = toUnicodeEscapes(inp); break;
        case "jwt": result = jwtEncode(inp); break;
        case "oct": result = toOctal(inp); break;
        case "ascii": result = toAsciiDec(inp); break;
        case "htmlent": result = htmlEntityEncode(inp); break;
        case "utf16": result = utf16Encode(inp); break;
        case "roman": result = toRoman(inp); break;
      }
    } else {
      switch (method) {
        case "b64": result = base64ToUtf8(inp.trim()); break;
        case "hex": result = new TextDecoder().decode(hexToBytes(inp.trim())); break;
        case "url": result = decodeURIComponent(inp.trim()); break;
        case "b32": result = new TextDecoder().decode(base32Decode(inp.trim())); break;
        case "b58": result = new TextDecoder().decode(base58Decode(inp.trim())); break;
        case "unicode": result = fromUnicodeEscapes(inp); break;
        case "jwt": result = jwtDecode(inp.trim()); break;
        case "oct": result = fromOctal(inp); break;
        case "ascii": result = fromAsciiDec(inp); break;
        case "htmlent": result = htmlEntityDecode(inp); break;
        case "utf16": result = utf16Decode(inp); break;
        case "roman": result = fromRoman(inp); break;
      }
    }
    out.value = result;
    if (!out.value.startsWith("❌")) {
      const ENC_METHODS = { b64: "Base64", hex: "Hex", url: "URL", b32: "Base32", b58: "Base58", unicode: "Unicode", jwt: "JWT", oct: "Octal", ascii: "ASCII", utf16: "UTF-16", htmlent: "HTML Entity", roman: "Roman Numerals" };
      const ENC_METHODS_ZH = { htmlent: "HTML 实体", roman: "罗马数字" };
      const methodName = (window.__lang === "zh" ? (ENC_METHODS_ZH[method] || ENC_METHODS[method]) : ENC_METHODS[method]) || method;
      addHistory({ cat: "enc", go: "enc", op: action, method: methodName, preview: inp.slice(0, 24) });
      // 编码没有密码概念，不提示保存到密码本（仅加解密相关功能才会提示）
      if (window.toast) toast(t(action === "enc" ? "enc.okEnc" : "enc.okDec"));
    }
  } catch (e) {
    out.value = t("enc.fail") + e.message;
    if (window.toast) toast(t("enc.fail") + e.message);
  }
}
document.getElementById("enc-encode").addEventListener("click", () => encDo("enc"));
document.getElementById("enc-decode").addEventListener("click", () => encDo("dec"));

// 图片 → Base64（输出 data URL，可直接用于 <img src> 或嵌入）
document.getElementById("enc-img-b64").addEventListener("click", () => {
  const file = document.getElementById("enc-file").files[0];
  const out = document.getElementById("enc-output");
  if (!file) { out.value = t("enc.noImg"); return; }
  const reader = new FileReader();
  reader.onload = () => {
    out.value = reader.result;
    addHistory({ cat: "enc", go: "enc", op: "imgb64", preview: file.name });
  };
  reader.onerror = () => { out.value = t("enc.readFail"); };
  reader.readAsDataURL(file);
});
const encOutput = document.getElementById("enc-output");
document.getElementById("enc-copy").addEventListener("click", (e) => copyText(encOutput.value, e.target));

// UTF-8 安全的 Base64（原生 btoa 只认 Latin1，不支持中文）
function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}
function base64ToUtf8(b64) {
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
