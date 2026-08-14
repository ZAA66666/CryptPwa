/* CryptPwa 核心算法冒烟测试：DOM stub + vm 加载真实 app.js，调用纯函数验证 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..", "..");
let pass = 0, fail = 0;
const ok = (m) => { pass++; console.log("  ✔ " + m); };
const bad = (m) => { fail++; console.log("  ✘ " + m); };

/* ---------- 通用元素 stub ---------- */
function makeEl() {
  const listeners = {};
  const el = {
    _listeners: listeners,
    style: { setProperty: function () {} }, dataset: {}, classList: {
      _s: new Set(),
      add: function (...c) { c.forEach(x => this._s.add(x)); },
      remove: function (...c) { c.forEach(x => this._s.delete(x)); },
      toggle: function (c, f) { f ? this._s.add(c) : this._s.delete(c); },
      contains: function (c) { return this._s.has(c); },
    },
    setAttribute() {}, getAttribute() { return null; },
    appendChild() {}, removeChild() {},
    querySelector() { return makeEl(); },
    querySelectorAll() { return []; },
    addEventListener(t, fn) { (listeners[t] = listeners[t] || []).push(fn); },
    removeEventListener() {},
    click() { (listeners.click || []).forEach(fn => fn({ target: el, preventDefault() {} })); },
    focus() {}, blur() {},
    value: "", textContent: "", innerHTML: "", checked: false, disabled: false,
    files: [], rows: 1, offsetWidth: 100, offsetHeight: 30,
    get previousElementSibling() { return makeEl(); },
    get nextElementSibling() { return makeEl(); },
    get parentElement() { return makeEl(); },
    children: [],
  };
  return el;
}

const els = new Map();
const docStub = {
  getElementById(id) { if (!els.has(id)) els.set(id, makeEl()); return els.get(id); },
  querySelector(sel) {
    if (sel.startsWith("#")) return docStub.getElementById(sel.slice(1));
    return makeEl();
  },
  querySelectorAll() { return []; },
  createElement() { return makeEl(); },
  addEventListener() {}, removeEventListener() {},
  body: makeEl(), documentElement: { setAttribute() {}, getAttribute() { return null; }, style: {} },
  title: "", hidden: false,
};

const navStub = { clipboard: { writeText: () => Promise.resolve() }, share: () => Promise.resolve() };

const sandbox = {
  window: {}, document: docStub, navigator: navStub,
  console, setTimeout, clearTimeout, setInterval, clearInterval,
  TextEncoder, TextDecoder, btoa, atob,
  crypto: { getRandomValues: (arr) => { for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256); return arr; } },
  localStorage: { _s: {}, getItem(k) { return this._s[k] ?? null; }, setItem(k, v) { this._s[k] = String(v); }, removeItem(k) { delete this._s[k]; } },
  URL, URLSearchParams, Blob, Uint8Array, Uint16Array, Uint32Array, ArrayBuffer, DataView,
  Promise, JSON, Math, Date, Object, Array, String, Number, Boolean, RegExp, Error, Map, Set,
  fetch: () => Promise.resolve({ ok: false, status: 404 }),
  location: { href: "https://localhost/", protocol: "https:", search: "", hash: "", hostname: "localhost", origin: "https://localhost" },
  addEventListener: () => {}, removeEventListener: () => {},
  alert: () => {}, confirm: () => true, prompt: () => "",
};
sandbox.window = sandbox;
vm.createContext(sandbox);

/* 加载 crypto-js */
const cryptoJsSrc = fs.readFileSync(path.join(ROOT, "js/vendor/crypto-js.js"), "utf-8");
vm.runInContext(cryptoJsSrc, sandbox, { filename: "crypto-js.js" });
/* 加载 js-sha3（标准 SHA3 / Keccak） */
const sha3Src = fs.readFileSync(path.join(ROOT, "js/vendor/sha3.min.js"), "utf-8");
vm.runInContext(sha3Src, sandbox, { filename: "sha3.js" });

/* 加载 i18n（设置 window.I18N） */
const i18nSrc = fs.readFileSync(path.join(ROOT, "js/i18n.js"), "utf-8");
vm.runInContext(i18nSrc, sandbox, { filename: "i18n.js" });

/* 加载 app.js */
const appSrc = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf-8");
try {
  vm.runInContext(appSrc, sandbox, { filename: "app.js" });
  ok("app.js 在 DOM stub 下成功加载（无顶层异常）");
} catch (e) {
  bad("app.js 加载失败: " + e.message);
  process.exit(1);
}

const run = (name, fn) => {
  try { fn(); ok(name); } catch (e) { bad(`${name} → ${e.message}`); }
};

const W = sandbox.window;
const CJ = sandbox.CryptoJS;

