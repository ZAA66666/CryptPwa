// 轻量冒烟测试：用 Node vm 按浏览器真实顺序加载脚本（带 DOM 桩），
// 捕获“重复声明 / 加载期 ReferenceError”等拆分可能引入的问题。
import fs from "fs";
import vm from "vm";
import path from "path";

const root = "D:/Project/WorkBuddy/crypto-pwa";

function makeEl() {
  const base = {
    style: { setProperty() {}, removeProperty() {}, getPropertyValue() { return ""; } },
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    dataset: {},
    addEventListener() {}, removeEventListener() {},
    setAttribute() {}, removeAttribute() {}, hasAttribute() { return false; },
    appendChild() {}, removeChild() {}, dispatchEvent() {}, focus() {},
    querySelector() { return makeEl(); },
    querySelectorAll() { return []; },
    getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0 }; },
    value: "", textContent: "", innerHTML: "", hidden: false, checked: false, files: [],
  };
  return new Proxy(base, {
    get(t, p) {
      if (p in t) return t[p];
      if (p === "previousElementSibling" || p === "nextElementSibling" || p === "parentNode") return makeEl();
      return () => makeEl(); // 未知方法一律返回空元素，避免调用报错
    },
    set(t, p, v) { t[p] = v; return true; },
  });
}

const store = {};
const sandbox = {};
sandbox.window = sandbox;
sandbox.self = sandbox;
sandbox.addEventListener = () => {};
sandbox.removeEventListener = () => {};
sandbox.document = {
  getElementById() { return makeEl(); },
  querySelector() { return makeEl(); },
  querySelectorAll() { return []; },
  addEventListener() {}, removeEventListener() {},
  createElement() { return makeEl(); },
  body: makeEl(),
  documentElement: makeEl(),
};
sandbox.navigator = { userAgent: "node", clipboard: { writeText() { return Promise.resolve(); } }, mediaDevices: {}, share: undefined };
sandbox.localStorage = { getItem(k) { return store[k] ?? null; }, setItem(k, v) { store[k] = String(v); }, removeItem(k) { delete store[k]; } };
sandbox.location = { search: "", href: "" };
sandbox.URLSearchParams = URLSearchParams;
sandbox.MutationObserver = class { observe() {} };
sandbox.Event = class { constructor(t) { this.type = t; } };
sandbox.FileReader = class { readAsDataURL() {} };
sandbox.Blob = class {};
sandbox.setTimeout = () => 0;
sandbox.clearTimeout = () => {};
sandbox.requestAnimationFrame = () => 0;
sandbox.cancelAnimationFrame = () => {};
sandbox.getComputedStyle = () => ({ getPropertyValue: () => "" });
sandbox.crypto = { subtle: { generateKey: () => Promise.reject(new Error("mock")), exportKey: () => Promise.reject(new Error("mock")) }, getRandomValues: (a) => a };
sandbox.TextEncoder = TextEncoder; sandbox.TextDecoder = TextDecoder;
sandbox.btoa = (s) => Buffer.from(s, "binary").toString("base64");
sandbox.atob = (s) => Buffer.from(s, "base64").toString("binary");
sandbox.console = console;
sandbox.CryptoJS = new Proxy({}, { get: () => (() => ({ toString: () => "" })) });
sandbox.qrcode = () => ({ addData() {}, make() {}, createSvgTag() { return ""; } });
sandbox.JsBarcode = () => {};
sandbox.window.smCrypto = undefined;
sandbox.window.__lang = "zh";
sandbox.window.Capacitor = undefined; // 原生插件不存在时，状态栏/返回键代码应静默跳过

vm.createContext(sandbox);

const files = [
  "js/utils/i18n.js", "js/utils/tools.js",
  "js/pages/hash.js", "js/pages/enc.js", "js/pages/sym.js", "js/pages/asym.js",
  "js/pages/qr.js", "js/pages/guide.js", "js/pages/incoming.js",
  "js/pages/json.js", "js/pages/cron.js", "js/pages/rand.js", "js/pages/txt.js",
  "js/core/app.js",
  "js/core/settings.js",
];
let ok = true;
for (const f of files) {
  const code = fs.readFileSync(path.join(root, f), "utf8");
  try {
    vm.runInContext(code, sandbox, { filename: f });
    console.log("LOADED  " + f);
  } catch (e) {
    ok = false;
    console.log("ERROR   " + f + "  ->  " + e.message);
  }
}
console.log(ok ? "\nALL SCRIPTS LOADED OK" : "\nFAILURES ABOVE");
process.exitCode = ok ? 0 : 1;