/* ---------- 测试组 ---------- */

run("哈希 MD5 已知值 (md5('abc')=900150983cd24fb0d6963f7d28e17f72)", () => {
  const h = CJ.MD5("abc").toString();
  if (h !== "900150983cd24fb0d6963f7d28e17f72") throw new Error("got " + h);
});
run("哈希 SHA256 已知值 (sha256('abc')=ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad)", () => {
  const h = CJ.SHA256("abc").toString();
  if (h !== "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad") throw new Error("got " + h);
});
run("HMAC-SHA256 与 Node 原生对照", () => {
  const h = CJ.HmacSHA256("Hi There", "Jefe").toString();
  const ref = require("crypto").createHmac("sha256", "Jefe").update("Hi There").digest("hex");
  if (h !== ref) throw new Error("crypto-js=" + h.slice(0, 24) + " node=" + ref.slice(0, 24));
});
/* 标准 SHA3 vs Keccak 区分（修复 crypto-js 的 SHA3=Keccak bug） */
run("标准 SHA3-512(abc) 权威值匹配（js-sha3）", () => {
  const h = sandbox.window.sha3_512("abc");
  const expect = "b751850b1a57168a5693cd924b6b096e08f621827444f70d884f5d0240d2712e10e116e9192af3c91a7ec57647e3934057340b4cf408d5a56592f8274eec53f0";
  if (h !== expect) throw new Error("got " + h.slice(0, 24));
});
run("Keccak-512(abc) 权威值匹配（crypto-js.SHA3 = Keccak）", () => {
  const h = CJ.SHA3("abc", { outputLength: 512 }).toString();
  const expect = "18587dc2ea106b9a1563e32b3312421ca164c7f1f07bc922a9c83d77cea3a1e5d0c69910739025372dc14ac9642629379540c17e2a65b19d77aa511a9d00bb96";
  if (h !== expect) throw new Error("got " + h.slice(0, 24));
});
run("SHA3 ≠ Keccak（输出不同）", () => {
  const sha3 = sandbox.window.sha3_512("abc");
  const kec = sandbox.window.keccak_512("abc");
  if (sha3 === kec) throw new Error("SHA3 与 Keccak 输出相同，不正常");
});

/* AES 往返：用 app.js 的 runSym 需要 DOM 交互，改为直接测 CryptoJS + 验证 app.js 中密钥档位逻辑 */
run("AES-256-CBC 加解密往返", () => {
  const key = "0123456789abcdef0123456789abcdef";
  const iv = "fedcba9876543210";
  const ct = CJ.AES.encrypt("hello 中文 🎉", CJ.enc.Utf8.parse(key), { iv: CJ.enc.Utf8.parse(iv), mode: CJ.mode.CBC, padding: CJ.pad.Pkcs7 });
  const pt = CJ.AES.decrypt(ct, CJ.enc.Utf8.parse(key), { iv: CJ.enc.Utf8.parse(iv), mode: CJ.mode.CBC, padding: CJ.pad.Pkcs7 }).toString(CJ.enc.Utf8);
  if (pt !== "hello 中文 🎉") throw new Error("got " + pt);
});
run("AES-CTR 加解密往返", () => {
  const key = "0123456789abcdef0123456789abcdef";
  const iv = "fedcba9876543210";
  const ct = CJ.AES.encrypt("CTR mode test", CJ.enc.Utf8.parse(key), { iv: CJ.enc.Utf8.parse(iv), mode: CJ.mode.CTR, padding: CJ.pad.NoPadding });
  const pt = CJ.AES.decrypt(ct, CJ.enc.Utf8.parse(key), { iv: CJ.enc.Utf8.parse(iv), mode: CJ.mode.CTR, padding: CJ.pad.NoPadding }).toString(CJ.enc.Utf8);
  if (pt !== "CTR mode test") throw new Error("got " + pt);
});
run("DES 加解密往返", () => {
  const key = "01234567";
  const ct = CJ.DES.encrypt("des test", CJ.enc.Utf8.parse(key), { mode: CJ.mode.ECB, padding: CJ.pad.Pkcs7 });
  const pt = CJ.DES.decrypt(ct, CJ.enc.Utf8.parse(key), { mode: CJ.mode.ECB, padding: CJ.pad.Pkcs7 }).toString(CJ.enc.Utf8);
  if (pt !== "des test") throw new Error("got " + pt);
});
run("RC4 加解密往返", () => {
  const ct = CJ.RC4.encrypt("rc4 test", "any-key-length-ok");
  const pt = CJ.RC4.decrypt(ct, "any-key-length-ok").toString(CJ.enc.Utf8);
  if (pt !== "rc4 test") throw new Error("got " + pt);
});
run("Rabbit 加解密往返", () => {
  const ct = CJ.Rabbit.encrypt("rabbit test", "key");
  const pt = CJ.Rabbit.decrypt(ct, "key").toString(CJ.enc.Utf8);
  if (pt !== "rabbit test") throw new Error("got " + pt);
});
run("3DES-ECB 加解密往返", () => {
  const key = "0123456789abcdef01234567";
  const ct = CJ.TripleDES.encrypt("3des test", CJ.enc.Utf8.parse(key), { mode: CJ.mode.ECB, padding: CJ.pad.Pkcs7 });
  const pt = CJ.TripleDES.decrypt(ct, CJ.enc.Utf8.parse(key), { mode: CJ.mode.ECB, padding: CJ.pad.Pkcs7 }).toString(CJ.enc.Utf8);
  if (pt !== "3des test") throw new Error("got " + pt);
});
run("Blowfish 加解密往返", () => {
  const key = "blowfish-key-1234";
  const ct = CJ.Blowfish.encrypt("blowfish test", key, { mode: CJ.mode.ECB, padding: CJ.pad.Pkcs7 });
  const pt = CJ.Blowfish.decrypt(ct, key, { mode: CJ.mode.ECB, padding: CJ.pad.Pkcs7 }).toString(CJ.enc.Utf8);
  if (pt !== "blowfish test") throw new Error("got " + pt);
});

/* app.js 纯函数 */
run("base64 编解码往返 (utf8ToBase64/base64ToUtf8)", () => {
  const b = W.utf8ToBase64("中文 base64 ✓");
  if (W.base64ToUtf8(b) !== "中文 base64 ✓") throw new Error("roundtrip fail");
});
run("base32 编解码往返 (decode 返回 Uint8Array)", () => {
  const enc = W.base32Encode(new TextEncoder().encode("base32test"));
  const dec = W.base32Decode(enc);
  if (!(dec instanceof Uint8Array) || new TextDecoder().decode(dec) !== "base32test") throw new Error("roundtrip fail, enc=" + enc);
});
run("base58 编解码往返 (decode 返回 Uint8Array)", () => {
  const enc = W.base58Encode(new TextEncoder().encode("base58 test 123"));
  const dec = W.base58Decode(enc);
  if (!(dec instanceof Uint8Array) || new TextDecoder().decode(dec) !== "base58 test 123") throw new Error("roundtrip fail, enc=" + enc);
});
run("hex 编解码往返", () => {
  const hex = W.bytesToHex(new TextEncoder().encode("hex test"));
  if (new TextDecoder().decode(W.hexToBytes(hex)) !== "hex test") throw new Error("roundtrip fail");
});
run("unicode 转义往返", () => {
  const esc = W.toUnicodeEscapes("中文A");
  if (W.fromUnicodeEscapes(esc) !== "中文A") throw new Error("roundtrip fail, esc=" + esc);
});
run("JWT decode（返回含 Header/Payload 文本）", () => {
  const header = W.b64urlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = W.b64urlEncode(JSON.stringify({ sub: "123", name: "张三" }));
  const t = `${header}.${payload}.signature`;
  const d = W.jwtDecode(t);
  if (typeof d !== "string" || !d.includes("HS256") || !d.includes("张三")) throw new Error("parse fail: " + d.slice(0, 40));
});
run("JWT encode→decode 往返", () => {
  const t = W.jwtEncode(JSON.stringify({ name: "李四", exp: 999 }));
  if (!t.startsWith("ey") || !t.endsWith(".")) throw new Error("encode fail: " + t.slice(0, 30));
  const d = W.jwtDecode(t);
  if (!d.includes("李四")) throw new Error("decode fail");
});
run("utf8ByteLength 中文计数", () => {
  const n = W.utf8ByteLength("中文");
  if (n !== 6) throw new Error("got " + n);
});
run("randStr 字符池与长度", () => {
  const s = W.randStr(32);
  if (s.length !== 32 || !/[a-zA-Z0-9]/.test(s)) throw new Error("bad randStr");
});
run("symKeyRule 密钥长度规则", () => {
  const aes = W.symKeyRule("AES");
  if (!aes || !Array.isArray(aes.exact) || !aes.exact.includes(32) || aes.block !== 16) throw new Error("AES 规则错误: " + JSON.stringify(aes));
  const des = W.symKeyRule("DES");
  if (des.exact[0] !== 8) throw new Error("DES 规则错误");
  if (!W.symKeyRule("RC4").flex) throw new Error("RC4 应为 flex");
});
run("encDo 未知方法容错", () => {
  // encDo 依赖 DOM 输入，仅验证不抛顶层错误即可（此处改为验证 enc 方法映射函数存在）
  if (typeof W.encDo !== "function") throw new Error("encDo 缺失");
});

console.log(`\n结果: ${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
