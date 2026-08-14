/* =====================================================================
 * 设置模块：主题 / 语言 / 字体 / 沉浸式 / 常用密码 / 关于·隐私·协议等
 * 依赖：i18n.js（window.I18N / t / applyLang）、app.js（renderHistory 全局）
 * ===================================================================== */
(function () {
  "use strict";

  /* ---------- 本地存储小工具 ---------- */
  function getSetting(name, def) {
    try { const v = localStorage.getItem("set_" + name); return v === null ? def : v; } catch (e) { return def; }
  }
  function setSetting(name, val) {
    try { localStorage.setItem("set_" + name, val); } catch (e) {}
  }
  /* ---------- 加密保险库（常用密码密文存储） ----------
     格式（JSON）：
       { v:1, alg:"AES-256-CBC", salt:"hex(16B)", iv:"hex(16B)", ct:"base64" }
     - 密钥由主密码经 PBKDF2 派生（10000 次，256bit），不存明文主密码
     - sessionMaster 仅存于内存，关闭页面即清空；本地只留密文 */
  const C = window.CryptoJS;
  const VAULT_KEY = "set_vault";
  const PLAIN_KEY = "set_vault_plain"; // 关闭数据加密时的明文存储键
  const PBKDF2_ITER = 10000;
  let sessionMaster = null; // 仅内存：解锁后的主密码
  /* 数据加密开关（默认开启）：开启=主密码+AES 密文存储；关闭=明文存储无需主密码 */
  function dataEncEnabled() { return localStorage.getItem("set_data_enc") !== "0"; }
  function setDataEnc(on) { localStorage.setItem("set_data_enc", on ? "1" : "0"); }
  /* 密码本 3 套密码库：当前库号（0/1/2），localStorage 记忆；条目带 slot 字段归属 */
  let vaultSlot = parseInt(localStorage.getItem("set_vault_slot") || "0", 10) || 0;
  function setVaultSlot(n) {
    vaultSlot = Math.max(0, Math.min(2, n | 0));
    localStorage.setItem("set_vault_slot", String(vaultSlot));
  }
  function inSlot(p) { return (p.slot || 0) === vaultSlot; }
  /* 已导入的语言包（{ lang: name }），localStorage 持久化 */
  function importedLangs() {
    try { return JSON.parse(localStorage.getItem("set_imported_langs") || "{}") || {}; }
    catch (e) { return {}; }
  }
  function saveImportedLangs(o) { localStorage.setItem("set_imported_langs", JSON.stringify(o)); }

  function vaultExists() {
    return dataEncEnabled() ? !!localStorage.getItem(VAULT_KEY) : !!localStorage.getItem(PLAIN_KEY);
  }
  function isLocked() { return dataEncEnabled() && vaultExists() && !sessionMaster; }

  function deriveKey(master, salt) {
    return C.PBKDF2(master, salt, { keySize: 256 / 32, iterations: PBKDF2_ITER });
  }
  function encryptVault(arr, master) {
    const salt = C.lib.WordArray.random(16);
    const iv = C.lib.WordArray.random(16);
    const key = deriveKey(master, salt);
    const ct = C.AES.encrypt(JSON.stringify(arr), key, {
      iv: iv, mode: C.mode.CBC, padding: C.pad.Pkcs7,
    }).toString();
    return JSON.stringify({ v: 1, alg: "AES-256-CBC", salt: salt.toString(), iv: iv.toString(), ct: ct });
  }
  function decryptVault(blob, master) {
    const o = JSON.parse(blob);
    if (!o || o.v !== 1 || !o.ct) throw new Error("格式错误");
    const key = deriveKey(master, C.enc.Hex.parse(o.salt));
    const bytes = C.AES.decrypt(o.ct, key, { iv: C.enc.Hex.parse(o.iv), mode: C.mode.CBC, padding: C.pad.Pkcs7 });
    const txt = bytes.toString(C.enc.Utf8);
    if (!txt) throw new Error("主密码错误");
    return JSON.parse(txt);
  }
  function setupVault(master) {
    sessionMaster = master;
    localStorage.setItem(VAULT_KEY, encryptVault([], master));
  }
  function unlock(master) {
    decryptVault(localStorage.getItem(VAULT_KEY), master); // 错则抛异常
    sessionMaster = master;
  }
  function lock() { sessionMaster = null; }
  function readPasswords() {
    if (!dataEncEnabled()) {
      const s = localStorage.getItem(PLAIN_KEY);
      return s ? JSON.parse(s) : [];
    }
    if (!sessionMaster) throw new Error("LOCKED");
    return decryptVault(localStorage.getItem(VAULT_KEY), sessionMaster);
  }
  function writePasswords(arr) {
    if (!dataEncEnabled()) { localStorage.setItem(PLAIN_KEY, JSON.stringify(arr)); return; }
    if (!sessionMaster) throw new Error("LOCKED");
    localStorage.setItem(VAULT_KEY, encryptVault(arr, sessionMaster));
  }
  function exportVault() { return localStorage.getItem(dataEncEnabled() ? VAULT_KEY : PLAIN_KEY); } // 已是密文/明文 JSON
  function importVault(blobJson, master) {
    decryptVault(blobJson, master); // 校验主密码，错则抛
    sessionMaster = master;
    localStorage.setItem(VAULT_KEY, blobJson);
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  // 密钥只展示前后截断预览（不暴露完整 PEM）
  function previewKey(k) {
    if (!k) return "—";
    const b64 = k.split("\n").filter((l) => l && !l.startsWith("-----")).join("");
    if (b64.length <= 48) return b64;
    return b64.slice(0, 32) + "…" + b64.slice(-12);
  }
  // 保险库条目类型：rsa-pair（一对）/ rsa-import（单把导入）/ generic（普通）
  function entryKind(e) {
    if (e && e.kind === "rsa-pair") return "rsa-pair";
    if (e && e.kind === "rsa-import") return "rsa-import";
    return "generic";
  }
  function entryTitle(e) {
    const k = entryKind(e);
    if (k === "rsa-pair") return (e.label || "") + (window.__lang === "en" ? " RSA Key" : t("rsa.pairSuffix"));
    if (k === "rsa-import") return e.label || t("rsa.importDefault");
    return e.label || "";
  }
  function entryBadge(e) {
    const k = entryKind(e);
    if (k === "rsa-pair") return { text: "2", cls: "badge-pair" };
    if (k === "rsa-import") return { text: t("rsa.badgeExt"), cls: "badge-ext" };
    return null;
  }
  function badgeHtml(b) { return b ? `<span class="rsa-badge ${b.cls}">${escapeHtml(b.text)}</span>` : ""; }
  // 加密方式“特殊标记”：带色圆点 + 文字的彩色胶囊，按分类着色，便于一眼认出是哪个密码
  function methodChip(method, cat) {
    const c = cat || "generic";
    const label = escapeHtml(method || t("vp.generic"));
    return `<span class="mchip ${escapeHtml(c)}">${label}</span>`;
  }
  // 长明文截断预览（用于保存弹窗展示，避免大段内容撑爆弹窗）
  function previewText(s, max) {
    s = s || "";
    max = max || 80;
    return s.length > max ? (s.slice(0, max) + "…") : s;
  }
  // 条目是否匹配某个功能的过滤分类：本类 + 通用(generic) 都可见；RSA 只在 RSA 场景出现
  function matchCat(e, f) {
    if (!f) return true;
    const c = e.cat || "generic";
    if (c === f) return true;
    if (c === "generic") return true;
    return false;
  }

  /* ---------- 各设置应用 ---------- */
  function resolveLang() {
    const l = getSetting("lang", "system");
    if (l === "system") {
      const n = (navigator.language || "zh").toLowerCase();
      return n.startsWith("zh") ? "zh" : "en";
    }
    if (l === "zh" || l === "en") return l;
    if (importedLangs()[l]) return l; // 已导入的语言包
    return "zh";
  }
  function applyLanguage() {
    window.__lang = resolveLang();
    if (window.applyLang) window.applyLang();
    if (window.renderHistory) window.renderHistory();
  }
  function applyTheme() {
    const th = getSetting("theme", "system");
    const sysDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = th === "dark" || (th === "system" && sysDark);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    applyAccent(); // 重新计算强调色（深色/浅色下取不同明度）
    // 同步浏览器状态栏/顶部沉浸区配色到当前强调色
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      const ac = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
      meta.setAttribute("content", ac || (dark ? "#161618" : "#1a1a1a"));
    }
  }
  function applyFont() {
    const f = getSetting("font", "normal");
    const map = { small: 0.9, normal: 1, large: 1.15, xlarge: 1.3 };
    document.documentElement.style.setProperty("--fs", map[f] || 1);
  }
  function applyImmersive() {
    /* 状态栏不覆盖 WebView：原生层已 setDecorFitsSystemWindows(true) + overlaysWebView:false
       预留空间，主页内容永不遮挡；这里只同步图标深浅色，保证时钟/电池在绿底上始终可见 */
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.StatusBar) {
      window.Capacitor.Plugins.StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
      const dark = document.documentElement.getAttribute("data-theme") === "dark";
      window.Capacitor.Plugins.StatusBar.setStyle({ style: dark ? "LIGHT" : "DARK" }).catch(() => {});
    }
  }

  /* ---------- 莫奈取色（动态强调色） ----------
     默认 accent 为墨黑/白（中性黑灰白）；用户可在「设置→主题」里选预设或自定义取色，
     从种子色生成一套 Monet 风格的同色调色板（accent / on-accent / soft / ring），
     浅色与深色分别取不同明度，保证可读。 */
  const ACCENT_PRESETS = [
    { v: "default", bg: "#00a862", name: "酷安绿(默认)" },
    { v: "#1a1a1a", bg: "#1a1a1a", name: "墨黑" },
    { v: "#07c160", bg: "#07c160", name: "微信绿" },
    { v: "#4e6ef2", bg: "#4e6ef2", name: "酷安蓝" },
    { v: "#7c5cff", bg: "#7c5cff", name: "莫奈紫" },
    { v: "#ff8a3d", bg: "#ff8a3d", name: "莫奈橙" },
    { v: "#19b3a6", bg: "#19b3a6", name: "莫奈青" },
  ];
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function hexToRgb(hex) {
    let h = (hex || "#000000").replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0; const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    return { h: h * 360, s: s, l: l };
  }
  function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360 / 360; s = clamp(s, 0, 1); l = clamp(l, 0, 1);
    let r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      const hue = (t) => {
        t = (t + 1) % 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      r = hue(h + 1 / 3); g = hue(h); b = hue(h - 1 / 3);
    }
    const to = (x) => Math.round(x * 255).toString(16).padStart(2, "0");
    return "#" + to(r) + to(g) + to(b);
  }
  function relLuminance(hex) {
    const { r, g, b } = hexToRgb(hex);
    const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  }
  // 由种子色（或 default）推导当前模式的强调色板
  function computeAccent(seed, dark) {
    if (!seed || seed === "default") {
      return dark
        ? { accent: "#f2f2f2", onAccent: "#111111", soft: "#2c2c2e", ring: "rgba(255,255,255,0.20)" }
        : { accent: "#1a1a1a", onAccent: "#ffffff", soft: "#ececec", ring: "rgba(0,0,0,0.16)" };
    }
    const rgb = hexToRgb(seed);
    const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
    /* 极端明度（接近纯黑/纯白/纯灰）保持原色，不强制饱和度（避免黑色被变红褐） */
    const isNeutral = s < 0.06;
    const sat = isNeutral ? 0 : clamp(s, 0.45, 0.95);
    const lC = Math.max(0.08, Math.min(0.92, l || 0.5));
    const lightAccent = isNeutral ? hslToHex(0, 0, lC) : hslToHex(h, sat, 0.52);
    const darkAccent = isNeutral ? hslToHex(0, 0, Math.min(0.95, lC + 0.18)) : hslToHex(h, sat, 0.72);
    const onLight = relLuminance(lightAccent) < 0.45 ? "#ffffff" : "#1a1a1a";
    const onDark = relLuminance(darkAccent) < 0.45 ? "#ffffff" : "#1a1a1a";
    const softLight = isNeutral ? hslToHex(0, 0, Math.min(0.95, lC + 0.18)) : hslToHex(h, clamp(s, 0.4, 0.9), 0.93);
    const softDark = isNeutral ? hslToHex(0, 0, Math.max(0.12, lC - 0.2)) : hslToHex(h, clamp(s, 0.3, 0.7), 0.22);
    return {
      accent: dark ? darkAccent : lightAccent,
      onAccent: dark ? onDark : onLight,
      soft: dark ? softDark : softLight,
      ring: dark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.16)",
    };
  }
  function applyAccent() {
    const seed = getSetting("accent", "default");
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    const p = computeAccent(seed, dark);
    const root = document.documentElement.style;
    root.setProperty("--accent", p.accent);
    root.setProperty("--on-accent", p.onAccent);
    root.setProperty("--accent-soft", p.soft);
    root.setProperty("--accent-ring", p.ring);
  }

  /* ---------- 设置导航 ---------- */
  const overlay = document.getElementById("settings-overlay");
  const backBtn = document.getElementById("settings-back");
  const titleEl = document.getElementById("settings-title");
  const bodyEl = document.getElementById("settings-body");
  let stack = [];

function openSettings(target) {
  stack = target ? ["main", target] : ["main"]; render(); overlay.classList.add("show"); overlay.removeAttribute("hidden");
  /* 设置 overlay-bar 黑色 → 状态栏白字（DARK）；关闭时恢复（已在 showPanel 处理 LIGHT） */
  try {
    const sb = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.StatusBar;
    if (sb && sb.setStyle) sb.setStyle({ style: "DARK" }).catch(() => {});
  } catch (e) {}
}
function closeSettings() { overlay.classList.remove("show"); overlay.setAttribute("hidden", ""); stack = [];
  try {
    const sb = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.StatusBar;
    if (sb && sb.setStyle) sb.setStyle({ style: "LIGHT" }).catch(() => {});
  } catch (e) {}
}
  function go(name) { stack.push(name); render(); }
  function back() { stack.pop(); if (stack.length === 0) { closeSettings(); return; } render(); }
  window.settingsBack = back; // 安卓返回键用：设置页逐级返回 / 关闭
  window.openSettingsSubview = (name) => openSettings(name || "main");

  function render() {
    const top = stack[stack.length - 1];
    if (top === "main") renderMain();
    else renderSubview(top);
  }

  /* 设置项 SVG 图标（线性，24x24 viewBox） */
  const SETTINGS_ICONS = {
    display: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 20h8"/><path d="M12 17v3"/></svg>',
    theme: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M4.93 19.07l1.41-1.41"/><path d="M17.66 6.34l1.41-1.41"/></svg>',
    extcall: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>',
    exp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2v6l-5 9a3 3 0 0 0 2.6 4.5h10.8A3 3 0 0 0 20 17l-5-9V2"/><line x1="9" y1="2" x2="15" y2="2"/><line x1="7" y1="14" x2="17" y2="14"/></svg>',
    storage: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 11h18"/></svg>',
    common: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><circle cx="12" cy="16" r="1.4"/></svg>',
    sync: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><polyline points="3 21 3 16 8 16"/><polyline points="21 3 21 8 16 8"/></svg>',
    cache: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>',
    about: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="8.01"/><polyline points="11 12 12 12 12 16 13 16"/></svg>',
    privacy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 6v6c0 5 3.4 9.6 8 10 4.6-.4 8-5 8-10V6z"/><polyline points="9 12 11 14 15 10"/></svg>',
    terms: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>',
    security: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 6v6c0 5 3.4 9.6 8 10 4.6-.4 8-5 8-10V6z"/></svg>',
    personal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    feedback: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.3c-1 0-2-.2-2.9-.5L3 21l1.8-5.6A8.3 8.3 0 0 1 4 11.5 8.4 8.4 0 0 1 12.5 3.2a8.4 8.4 0 0 1 8.5 8.3z"/><path d="M8.5 10.5h7"/><path d="M8.5 14h4"/></svg>',
  };

  function renderMain() {
    titleEl.textContent = t("set.title");
    const groups = [
      { title: t("set.grpGeneral"), items: ["display", "theme", "extcall", "exp", "storage"] },
      { title: t("set.grpData"), items: ["common", "sync"] },
      { title: t("set.grpPrivacy"), items: ["about", "feedback", "privacy", "terms", "security", "personal"] },
    ];
    let html = "";
    groups.forEach((g) => {
      html += `<div class="settings-group"><div class="settings-group-title">${escapeHtml(g.title)}</div><ul class="settings-list">`;
      g.items.forEach((it) => {
        const label = t("set." + it) || t(it + ".title") || it;
        const ico = SETTINGS_ICONS[it] || "";
        html += `<li class="settings-item" data-go="${it}"><span class="si-icon">${ico}</span><span class="si-text">${escapeHtml(label)}</span><span class="si-arrow">›</span></li>`;
      });
      html += "</ul></div>";
    });
    bodyEl.innerHTML = html;
    bodyEl.querySelectorAll(".settings-item").forEach((li) => (li.onclick = () => go(li.dataset.go)));
  }

  /* 数据加密开关：绑定到「密码本」页（已从主菜单移入）；切换时在 密文(主密码) / 明文 之间迁移 */
  function bindEncToggle() {
    const encToggle = document.getElementById("enc-toggle");
    if (!encToggle) return;
    encToggle.onchange = () => {
      const on = encToggle.checked;
      if (on) {
        if (window.dialog) {
          window.dialog.prompt(t("common.setMaster") + "：" + t("common.masterPlaceholder")).then((master) => {
            if (!master) { encToggle.checked = false; return; }
            const plain = localStorage.getItem(PLAIN_KEY);
            const arr = plain ? JSON.parse(plain) : [];
            localStorage.removeItem(PLAIN_KEY);
            setDataEnc(true);
            setupVault(master);
            writePasswords(arr);
            alert(t("enc.on"));
            render();
          });
          return;
        }
        const master = window.prompt(t("common.setMaster") + "：" + t("common.masterPlaceholder"));
        if (!master) { encToggle.checked = false; return; }
        const plain = localStorage.getItem(PLAIN_KEY);
        const arr = plain ? JSON.parse(plain) : [];
        localStorage.removeItem(PLAIN_KEY);
        setDataEnc(true);
        setupVault(master);
        writePasswords(arr);
        alert(t("enc.on"));
      } else {
        if (isLocked()) { alert(t("exp.locked")); encToggle.checked = true; return; }
        const arr = vaultExists() ? readPasswords() : [];
        setDataEnc(false);
        localStorage.setItem(PLAIN_KEY, JSON.stringify(arr));
        sessionMaster = null;
        alert(t("enc.off"));
      }
      render();
    };
  }

  function renderSubview(name) {
    let html = "";
    if (["about", "feedback", "privacy", "terms", "security", "personal"].includes(name)) {
      if (name === "feedback") {
        /* 建议与反馈：GitHub Issues + 复制反馈信息（版本+日志），App 内一键带出 */
        titleEl.textContent = t("feedback.title");
        html =
          `<div class="legal-text">` +
          `<p>${t("feedback.intro")}</p>` +
          `<p>${t("feedback.how")}</p>` +
          `</div>` +
          `<div class="btn-row">` +
          `<button class="btn primary" id="fb-github">${t("feedback.github")}</button>` +
          `<button class="btn ghost" id="fb-copy">${t("feedback.copyInfo")}</button>` +
          `</div>` +
          `<p class="hint" id="fb-hint"></p>`;
      } else {
        titleEl.textContent = t(name + ".title");
        html = `<div class="legal-text">${t(name + ".text")}</div>`;
      }
      if (name === "about") {
        /* 版本 + GitHub + 检测更新 置顶（“他能做什么”上方） */
        html =
          `<div class="about-hero">` +
          `<div class="about-logo">🔐</div>` +
          `<div class="about-ver">${t("appTitle")} · <a href="${GITHUB_REPO}" target="_blank" rel="noopener">V${APP_VERSION} · GitHub</a></div>` +
          `<button class="btn primary" id="about-check-update">🔄 ${t("about.update")}</button>` +
          `<p class="hint" id="about-update-hint" style="margin-top:8px"></p>` +
          `</div>` +
          `<div class="legal-text">${t(name + ".text")}</div>`;
      }
    } else if (name === "common") {
      renderCommon();
      return;
    } else if (name === "sync") {
      renderSync();
      return;
    } else if (name === "storage") {
      titleEl.textContent = t("storage.title");
      const path = getSetting("savepath", "sdcard/CrytoPwa");
      html =
        `<div class="cp-note">${t("storage.hint")}</div>` +
        `<div class="cp-form">` +
        `<input id="sp-path" value="${escapeHtml(path)}" placeholder="sdcard/CrytoPwa" />` +
        `<div class="btn-row">` +
        `<button class="btn" id="sp-pick">${t("storage.pick")}</button>` +
        `<button class="btn ghost" id="sp-reset">${t("storage.reset")}</button>` +
        `</div>` +
        `</div>` +
        `<div class="btn-row"><button class="btn primary" id="sp-save">${t("common.save")}</button></div>` +
        `<p class="hint" id="sp-pick-hint"></p>` +
        `<div class="legal-text" style="margin-top:14px"><h3>${t("storage.usageTitle")}</h3><ul><li>${t("storage.usage1")}</li><li>${t("storage.usage2")}</li><li>${t("storage.usage3")}</li></ul></div>`;
    } else if (name === "theme") {
      titleEl.textContent = t("theme.title");
      const cur = getSetting("theme", "system");
      const seed = getSetting("accent", "default");
      const presetsHtml = ACCENT_PRESETS.map((p) =>
        `<button class="accent-swatch${seed === p.v ? " active" : ""}" data-seed="${p.v}" style="--sw:${p.bg}" title="${p.name}"></button>`
      ).join("");
      html =
        `<div class="sub-title">${t("theme.title")}</div>` +
        `<div class="seg-inline" id="theme-seg">` +
        `<button data-v="system" class="${cur === "system" ? "active" : ""}">${t("theme.system")}</button>` +
        `<button data-v="light" class="${cur === "light" ? "active" : ""}">${t("theme.light")}</button>` +
        `<button data-v="dark" class="${cur === "dark" ? "active" : ""}">${t("theme.dark")}</button>` +
        `</div>` +
        `<div class="sub-title" style="margin-top:22px">${t("accent.title")}</div>` +
        `<div class="accent-presets" id="accent-presets">${presetsHtml}</div>` +
        `<div class="settings-row" style="margin-top:14px"><span class="sr-label">${t("accent.pick")}</span>` +
        `<input type="color" id="accent-color" value="${seed === "default" ? "#00a862" : seed}" /></div>`;
    } else if (name === "extcall") {
      titleEl.textContent = t("ext.title");
      const on = getSetting("ext_incoming", "1") === "1";
      html =
        `<div class="settings-row" style="margin:14px 0 4px"><span class="sr-label">${t("ext.auto")}</span>` +
        `<label class="switch"><input type="checkbox" id="ext-toggle" ${on ? "checked" : ""}><span class="track"></span><span class="thumb"></span></label></div>` +
        `<div class="cp-form" style="margin-top:10px">` +
        `<input id="ext-example" readonly value="crypto-pwa://?text=hello" />` +
        `<div class="btn-row"><button class="btn ghost" id="ext-copy">${t("ext.copyExample")}</button></div>` +
        `</div>` +
        `<div class="legal-text" style="margin-top:14px">${t("ext.text")}</div>`;
    } else if (name === "exp") {
      /* 实验性：数据回调（其他 App 拉起本 App 并回传结果），点行才弹说明 */
      titleEl.textContent = t("exp.title");
      const cbOn = getSetting("exp_callback", "1") === "1";
      html =
        `<ul class="settings-list exp-list">` +
        `<li class="settings-item" id="exp-cb-row">` +
        `<span class="si-icon">${SETTINGS_ICONS.extcall}</span>` +
        `<span class="si-text">${t("exp.cb")}</span>` +
        `<span class="si-arrow">›</span>` +
        `<label class="switch"><input type="checkbox" id="exp-cb-toggle" ${cbOn ? "checked" : ""}><span class="track"></span><span class="thumb"></span></label>` +
        `</li>` +
        `</ul>`;
    } else if (name === "display") {
      titleEl.textContent = t("display.title");
      const f = getSetting("font", "normal");
      const cur = getSetting("lang", "system");
      let langBtnsDisp =
        `<button data-v="system" class="${cur === "system" ? "active" : ""}">${t("lang.system")}</button>` +
        `<button data-v="zh" class="${cur === "zh" ? "active" : ""}">${t("lang.zh")}</button>` +
        `<button data-v="en" class="${cur === "en" ? "active" : ""}">${t("lang.en")}</button>`;
      const impDisp = importedLangs();
      Object.keys(impDisp).forEach((lg) => {
        langBtnsDisp += `<button data-v="${lg}" class="${cur === lg ? "active" : ""}">${escapeHtml(impDisp[lg])}</button>`;
      });
      html =
        `<div class="settings-row"><span class="sr-label">${t("disp.lang")}</span>` +
        `<div class="seg-inline" id="lang-seg">${langBtnsDisp}</div></div>` +
        `<div class="settings-row"><span class="sr-label">${t("disp.font")}</span>` +
        `<div class="seg-inline" id="font-seg">` +
        `<button data-v="small" class="${f === "small" ? "active" : ""}">${t("font.small")}</button>` +
        `<button data-v="normal" class="${f === "normal" ? "active" : ""}">${t("font.normal")}</button>` +
        `<button data-v="large" class="${f === "large" ? "active" : ""}">${t("font.large")}</button>` +
        `<button data-v="xlarge" class="${f === "xlarge" ? "active" : ""}">${t("font.xlarge")}</button>` +
        `</div></div>`;
    } else if (name === "lang") {
      titleEl.textContent = t("disp.lang");
      const cur = getSetting("lang", "system");
      let langBtns =
        `<button data-v="system" class="${cur === "system" ? "active" : ""}">${t("lang.system")}</button>` +
        `<button data-v="zh" class="${cur === "zh" ? "active" : ""}">${t("lang.zh")}</button>` +
        `<button data-v="en" class="${cur === "en" ? "active" : ""}">${t("lang.en")}</button>`;
      const imp = importedLangs();
      Object.keys(imp).forEach((lg) => {
        langBtns += `<button data-v="${lg}" class="${cur === lg ? "active" : ""}">${escapeHtml(imp[lg])}</button>`;
      });
      html =
        `<div class="settings-row"><span class="sr-label">${t("disp.lang")}</span>` +
        `<div class="seg-inline" id="lang-seg">${langBtns}</div></div>` +
        `<div class="btn-row" style="margin-top:14px">` +
        `<button class="btn ghost" id="lang-import">📦 ${t("lang.import")}</button>` +
        `</div>` +
        `<p class="hint" id="lang-import-hint">${t("lang.importHint")}</p>` +
        `<input type="file" id="lang-file" accept=".json,application/json" style="display:none" />`;
    }
    bodyEl.innerHTML = html;
    attachSubview(name);
  }

  function attachSubview(name) {
    if (name === "storage") {
      const DEFAULT_PATH = "sdcard/CrytoPwa";
      const curPath = () => (getSetting("savepath", DEFAULT_PATH) || "").trim() || DEFAULT_PATH;
      document.getElementById("sp-save").onclick = () => {
        const v = (bodyEl.querySelector("#sp-path").value || "").trim() || DEFAULT_PATH;
        if (v === curPath()) {
          /* 已经是默认/当前路径：toast 提示，不弹窗 */
          if (window.toast) window.toast(v === DEFAULT_PATH ? t("storage.alreadyDefault") : t("storage.alreadySaved"));
        } else {
          setSetting("savepath", v);
          if (window.toast) window.toast(t("storage.saved"));
          render();
        }
      };
      /* 选择文件夹：优先用 File System Access API（Chrome/Edge 可用），否则提示手动输入 */
      const pickBtn = document.getElementById("sp-pick");
      const pickHint = document.getElementById("sp-pick-hint");
      if (pickBtn) pickBtn.onclick = async () => {
        /* ① 原生 Capacitor FolderPicker（安卓 App：ACTION_OPEN_DOCUMENT_TREE 系统文件夹选择器） */
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.FolderPicker) {
          try {
            const ret = await window.Capacitor.Plugins.FolderPicker.pickFolder();
            if (ret && ret.uri) {
              const name = ret.name || "selected";
              const path = "sdcard/" + name;
              bodyEl.querySelector("#sp-path").value = path;
              setSetting("savepath", path);
              setSetting("save_uri", ret.uri);
              if (pickHint) pickHint.textContent = "✅ " + name;
              return;
            }
          } catch (e) { /* 用户取消或异常 → 尝试下一方案 */ }
        }
        /* ② File System Access API（桌面 Chrome/Edge） */
        if (window.showDirectoryPicker) {
          try {
            const h = await window.showDirectoryPicker({ id: "crypto-pwa-save" });
            const name = h.name || "selected";
            const dir = "sdcard/" + name;
            bodyEl.querySelector("#sp-path").value = dir;
            setSetting("savepath", dir);
            if (pickHint) pickHint.textContent = "✅ " + name;
            return;
          } catch (e) {
            if (e && e.name === "AbortError") return;
            /* 失败则降级到 input[file][webkitdirectory] */
          }
        }
        /* 安卓 WebView / 不支持 FS Access：用隐藏 input 选目录（需挂到 DOM 才能调起系统选择器） */
        const inp = document.createElement("input");
        inp.type = "file";
        inp.setAttribute("webkitdirectory", "");
        inp.style.position = "fixed";
        inp.style.left = "-9999px";
        document.body.appendChild(inp);
        inp.onchange = () => {
          const f = inp.files && inp.files[0];
          if (f) {
            /* webkitRelativePath 形如 MyFolder/file.txt，取首段目录名 */
            const rel = f.webkitRelativePath || f.name;
            const seg = String(rel).split("/")[0] || "selected";
            const dir = "sdcard/" + seg;
            bodyEl.querySelector("#sp-path").value = dir;
            setSetting("savepath", dir);
            if (pickHint) pickHint.textContent = "✅ " + seg;
          }
          setTimeout(() => { try { document.body.removeChild(inp); } catch (e) {} }, 0);
        };
        inp.click();
        /* 超时兜底：用户取消选择后移除临时 input */
        setTimeout(() => { try { if (inp.parentNode) document.body.removeChild(inp); } catch (e) {} }, 60000);
      };
      const resetBtn = document.getElementById("sp-reset");
      if (resetBtn) resetBtn.onclick = () => {
        if (curPath() === DEFAULT_PATH) {
          if (window.toast) window.toast(t("storage.alreadyDefault"));
        } else {
          setSetting("savepath", DEFAULT_PATH);
          bodyEl.querySelector("#sp-path").value = DEFAULT_PATH;
          if (pickHint) pickHint.textContent = "";
          if (window.toast) window.toast(t("storage.restoredDefault"));
        }
      };
    } else if (name === "theme") {
      bodyEl.querySelectorAll("#theme-seg button").forEach((b) =>
        (b.onclick = () => { setSetting("theme", b.dataset.v); applyTheme(); render(); })
      );
      bodyEl.querySelectorAll("#accent-presets .accent-swatch").forEach((b) =>
        (b.onclick = () => { setSetting("accent", b.dataset.seed); applyTheme(); render(); })
      );
      const colorInput = bodyEl.querySelector("#accent-color");
      if (colorInput) colorInput.oninput = () => { setSetting("accent", colorInput.value); applyTheme(); };
    } else if (name === "display") {
      const seg = bodyEl.querySelector("#font-seg");
      if (seg) seg.querySelectorAll("button").forEach((b) =>
        (b.onclick = () => { setSetting("font", b.dataset.v); applyFont(); render(); })
      );
      const lseg = bodyEl.querySelector("#lang-seg");
      if (lseg) lseg.querySelectorAll("button").forEach((b) =>
        (b.onclick = () => { setSetting("lang", b.dataset.v); applyLanguage(); render(); })
      );
    } else if (name === "extcall") {
      const et = document.getElementById("ext-toggle");
      if (et) et.onchange = () => { setSetting("ext_incoming", et.checked ? "1" : "0"); render(); };
      const exCopy = bodyEl.querySelector("#ext-copy");
      if (exCopy) exCopy.onclick = (e) => {
        const v = bodyEl.querySelector("#ext-example").value;
        if (window.copyText) window.copyText(v, e.target);
      };
    } else if (name === "exp") {
      /* 数据回调开关 + 点行弹说明 */
      const cbToggle = bodyEl.querySelector("#exp-cb-toggle");
      if (cbToggle) cbToggle.onchange = () => {
        setSetting("exp_callback", cbToggle.checked ? "1" : "0");
        if (window.toast) window.toast(t("common.savedOk"));
      };
      /* 点击「数据回调」行（非开关区）→ 弹说明；开关区点击不弹 */
      const cbRow = bodyEl.querySelector("#exp-cb-row");
      if (cbRow) {
        cbRow.addEventListener("click", (e) => {
          if (e.target.closest(".switch")) return;
          if (window.dialog) {
            const lines = [
              t("exp.usageIntro"), "",
              "1. " + t("exp.step1Title"), t("exp.step1Body"),
              "   crypto-pwa://?text=<内容>&tab=hash&run=1&callback=myapp://result", "",
              "2. " + t("exp.step2Title"), t("exp.step2Body"),
              '   {"ok":true,"ts":"2026-08-14T07:00:00Z","data":"...","app":"CryptPwa"}', "",
              "3. " + t("exp.step3Title"), t("exp.step3Body"),
              "   intent://?text=hello&tab=enc&callback=myapp://result#Intent;scheme=crypto-pwa;package=com.zaa.cryptpwa;end", "",
              t("exp.noteTitle"), t("exp.note"),
            ];
            window.dialog.alert(lines.join("\n"), t("exp.cb"));
          }
        });
      }
    } else if (name === "lang") {
      bodyEl.querySelectorAll("#lang-seg button").forEach((b) =>
        (b.onclick = () => { setSetting("lang", b.dataset.v); applyLanguage(); render(); })
      );
      /* 导入语言包：选择 JSON（{lang, name, data}）→ 校验 → 注册 + 持久化 + 切换 */
      const impBtn = bodyEl.querySelector("#lang-import");
      const impFile = bodyEl.querySelector("#lang-file");
      if (impBtn && impFile) {
        impBtn.onclick = () => impFile.click();
        impFile.onchange = () => {
          const f = impFile.files[0]; if (!f) return;
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const o = JSON.parse(reader.result);
              if (!o || typeof o !== "object" || Array.isArray(o)) throw new Error("bad");
              const lg = String(o.lang || "").toLowerCase();
              const nm = String(o.name || "").trim();
              const data = o.data;
              if (!/^[a-z]{2,5}$/.test(lg) || !nm || !data || typeof data !== "object" || Array.isArray(data)) throw new Error("bad");
              if (!data.appTitle || !data["tool.hash"]) throw new Error("bad");
              window.I18N[lg] = data;
              const im = importedLangs(); im[lg] = nm; saveImportedLangs(im);
              setSetting("lang", lg);
              applyLanguage(); render();
              alert(t("lang.importDone"));
            } catch (e) { alert(t("lang.importFail")); }
            impFile.value = "";
          };
          reader.readAsText(f);
        };
      }
    } else if (name === "common") {
      /* 长按「返回」→ toast 说明 3 套密码库 */
      const backBtn = document.getElementById("settings-back");
      if (backBtn) {
        let timer = null;
        backBtn.addEventListener("pointerdown", () => {
          timer = setTimeout(() => { if (window.toast) window.toast(t("vault.slotHint"), 3200); }, 650);
        });
        ["pointerup", "pointerleave", "pointercancel"].forEach((ev) =>
          backBtn.addEventListener(ev, () => { if (timer) { clearTimeout(timer); timer = null; } })
        );
      }
    } else if (name === "feedback") {
      /* 建议与反馈：GitHub Issues 直达 + 复制反馈信息（版本+日志，便于发 issue） */
      const gh = document.getElementById("fb-github");
      if (gh) gh.onclick = () => window.open(GITHUB_REPO + "/issues", "_blank");
      const cp = document.getElementById("fb-copy");
      if (cp) cp.onclick = async () => {
        const logs = (window.__getLog ? window.__getLog() : []).slice(-20)
          .map((l) => `[${l.ts}] ${l.tag}: ${l.msg}`).join("\n") || t("exp.logEmpty");
        const info = `App: ${t("appTitle")}\nVersion: ${APP_VERSION}\nLang: ${window.__lang || "zh"}\n\n--- 最近日志 ---\n${logs}`;
        try {
          await navigator.clipboard.writeText(info);
          const hint = document.getElementById("fb-hint");
          if (hint) hint.textContent = t("feedback.copied");
          if (window.toast) window.toast(t("feedback.copied"));
        } catch (e) {
          const hint = document.getElementById("fb-hint");
          if (hint) hint.textContent = t("feedback.copyFail");
        }
      };
    } else if (name === "about") {
      /* 检测更新：对比 GitHub Releases 最新 tag 与本地 APP_VERSION */
      const btn = document.getElementById("about-check-update");
      if (btn) btn.onclick = async () => {
        const hint = document.getElementById("about-update-hint");
        btn.disabled = true;
        const orig = btn.textContent;
        btn.textContent = "🔄 " + t("about.checking");
        if (hint) hint.textContent = "";
        try {
          const res = await fetch("https://api.github.com/repos/ZAA66666/CryptPwa/releases/latest");
          if (!res.ok) throw new Error("HTTP " + res.status);
          const rel = await res.json();
          const tag = (rel.tag_name || "").replace(/^v/i, "");
          const cur = String(APP_VERSION || "1.0.0").replace(/^v/i, "");
          const cmp = tag.split(".").map(Number).concat([0, 0, 0]).slice(0, 3)
            .map((n, i) => n - (cur.split(".").map(Number)[i] || 0));
          const newer = cmp.some((n) => n > 0) && cmp.findIndex((n) => n !== 0) >= 0 && cmp[cmp.findIndex((n) => n !== 0)] > 0;
          if (newer) {
            const msg = t("about.found") + " v" + tag + "（" + t("about.ver") + " " + APP_VERSION + "）";
            const openRel = () => window.open(rel.html_url || GITHUB_REPO + "/releases", "_blank");
            if (window.dialog) {
              window.dialog.confirm(msg, { title: t("about.update") }).then((ok) => { if (ok) openRel(); });
            } else if (window.confirm(msg + "\n\n" + t("about.open") + "？")) {
              openRel();
            }
            if (hint) hint.textContent = t("about.found") + " v" + tag;
          } else {
            if (hint) hint.textContent = t("about.latest") + "（v" + APP_VERSION + "）";
          }
        } catch (e) {
          if (hint) hint.textContent = t("about.fail") + e.message;
        }
        btn.disabled = false;
        btn.textContent = orig;
      };
    }
  }

  /* ---------- 常用密码（加密保险库）管理 ---------- */
  function renderCommon() {
    titleEl.textContent = t("common.title");
    let html = "";

    /* 数据加密开关（已从主菜单移入密码本页顶部） */
    html =
      `<div class="settings-row" id="enc-row" style="margin-bottom:6px"><span class="sr-label">${t("set.dataEnc")}</span>` +
      `<label class="switch"><input type="checkbox" id="enc-toggle" ${dataEncEnabled() ? "checked" : ""}><span class="track"></span><span class="thumb"></span></label></div>`;

    if (!vaultExists() && dataEncEnabled()) {
      /* 首次使用：设置主密码，之后才创建空库（仅加密模式） */
      html +=
        `<div class="cp-note">${t("common.masterHint")}</div>` +
        `<div class="cp-form">` +
        `<input id="mp1" type="password" placeholder="${t("common.masterPlaceholder")}" />` +
        `<input id="mp2" type="password" placeholder="${t("common.confirmMaster")}" />` +
        `<div class="btn-row"><button class="btn primary" id="mp-set">${t("common.setMaster")}</button></div>` +
        `</div>`;
    } else if (isLocked()) {
      /* 已加密但未解锁 */
      html +=
        `<div class="cp-note">${t("common.lockedTip")}</div>` +
        `<div class="cp-form">` +
        `<input id="mpu" type="password" placeholder="${t("common.masterPlaceholder")}" />` +
        `<div class="btn-row"><button class="btn primary" id="mp-unlock">${t("common.unlockNow")}</button></div>` +
        `</div>`;
    } else {
      /* 已解锁：直接展示当前密码库条目（默认第一个库）；连按标题 10 次触发库管理 */
      const all = readPasswords();
      const arr = all.filter((p) => inSlot(p));
      const slotName = t("vault.slot" + (vaultSlot + 1)) || ("库 " + (vaultSlot + 1));
      html +=
        `<div class="vault-cur">📚 <b>${escapeHtml(slotName)}</b><span class="vc-count">${arr.length} 条</span></div>` +
        `<div id="vault-mgr" class="vault-mgr" hidden>` +
        `<div class="vault-mgr-title">${t("vault.manage")}</div>` +
        `<div class="vault-mgr-list">` +
          `<button data-v="0" class="chip${vaultSlot === 0 ? " active" : ""}">${t("vault.slot1")}</button>` +
          `<button data-v="1" class="chip${vaultSlot === 1 ? " active" : ""}">${t("vault.slot2")}</button>` +
          `<button data-v="2" class="chip${vaultSlot === 2 ? " active" : ""}">${t("vault.slot3")}</button>` +
        `</div>` +
        `<button class="btn ghost" id="vault-add">＋ ${t("vault.addSlot")}</button>` +
        `</div>` +
        `<button class="btn ghost" id="cp-new" style="margin:2px 0 10px">＋ ${t("common.new")}</button>` +
        `<div class="cp-form" id="cp-form" style="display:none">` +
        `<input id="cp-name" placeholder="${t("common.label")}" />` +
        `<select id="cp-cat">` +
          `<option value="generic">${t("cat.generic")}</option>` +
          `<option value="sym">${t("cat.sym")}</option>` +
          `<option value="enc">${t("cat.enc")}</option>` +
          `<option value="hash">${t("cat.hash")}</option>` +
          `<option value="rsa">${t("cat.rsa")}</option>` +
          `<option value="qr">${t("cat.qr")}</option>` +
        `</select>` +
        `<input id="cp-method" placeholder="${t("vp.method")}（${t("vp.generic")}）" />` +
        `<input id="cp-val" type="text" placeholder="${t("common.value")}" />` +
        `<div class="btn-row"><button class="btn primary" id="cp-save">${t("common.save")}</button></div>` +
        `</div>`;
      if (arr.length === 0) html += `<p class="cp-note">${t("common.empty")}</p>`;
      html += `<div id="cp-list"></div>`;
      html +=
        `<div class="btn-row" style="margin-top:14px">` +
        `<button class="btn ghost" id="mp-change">${t("common.changeMaster")}</button>` +
        `<button class="btn ghost" id="mp-lock">${t("common.lock")}</button>` +
        `</div>`;
    }
    bodyEl.innerHTML = html;
    appendAskToggle();
    bindEncToggle();

    if (!vaultExists() && dataEncEnabled()) {
      bodyEl.querySelector("#mp-set").onclick = () => {
        const a = bodyEl.querySelector("#mp1").value, b = bodyEl.querySelector("#mp2").value;
        if (!a) { alert(t("common.masterEmpty")); return; }
        if (a !== b) { alert(t("common.masterMismatch")); return; }
        setupVault(a); render();
      };
    } else if (isLocked()) {
      bodyEl.querySelector("#mp-unlock").onclick = () => {
        try { unlock(bodyEl.querySelector("#mpu").value); render(); }
        catch (e) { alert(t("common.importFail")); }
      };
    } else {
      const list = bodyEl.querySelector("#cp-list");
      // 按加密方式分组展示（对称/编码/哈希/RSA/二维码/通用），仅当前密码库
      const CAT_ORDER = { sym: 0, enc: 1, hash: 2, rsa: 3, qr: 4, generic: 5 };
      const ordered = all
        .map((p, i) => ({ p, i }))
        .filter(({ p }) => inSlot(p))
        .sort((a, b) => (CAT_ORDER[a.p.cat || "generic"] ?? 9) - (CAT_ORDER[b.p.cat || "generic"] ?? 9));
      let lastCat = null;
      ordered.forEach(({ p, i }) => {
        const c = p.cat || "generic";
        if (c !== lastCat) {
          const h = document.createElement("div");
          h.className = "cp-group-title";
          h.textContent = t("cat." + c) || c;
          list.appendChild(h);
          lastCat = c;
        }
        const k = entryKind(p);
        const row = document.createElement("div");
        row.className = "cp-item";
        const title = `${escapeHtml(entryTitle(p))} ${badgeHtml(entryBadge(p))}`;
        let sub = "";
        if (k === "rsa-pair") sub = `<div class="cp-method">${methodChip(t("vp.rsaPub") + " / " + t("vp.rsaPriv"), "rsa")}</div>`;
        else if (k === "rsa-import") sub = `<div class="cp-method">${methodChip((p.side === "public" ? t("vp.rsaPub") : t("vp.rsaPriv")), "rsa")}</div>`;
        else sub = `<div class="cp-method">${methodChip(p.method || t("vp.generic"), p.cat || "generic")}</div><div class="cp-val">${escapeHtml(previewText(p.value, 60))}</div>`;
        row.innerHTML =
          `<div class="cp-label"><div class="cp-name">${title}</div>${sub}</div>` +
          `<div class="cp-acts">` +
            `<button class="cp-ren">${t("rsa.rename")}</button>` +
            `<button class="cp-del">${t("common.del")}</button>` +
          `</div>`;
        row.querySelector(".cp-del").onclick = () => {
          const a = readPasswords(); a.splice(i, 1); writePasswords(a); render();
        };
        row.querySelector(".cp-ren").onclick = () => {
          const doRen = (nv) => {
            if (nv === null) return;
            const a = readPasswords(); a[i].label = nv.trim() || a[i].label; writePasswords(a); render();
          };
          if (window.dialog) window.dialog.prompt(t("rsa.rename") + "：", p.label || "").then(doRen);
          else doRen(window.prompt(t("rsa.rename") + "：", p.label || ""));
        };
        list.appendChild(row);
      });
      /* 「＋ 新建」：切换新增表单显隐 */
      const cpNew = bodyEl.querySelector("#cp-new");
      const cpForm = bodyEl.querySelector("#cp-form");
      if (cpNew && cpForm) {
        cpNew.onclick = () => {
          const show = cpForm.style.display !== "none";
          cpForm.style.display = show ? "none" : "block";
          if (!show) cpNew.textContent = "✕ " + t("common.cancel");
          else cpNew.textContent = "＋ " + t("common.new");
          if (!show) bodyEl.querySelector("#cp-name").focus();
        };
      }
      bodyEl.querySelector("#cp-save").onclick = () => {
        const name = bodyEl.querySelector("#cp-name").value.trim();
        const val = bodyEl.querySelector("#cp-val").value;
        const m = bodyEl.querySelector("#cp-method").value.trim() || t("vp.generic");
        const cat = bodyEl.querySelector("#cp-cat") ? bodyEl.querySelector("#cp-cat").value : "generic";
        if (!name || !val) { alert(t("common.label") + " / " + t("common.value")); return; }
        const a = readPasswords(); a.push({ label: name, value: val, method: m, cat: cat, slot: vaultSlot }); writePasswords(a); render();
      };
      /* 库管理（连按标题 10 次后显示）：切换库 + 新增库 */
      const mgr = bodyEl.querySelector("#vault-mgr");
      if (mgr) {
        mgr.querySelectorAll(".chip").forEach((b) =>
          (b.onclick = () => { setVaultSlot(parseInt(b.dataset.v, 10) || 0); render(); })
        );
        mgr.querySelector("#vault-add").onclick = () => {
          if (window.toast) window.toast(t("vault.max3"));
        };
      }
      /* 连按标题 10 次 → 展开/收起库管理 */
      let tapCount = 0, tapTimer = null;
      titleEl.onclick = () => {
        tapCount++;
        clearTimeout(tapTimer);
        tapTimer = setTimeout(() => { tapCount = 0; }, 600);
        if (tapCount >= 10) {
          tapCount = 0;
          const m = bodyEl.querySelector("#vault-mgr");
          if (m) { m.hidden = !m.hidden; if (window.toast) window.toast(m.hidden ? t("vault.mgrOff") : t("vault.mgrOn")); }
        }
      };
      /* 修改主密码 */
      bodyEl.querySelector("#mp-change").onclick = () => {
        const doChange = (cur) => {
          if (!cur) return;
          let arr;
          try { arr = decryptVault(localStorage.getItem(VAULT_KEY), cur); }
          catch (e) { alert(t("common.importFail")); return; }
          const doSet = (nw) => {
            if (!nw) return;
            sessionMaster = nw;
            localStorage.setItem(VAULT_KEY, encryptVault(arr, nw));
            alert(t("common.changeMaster") + " ✅"); render();
          };
          if (window.dialog) window.dialog.prompt(t("common.confirmMaster")).then(doSet);
          else doSet(window.prompt(t("common.confirmMaster")));
        };
        if (window.dialog) window.dialog.prompt(t("common.masterPlaceholder")).then(doChange);
        else doChange(window.prompt(t("common.masterPlaceholder")));
      };
      /* 锁定（清空内存中的主密码）：加反馈提示 */
      bodyEl.querySelector("#mp-lock").onclick = () => {
        lock();
        render();
        if (window.toast) window.toast(t("common.locked") + " 🔒");
      };
    }
  }

  /* ---------- “加密后询问保存”开关（在所有状态下都显示） ---------- */
  function appendAskToggle() {
    const askOn = getSetting("ask_save", "1") === "1";
    const row = document.createElement("div");
    row.className = "settings-row";
    row.innerHTML = `<span class="sr-label">${t("common.askSave")}</span><label class="switch"><input type="checkbox" id="ask-toggle" ${askOn ? "checked" : ""}><span class="track"></span><span class="thumb"></span></label>`;
    bodyEl.appendChild(row);
    row.querySelector("#ask-toggle").onchange = () => {
      setSetting("ask_save", row.querySelector("#ask-toggle").checked ? "1" : "0");
      render();
    };
  }

  /* ---------- 数据备份与同步（WebDAV） ---------- */
  function webdavConfig() {
    try { return JSON.parse(localStorage.getItem("set_webdav")) || { url: "", user: "", pass: "" }; }
    catch (e) { return { url: "", user: "", pass: "" }; }
  }
  function saveWebdav(cfg) { try { localStorage.setItem("set_webdav", JSON.stringify(cfg)); } catch (e) {} }
  function wdAuth(user, pass) { return "Basic " + btoa(unescape(encodeURIComponent(user + ":" + pass))); }
  function wdTarget(cfg) {
    let u = (cfg.url || "").trim().replace(/\s+/g, "");
    if (!u) throw new Error("URL");
    if (!u.endsWith(".json")) u = u.replace(/\/$/, "") + "/crypto-vault.json";
    return u;
  }
  /* 备份包：按用户勾选的范围打包——密码本(密文) / 软件配置(路径/主题/语言/WebDAV 等) */
  function buildBackup(opts) {
    opts = opts || {};
    const includeVault = opts.vault !== false;
    const includeSettings = opts.settings !== false;
    const out = { format: "crypto-pwa-backup", version: 1 };
    if (includeVault) out.vault = vaultExists() ? exportVault() : null;
    if (includeSettings) {
      out.settings = {
        savepath: getSetting("savepath", "sdcard/CrytoPwa"),
        font: getSetting("font", "normal"),
        theme: getSetting("theme", "system"),
        accent: getSetting("accent", "default"),
        immersive: getSetting("immersive", "0"),
        lang: getSetting("lang", "system"),
        ext_incoming: getSetting("ext_incoming", "1"),
        ask_save: getSetting("ask_save", "1"),
        webdav: webdavConfig(),
      };
    }
    return JSON.stringify(out);
  }
  function applyBackup(str, scope) {
    const o = JSON.parse(str);
    scope = scope || {};
    if (scope.vault !== false && o.vault) localStorage.setItem(dataEncEnabled() ? VAULT_KEY : PLAIN_KEY, o.vault); // 按当前加密模式写入
    if (scope.settings !== false) {
      const s = o.settings || {};
      if (s.savepath !== undefined) setSetting("savepath", s.savepath);
      if (s.font !== undefined) setSetting("font", s.font);
      if (s.theme !== undefined) setSetting("theme", s.theme);
      if (s.accent !== undefined) setSetting("accent", s.accent);
      if (s.immersive !== undefined) setSetting("immersive", s.immersive);
      if (s.lang !== undefined) setSetting("lang", s.lang);
      if (s.ext_incoming !== undefined) setSetting("ext_incoming", s.ext_incoming);
      if (s.ask_save !== undefined) setSetting("ask_save", s.ask_save);
      if (s.webdav !== undefined) saveWebdav(s.webdav);
      applyTheme(); applyLanguage(); applyFont(); applyImmersive();
    }
  }
  /* 备份/恢复范围选择弹窗：勾选「密码本」/「软件配置」 */
  function pickScope(isRestore, onOk) {
    const mask = ensureEl("scope-mask", "vp-mask");
    const panel = ensureEl("scope-panel", "vp-panel");
    panel.innerHTML =
      `<div class="vp-inner">` +
      `<div class="vp-head"><span class="vp-title">${t(isRestore ? "sync.scopeRestoreTitle" : "sync.scopeTitle")}</span><button class="vp-close" id="scope-close">✕</button></div>` +
      `<div class="cp-form" style="padding:6px 2px">` +
      `<label class="scope-opt"><input type="checkbox" id="scope-vault" checked /><span>${t("sync.scopeVault")}</span></label>` +
      `<label class="scope-opt"><input type="checkbox" id="scope-settings" checked /><span>${t("sync.scopeSettings")}</span></label>` +
      `</div>` +
      `<div class="btn-row"><button class="btn ghost" id="scope-cancel">${t("sync.scopeCancel")}</button>` +
      `<button class="btn primary" id="scope-ok">${t(isRestore ? "sync.scopeRestoreOk" : "sync.scopeOk")}</button></div>` +
      `</div>`;
    mask.classList.add("show"); panel.classList.add("show");
    const close = () => { mask.classList.remove("show"); panel.classList.remove("show"); };
    document.getElementById("scope-close").onclick = close;
    document.getElementById("scope-cancel").onclick = close;
    mask.onclick = close;
    document.getElementById("scope-ok").onclick = () => {
      const vault = document.getElementById("scope-vault").checked;
      const settings = document.getElementById("scope-settings").checked;
      close();
      onOk({ vault: vault, settings: settings });
    };
  }
  function isBackupBundle(str) {
    try { return JSON.parse(str).format === "crypto-pwa-backup"; } catch (e) { return false; }
  }
  async function webdavBackup(scope) {
    if (isLocked()) throw new Error(t("sync.needMaster"));
    const blob = buildBackup(scope);
    const cfg = webdavConfig();
    const res = await fetch(wdTarget(cfg), {
      method: "PUT",
      headers: { "Authorization": wdAuth(cfg.user, cfg.pass), "Content-Type": "application/json" },
      body: blob,
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
  }
  async function webdavRestore(scope) {
    const cfg = webdavConfig();
    const res = await fetch(wdTarget(cfg), {
      method: "GET",
      headers: { "Authorization": wdAuth(cfg.user, cfg.pass) },
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const text = await res.text();
    if (isBackupBundle(text)) { applyBackup(text, scope); }
    else {
      const master = await window.dialog.prompt(t("common.masterPlaceholder"));
      if (!master) throw new Error("cancel");
      importVault(text, master); // 旧版纯密码本：校验主密码并写入
    }
  }
  function renderSync() {
    titleEl.textContent = t("sync.title");
    const cfg = webdavConfig();
    let html =
      `<div class="cp-note">${t("sync.cfgHint")}</div>` +
      `<div class="cp-form">` +
      `<input id="wd-url" placeholder="${t("sync.url")}" value="${escapeHtml(cfg.url || "")}" />` +
      `<div class="wd-quick">` +
      `<span class="wd-quick-label">${t("sync.quick")}</span>` +
      `<button class="chip" data-fill="https://dav.jianguoyun.com/dav/">${t("sync.quickJgy")}</button>` +
      `<button class="chip" data-fill="https://your-domain.com/remote.php/dav/files/USER/">${t("sync.quickNc")}</button>` +
      `<button class="chip" data-fill="https://your-nas:5006/dav/">${t("sync.quickSyn")}</button>` +
      `</div>` +
      `<input id="wd-user" placeholder="${t("sync.user")}" value="${escapeHtml(cfg.user || "")}" />` +
      `<input id="wd-pass" type="password" placeholder="${t("sync.pass")}" value="${escapeHtml(cfg.pass || "")}" />` +
      `<div class="btn-row">` +
      `<button class="btn primary" id="wd-save">${t("sync.saveCfg")}</button>` +
      `</div>` +
      `<div class="wd-auto-test"><span class="wd-dot" id="wd-dot"></span><span class="wd-test-label" id="wd-test-label">${t("sync.waitInput")}</span></div>` +
      `</div>` +
      `<div class="btn-row">` +
      `<button class="btn ghost" id="wd-backup">${t("sync.backup")}</button>` +
      `<button class="btn ghost" id="wd-restore">${t("sync.restore")}</button>` +
      `</div>` +
      `<div class="btn-row wd-local">` +
      `<button class="btn ghost" id="wd-export-local">${t("sync.exportLocal")}</button>` +
      `<button class="btn ghost" id="wd-import-local">${t("sync.importLocal")}</button>` +
      `<input type="file" id="wd-file" accept=".json,application/json" hidden />` +
      `</div>`;
    bodyEl.innerHTML = html;
    /* 快捷填入服务器地址 */
    bodyEl.querySelectorAll(".wd-quick .chip").forEach((chip) => {
      chip.onclick = () => { bodyEl.querySelector("#wd-url").value = chip.dataset.fill; };
    });
    bodyEl.querySelector("#wd-save").onclick = () => {
      saveWebdav({
        url: bodyEl.querySelector("#wd-url").value.trim(),
        user: bodyEl.querySelector("#wd-user").value,
        pass: bodyEl.querySelector("#wd-pass").value,
      });
      alert(t("sync.saveCfg") + " ✅");
    };
    /* 连通性自动检测：地址/账号/密码都填完且失焦时自动测，无需点按钮 */
    const wdDot = bodyEl.querySelector("#wd-dot");
    const wdLabel = bodyEl.querySelector("#wd-test-label");
    const wdInputs = ["#wd-url", "#wd-user", "#wd-pass"].map((s) => bodyEl.querySelector(s)).filter(Boolean);
    let wdTimer = null;
    const autoTest = () => {
      if (wdTimer) clearTimeout(wdTimer);
      wdTimer = setTimeout(async () => {
        const cfg = {
          url: bodyEl.querySelector("#wd-url").value.trim(),
          user: bodyEl.querySelector("#wd-user").value,
          pass: bodyEl.querySelector("#wd-pass").value,
        };
        if (!cfg.url || !cfg.user || !cfg.pass) {
          if (wdDot) wdDot.className = "wd-dot";
          if (wdLabel) wdLabel.textContent = t("sync.waitInput");
          return;
        }
        if (wdDot) wdDot.className = "wd-dot";
        if (wdLabel) wdLabel.textContent = t("sync.testing");
        try {
          const res = await fetch(wdTarget(cfg), {
            method: "PROPFIND",
            headers: { "Authorization": wdAuth(cfg.user, cfg.pass), "Depth": "0" },
          });
          if (!(res.ok || res.status === 207)) throw new Error("HTTP " + res.status);
          if (wdDot) wdDot.className = "wd-dot ok";
          if (wdLabel) wdLabel.textContent = t("sync.testOk");
        } catch (e) {
          if (wdDot) wdDot.className = "wd-dot bad";
          if (wdLabel) wdLabel.textContent = t("sync.testFail") + (e.message || "");
        }
      }, 600);
    };
    wdInputs.forEach((el) => { el.addEventListener("input", autoTest); el.addEventListener("change", autoTest); });
    /* 首次进入页面也跑一次（已有配置则显示状态） */
    setTimeout(autoTest, 100);
    bodyEl.querySelector("#wd-backup").onclick = () => {
      /* 校验：是否已配置 WebDAV（保存的配置 + 当前输入框） */
      const cfg = webdavConfig();
      const cur = {
        url: bodyEl.querySelector("#wd-url").value.trim(),
        user: bodyEl.querySelector("#wd-user").value,
        pass: bodyEl.querySelector("#wd-pass").value,
      };
      const ok = (cfg && cfg.url && cfg.user && cfg.pass) || (cur.url && cur.user && cur.pass);
      if (!ok) {
        alert(t("sync.needLoginFirst"));
        bodyEl.querySelector("#wd-url").focus();
        return;
      }
      /* 先让用户勾选备份范围（密码本 / 软件配置），再上传 WebDAV */
      pickScope(false, async (scope) => {
        try { await webdavBackup(scope); alert(t("sync.backupDone")); }
        catch (e) { if (e.message !== "cancel") alert(t("sync.fail") + e.message); }
      });
    };
    bodyEl.querySelector("#wd-restore").onclick = () => {
      const cfg = webdavConfig();
      const cur = {
        url: bodyEl.querySelector("#wd-url").value.trim(),
        user: bodyEl.querySelector("#wd-user").value,
        pass: bodyEl.querySelector("#wd-pass").value,
      };
      const ok = (cfg && cfg.url && cfg.user && cfg.pass) || (cur.url && cur.user && cur.pass);
      if (!ok) {
        alert(t("sync.needLoginFirst"));
        bodyEl.querySelector("#wd-url").focus();
        return;
      }
      pickScope(true, async (scope) => {
        try { await webdavRestore(scope); render(); alert(t("sync.restoreDone")); }
        catch (e) { if (e.message !== "cancel") alert(t("sync.fail") + e.message); }
      });
    };
    /* 导出本地备份（先勾选范围，再下载 JSON 文件） */
    bodyEl.querySelector("#wd-export-local").onclick = () => {
      pickScope(false, (scope) => {
        window.downloadJson("crypto-pwa-backup.json", buildBackup(scope));
        alert(t("sync.exportDone"));
      });
    };
    /* 从本地导入（先勾选恢复范围；兼容备份包 / 旧版纯密码本） */
    const fileInput = bodyEl.querySelector("#wd-file");
    bodyEl.querySelector("#wd-import-local").onclick = () => fileInput.click();
    fileInput.onchange = () => {
      const f = fileInput.files[0]; if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        const txt = reader.result;
        if (isBackupBundle(txt)) {
          pickScope(true, (scope) => {
            try { applyBackup(txt, scope); render(); alert(t("sync.importDone")); }
            catch (e) { alert(t("sync.importFail")); }
          });
          return;
        }
        const doImp = (master) => {
          if (!master) return;
          try { importVault(txt, master); render(); alert(t("sync.importDone")); }
          catch (e) { alert(t("sync.importFail")); }
        };
        /* 旧版密码本备份文件：导入会覆盖现有数据 + 需要主密码，先二次确认 */
        if (window.dialog) {
          window.dialog.confirm(t("common.import") + "：导入将覆盖现有密码本，是否继续？", { title: t("common.import") })
            .then((ok) => { if (ok) window.dialog.prompt(t("common.masterPlaceholder")).then(doImp); });
        } else {
          if (confirm(t("common.import") + "：导入将覆盖现有密码本，是否继续？")) {
            window.dialog.prompt(t("common.masterPlaceholder")).then(doImp);
          }
        }
      };
      reader.readAsText(f);
    };
  }

  /* ---------- 常用密码快捷填入（底部抽屉） ---------- */
  function ensureEl(id, cls) {
    let el = document.getElementById(id);
    if (!el) { el = document.createElement("div"); el.id = id; el.className = cls; document.body.appendChild(el); }
    return el;
  }
  function openPicker(targetId, cat) {
    const mask = ensureEl("pw-mask", "pw-mask");
    const picker = ensureEl("pw-picker", "pw-picker");
    if (isLocked()) {
      /* 未解锁：在抽屉里先输主密码 */
      picker.innerHTML =
        `<div class="pp-head"><span class="pp-title">${t("common.title")}</span><button class="pp-close">✕</button></div>` +
        `<div class="cp-note">${t("common.lockedTip")}</div>` +
        `<div class="cp-form"><input id="pk-unlock" type="password" placeholder="${t("common.masterPlaceholder")}" />` +
        `<button class="btn primary" id="pk-unlock-btn">${t("common.unlockNow")}</button></div>`;
      picker.classList.add("show"); mask.classList.add("show");
      picker.querySelector(".pp-close").onclick = closePicker;
      mask.onclick = closePicker;
      picker.querySelector("#pk-unlock-btn").onclick = () => {
        try { unlock(picker.querySelector("#pk-unlock").value); openPicker(targetId, cat); }
        catch (e) { alert(t("common.importFail")); }
      };
      return;
    }
    let all;
    try { all = readPasswords(); } catch (e) { return; }
    const arr = all.filter((p) => matchCat(p, cat)); // 仅展示当前功能分类
    let title = t("symFill");
    if (cat && t("cat." + cat) !== "cat." + cat) title = t("cat." + cat) + t("vp.book");
    let html = `<div class="pp-head"><span class="pp-title">${escapeHtml(title)}</span><button class="pp-close">✕</button></div>`;
    if (arr.length === 0) {
      html += `<p class="cp-note">${t("common.empty")}</p>`;
    } else {
      arr.forEach((p, i) => {
        // 只展示名称 + 方式（不展示明文内容），方式用彩色芯片特殊标记
        const k = entryKind(p);
        let sub;
        if (k === "rsa-pair") sub = methodChip(t("vp.rsaPub") + " / " + t("vp.rsaPriv"), "rsa");
        else if (k === "rsa-import") sub = methodChip((p.side === "public" ? t("vp.rsaPub") : t("vp.rsaPriv")), "rsa");
        else sub = methodChip(p.method || t("vp.generic"), p.cat || "generic");
        html += `<button class="pw-opt" data-i="${i}"><div class="po-name">${escapeHtml(p.label)}</div><div class="po-method">${sub}</div></button>`;
      });
    }
    picker.innerHTML = html;
    picker.classList.add("show"); mask.classList.add("show");
    picker.querySelector(".pp-close").onclick = closePicker;
    mask.onclick = closePicker;
    picker.querySelectorAll(".pw-opt").forEach((b) =>
      (b.onclick = () => {
        const i = +b.dataset.i;
        const p = arr[i];
        if (!p) { closePicker(); return; }
        if (cat === "rsa") {
          // RSA：一对则同时填公钥+私钥；单把导入则填对应字段（不展开密钥框，展示走弹窗）
          const pubEl = document.getElementById("rsa-pub");
          const privEl = document.getElementById("rsa-priv");
          const k = entryKind(p);
          if (k === "rsa-pair") {
            if (pubEl) { pubEl.value = p.pub || ""; pubEl.dispatchEvent(new Event("input")); }
            if (privEl) { privEl.value = p.priv || ""; privEl.dispatchEvent(new Event("input")); }
          } else {
            const el = (p.side === "public") ? pubEl : privEl;
            if (el) { el.value = p.value || ""; el.dispatchEvent(new Event("input")); }
          }
          if (window.rsaSaveKeys) window.rsaSaveKeys();
          const stR = document.getElementById("rsa-status");
          if (stR) stR.textContent = t("asym.fromVaultPair").replace("{name}", p.label || "");
        } else if (cat === "sm2") {
          // SM2：密码本存的是公钥，填入公钥框并提示（不覆盖本地私钥）
          const pubEl = document.getElementById("sm2-pub");
          if (pubEl) { pubEl.value = p.value || ""; pubEl.dispatchEvent(new Event("input")); }
          const stS = document.getElementById("sm2-status");
          if (stS) stS.textContent = t("asym.fromVaultPub").replace("{name}", p.label || "");
        } else if (targetId) {
          const el = document.getElementById(targetId);
          if (el) { el.value = p.value; el.dispatchEvent(new Event("input")); }
          /* 对称加/解密：填入密钥后联动「密钥长度」档位，并恢复保存的 IV（如有） */
          if (cat === "sym" || targetId === "sym-key") {
            /* ① 算法与分组模式联动：条目 method 形如 "AES-CBC" / "Blowfish-CTR" / "RC4" */
            if (p.method) {
              const parts = String(p.method).split("-");
              const algoSel = document.getElementById("sym-algo");
              if (algoSel && parts[0] && [...algoSel.options].some((o) => o.value === parts[0])) {
                algoSel.value = parts[0];
                if (window.updateKeySizeUI) window.updateKeySizeUI();
              }
              const modeName = parts.length > 1 ? parts[1] : "";
              if (modeName && window.setSymMode) window.setSymMode(modeName);
            }
            /* ② 密钥长度档位 */
            const kb = utf8ByteLength(p.value);
            const ksBox = document.getElementById("sym-keysize");
            if (ksBox) {
              const btn = ksBox.querySelector('button[data-bytes="' + kb + '"]');
              if (btn) {
                ksBox.querySelectorAll("button").forEach((x) => x.classList.remove("active"));
                btn.classList.add("active");
                if (window.updateKeySizeLabel) window.updateKeySizeLabel();
              }
            }
            /* ③ 恢复保存的 IV */
            if (p.iv) {
              const ivEl = document.getElementById("sym-iv");
              if (ivEl) { ivEl.value = p.iv; ivEl.dispatchEvent(new Event("input")); }
            }
            if (window.refreshSymHints) window.refreshSymHints();
          }
        }
        // 若「查看/修改密钥对」弹窗开着，刷新其中的密钥内容
        if (window.fillRsaView) window.fillRsaView();
        if (window.fillSm2View) window.fillSm2View();
        closePicker();
      })
    );
  }
  function closePicker() {
    const p = document.getElementById("pw-picker"); const m = document.getElementById("pw-mask");
    if (p) p.classList.remove("show"); if (m) m.classList.remove("show");
  }

  /* ---------- 加密后「保存到密码本」弹窗 ---------- */
  // opts: { method, password, targetId }  （targetId 为“填入”时要回填的输入框 id）
  function ensureVpEl(id, cls) {
    let el = document.getElementById(id);
    if (!el) { el = document.createElement("div"); el.id = id; el.className = cls; document.body.appendChild(el); }
    return el;
  }
  // 判断某个值是否已经存在于密码本（仅在已解锁时可判断；未解锁/无库返回 false）
  window.vaultContainsValue = function (v) {
    try {
      if (!v || !vaultExists() || isLocked()) return false;
      return readPasswords().some((p) => p.value === v);
    } catch (e) { return false; }
  };
  window.openVaultPrompt = function (opts) {
    const method = opts.method || t("vp.generic");
    const password = opts.password || "";
    const targetId = opts.targetId || null;
    const extra = opts.extra || null;   // 额外要一并保存的条目（如 RSA 公钥）
    const filterCat = opts.cat || null; // 仅展示当前功能的密码本（如对称）
    const mask = ensureVpEl("vp-mask", "vp-mask");
    const panel = ensureVpEl("vp-panel", "vp-panel");

    function closeVP() { panel.classList.remove("show"); mask.classList.remove("show"); }
    function headHtml() {
      return `<div class="vp-head"><span class="vp-title">${t("vp.title")}</span><button class="vp-close" aria-label="关闭">✕</button></div>`;
    }
    // 默认名称（RSA 一对→“我的”，导入单把→“导入的RSA秘钥”，普通→方式名）
    function defaultName() {
      if (opts.kind === "rsa-pair") return (window.__lang === "en" ? "My" : "我的");
      if (opts.kind === "rsa-import") return t("rsa.importDefault");
      return method;
    }
    // 把当前密钥写入保险库（一对 / 单把导入 / 普通），并打上分类标签
    function commitNew(name) {
      const a = readPasswords();
      const n = name || defaultName();
      const cat = filterCat || "generic";
      if (opts.kind === "rsa-pair") {
        a.push({ kind: "rsa-pair", label: n, pub: opts.pub, priv: opts.priv, cat: "rsa", slot: vaultSlot });
      } else if (opts.kind === "rsa-import") {
        a.push({ kind: "rsa-import", label: n, value: opts.password, side: opts.side, cat: "rsa", slot: vaultSlot });
      } else {
        a.push({ label: n, value: password, method: method, cat: cat, slot: vaultSlot, iv: opts.iv || null });
        if (extra) a.push({ label: n + " · " + extra.method, value: extra.password, method: extra.method, cat: cat, slot: vaultSlot });
      }
      writePasswords(a);
    }
    // 当前要保存的密钥预览（仅展示截断前后，不暴露完整 PEM）
    function curHtml() {
      if (opts.kind === "rsa-pair") {
        return `<div class="vp-cur"><span>${escapeHtml(t("vp.rsaPub"))}</span><b class="vp-mono">${escapeHtml(previewKey(opts.pub))}</b></div>` +
               `<div class="vp-cur"><span>${escapeHtml(t("vp.rsaPriv"))}</span><b class="vp-mono">${escapeHtml(previewKey(opts.priv))}</b></div>`;
      }
      if (opts.kind === "rsa-import") {
        const side = opts.side === "public" ? t("vp.rsaPub") : t("vp.rsaPriv");
        return `<div class="vp-cur"><span>${escapeHtml(side)}</span><b class="vp-mono">${escapeHtml(previewKey(opts.password))}</b></div>`;
      }
      let h = `<div class="vp-cur"><span>${escapeHtml(t("vp.method"))}</span>${methodChip(method, filterCat)}</div>` +
              `<div class="vp-cur"><span>${escapeHtml(t("vp.pw"))}</span><b class="vp-mono">${escapeHtml(previewText(password))}</b></div>`;
      if (extra) h += `<div class="vp-cur"><span>${escapeHtml(extra.method)}</span><b class="vp-mono">${escapeHtml(previewText(extra.password))}</b></div>`;
      return h;
    }
    // 已保存列表的一行（区分 一对 / 单把 / 普通；含徽章、显示/隐藏、填入、删除）
    function makeRow(p, i) {
      const row = document.createElement("div");
      row.className = "vp-item";
      const k = entryKind(p);
      const titleHtml = `${escapeHtml(entryTitle(p))} ${badgeHtml(entryBadge(p))}`;
      let methodLine = "", fullText = "";
      if (k === "rsa-pair") {
        methodLine = `<div class="vp-method">${methodChip(t("vp.rsaPub") + " / " + t("vp.rsaPriv"), "rsa")}</div>`;
      } else if (k === "rsa-import") {
        methodLine = `<div class="vp-method">${methodChip((p.side === "public" ? t("vp.rsaPub") : t("vp.rsaPriv")), "rsa")}</div>`;
        fullText = p.value || "";
      } else {
        methodLine = `<div class="vp-method">${methodChip(p.method || t("vp.generic"), p.cat || "generic")}</div>`;
        fullText = p.value || "";
      }
      const hidden = "•".repeat(Math.min(fullText.length, 12)) || "—";
      row.innerHTML =
        `<div class="vp-info">` +
          `<div class="vp-name">${titleHtml}</div>` +
          methodLine +
          (k === "rsa-pair" ? "" : `<div class="vp-val">${escapeHtml(hidden)}</div>`) +
        `</div>` +
        `<div class="vp-actions">` +
          `<button class="vp-reveal">${t("vp.reveal")}</button>` +
          (targetId ? `<button class="vp-fill">${t("vp.fill")}</button>` : "") +
          `<button class="vp-del">${t("vp.del")}</button>` +
        `</div>`;
      let revealed = false;
      row.querySelector(".vp-reveal").onclick = () => {
        revealed = !revealed;
        if (k === "rsa-pair") {
          const info = row.querySelector(".vp-info");
          info.querySelectorAll(".vp-val.revealed").forEach((n) => n.remove());
          if (revealed) {
            const mk = (txt) => { const d = document.createElement("div"); d.className = "vp-val revealed"; d.style.whiteSpace = "pre-wrap"; d.textContent = txt; return d; };
            info.appendChild(mk(p.pub));
            info.appendChild(mk(p.priv));
          }
        } else {
          const v = row.querySelector(".vp-val");
          v.textContent = revealed ? fullText : hidden;
          v.classList.toggle("revealed", revealed);
        }
        row.querySelector(".vp-reveal").textContent = revealed ? t("vp.hide") : t("vp.reveal");
      };
      /* 长按整行：弹窗查看完整内容（含公钥/私钥/方法/IV） */
      let _lpTimer = null;
      const startLP = (e) => {
        if (_lpTimer) clearTimeout(_lpTimer);
        _lpTimer = setTimeout(() => {
          _lpTimer = null;
          let detail = "";
          if (k === "rsa-pair") {
            detail = (t("vp.rsaPub") + ":\n" + (p.pub || "") + "\n\n" + t("vp.rsaPriv") + ":\n" + (p.priv || ""));
          } else if (k === "rsa-import") {
            detail = (opts.side === "public" ? t("vp.rsaPub") : t("vp.rsaPriv")) + ":\n" + (p.value || "");
          } else {
            detail = (t("vp.method") + ": " + (p.method || t("vp.generic")) + "\n" +
                      t("common.value") + ": " + (p.value || "") +
                      (p.iv ? "\nIV: " + p.iv : ""));
          }
          if (window.openEditor) {
            /* 复用一个临时 textarea 调用 openEditor（签名 ta+editable），readonly 模式只读查看 */
            const tmp = document.createElement("textarea");
            tmp.value = detail;
            window.openEditor(tmp, false);
          } else {
            alert(detail);
          }
          if (navigator.vibrate) navigator.vibrate(15);
        }, 550);
      };
      const cancelLP = () => { if (_lpTimer) { clearTimeout(_lpTimer); _lpTimer = null; } };
      row.addEventListener("touchstart", startLP, { passive: true });
      row.addEventListener("touchend", cancelLP);
      row.addEventListener("touchmove", cancelLP);
      row.addEventListener("mousedown", startLP);
      row.addEventListener("mouseup", cancelLP);
      row.addEventListener("mouseleave", cancelLP);
      row.addEventListener("contextmenu", (e) => { e.preventDefault(); startLP(e); });
      if (targetId) {
        row.querySelector(".vp-fill").onclick = () => {
          if (k === "rsa-pair") {
            const pubEl = document.getElementById("rsa-pub"), privEl = document.getElementById("rsa-priv");
            if (pubEl) { pubEl.value = p.pub; pubEl.dispatchEvent(new Event("input")); }
            if (privEl) { privEl.value = p.priv; privEl.dispatchEvent(new Event("input")); }
            if (window.rsaSaveKeys) window.rsaSaveKeys();
            const stR = document.getElementById("rsa-status");
            if (stR) stR.textContent = t("asym.fromVaultPair").replace("{name}", p.label || "");
          } else {
            const el = document.getElementById(targetId);
            if (el) { el.value = fullText; el.dispatchEvent(new Event("input")); }
            /* 对称密钥：联动算法/模式/密钥长度 + 恢复 IV */
            if (targetId === "sym-key" || (targetId && targetId.indexOf("sym-") === 0)) {
              /* ① 算法与分组模式联动（条目 method 如 AES-CBC / Blowfish-CTR / RC4） */
              if (p.method) {
                const parts = String(p.method).split("-");
                const algoSel = document.getElementById("sym-algo");
                if (algoSel && parts[0] && [...algoSel.options].some((o) => o.value === parts[0])) {
                  algoSel.value = parts[0];
                  if (window.updateKeySizeUI) window.updateKeySizeUI();
                }
                const modeName = parts.length > 1 ? parts[1] : "";
                if (modeName && window.setSymMode) window.setSymMode(modeName);
              }
              /* ② 密钥长度档位 */
              const kb = utf8ByteLength(fullText);
              const ksBox = document.getElementById("sym-keysize");
              if (ksBox) {
                const btn = ksBox.querySelector('button[data-bytes="' + kb + '"]');
                if (btn) {
                  ksBox.querySelectorAll("button").forEach((x) => x.classList.remove("active"));
                  btn.classList.add("active");
                  if (window.updateKeySizeLabel) window.updateKeySizeLabel();
                }
              }
              /* ③ IV */
              if (p.iv) {
                const ivEl = document.getElementById("sym-iv");
                if (ivEl) { ivEl.value = p.iv; ivEl.dispatchEvent(new Event("input")); }
              }
              if (window.refreshSymHints) window.refreshSymHints();
            }
            /* 填入后同步状态提示（RSA/SM2 面板的密钥框） */
            const stEl = (targetId && targetId.indexOf("sm2-") === 0) ? document.getElementById("sm2-status")
                       : (targetId && (targetId.indexOf("rsa-") === 0)) ? document.getElementById("rsa-status") : null;
            if (stEl) stEl.textContent = t((targetId && targetId.indexOf("sm2-") === 0) ? "asym.fromVaultPub" : "asym.fromVaultPair").replace("{name}", p.label || "");
          }
          closeVP();
        };
      }
      row.querySelector(".vp-del").onclick = () => {
        const a = readPasswords(); const idx = a.indexOf(p); if (idx >= 0) a.splice(idx, 1); writePasswords(a); renderVP();
      };
      return row;
    }
    function renderVP() {
      const wrap = (h) => '<div class="vp-inner">' + h + '</div>';
      if (!vaultExists() && dataEncEnabled()) {
        // 首次使用：先设主密码，再把当前密钥作为第一条记录存入（仅加密模式）
        panel.innerHTML = wrap(
          headHtml() +
          `<div class="cp-note">${t("vp.ask")}</div>` +
          `<div class="cp-form">` +
            `<input id="vp-label" placeholder="${t("vp.name")}" value="${escapeHtml(defaultName())}" />` +
            `<p class="vp-namehint">${t("vp.nameHint")}</p>` +
            curHtml() +
            `<input id="vp-mp1" type="password" placeholder="${t("common.masterPlaceholder")}" />` +
            `<input id="vp-mp2" type="password" placeholder="${t("common.confirmMaster")}" />` +
            `<div class="btn-row"><button class="btn primary" id="vp-create">${t("common.setMaster")}</button></div>` +
          `</div>`
        );
        panel.querySelector("#vp-create").onclick = () => {
          const a = panel.querySelector("#vp-mp1").value, b = panel.querySelector("#vp-mp2").value;
          const name = panel.querySelector("#vp-label").value.trim() || defaultName();
          if (!a) { alert(t("common.masterEmpty")); return; }
          if (a !== b) { alert(t("common.masterMismatch")); return; }
          setupVault(a);
          commitNew(name);
          if (window.toast) window.toast(t("common.savedOk"));
          closeVP();
        };
      } else if (isLocked()) {
        // 已加密但未解锁：先在弹窗里解锁
        panel.innerHTML = wrap(
          headHtml() +
          `<div class="cp-note">${t("common.lockedTip")}</div>` +
          `<div class="cp-form">` +
            `<input id="vp-unlock" type="password" placeholder="${t("common.masterPlaceholder")}" />` +
            `<button class="btn primary" id="vp-unlock-btn">${t("common.unlockNow")}</button>` +
          `</div>`
        );
        panel.querySelector("#vp-unlock-btn").onclick = () => {
          try { unlock(panel.querySelector("#vp-unlock").value); renderVP(); }
          catch (e) { alert(t("common.importFail")); }
        };
      } else {
        // 已解锁：新建 + 已保存列表（仅展示当前功能的密码本）
        let html = headHtml() + curHtml();
        html +=
          `<div class="cp-form" style="margin-top:10px">` +
            `<input id="vp-label" placeholder="${t("vp.name")}" value="${escapeHtml(defaultName())}" />` +
            `<p class="vp-namehint">${t("vp.nameHint")}</p>` +
            `<button class="btn primary" id="vp-save-new">${t("vp.new")}</button>` +
          `</div>`;
        const savedTitle = filterCat ? (t("cat." + filterCat) + t("vp.book")) : t("vp.saved");
        html += `<div class="vp-saved-title">${escapeHtml(savedTitle)}</div><div id="vp-list">`;
        const arr = readPasswords().filter((p) => matchCat(p, filterCat) && inSlot(p));
        if (arr.length === 0) html += `<p class="cp-note">${t("vp.none")}</p>`;
        html += `</div>`;
        html += `<div class="btn-row"><button class="btn primary" id="vp-save-new">${t("vp.saveCur")}</button><button class="btn ghost" id="vp-skip">${t("vp.skip")}</button></div>`;
        panel.innerHTML = wrap(html);
        const list = panel.querySelector("#vp-list");
        arr.forEach((p) => list.appendChild(makeRow(p, -1)));
        panel.querySelector("#vp-save-new").onclick = () => {
          const name = panel.querySelector("#vp-label") ? panel.querySelector("#vp-label").value.trim() : "";
          commitNew(name);
          if (window.toast) window.toast(t("common.savedOk"));
          closeVP();
        };
        panel.querySelector("#vp-skip").onclick = closeVP;
      }
      panel.querySelector(".vp-close").onclick = closeVP;
      mask.onclick = closeVP;
    }
    renderVP();
    panel.classList.add("show"); mask.classList.add("show");
  };

  /* ---------- 初始化 ---------- */
  function init() {
    window.__lang = resolveLang();
    applyTheme();
    applyLanguage();
    applyFont();
    applyImmersive();

    window.openSettings = openSettings; // 供底部「设置」按钮调用
    window.getSavePath = () => getSetting("savepath", "sdcard/CrytoPwa"); // 供 RSA 存文件用
    backBtn.addEventListener("click", back);
    document.querySelectorAll("[data-fill]").forEach((b) =>
      b.addEventListener("click", () => openPicker(b.dataset.fill, b.dataset.cat))
    );
    // 跟随系统主题变化时，若设为“跟随设备”则实时切换
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
        if (getSetting("theme", "system") === "system") applyTheme();
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  /* 暴露密码本 API（供 app.js 全局 data-fill 委托使用） */
  window.__vaultApi = {
    enabled: dataEncEnabled,
    isLocked: function () {
      return dataEncEnabled() ? !sessionMaster : !localStorage.getItem(PLAIN_KEY);
    },
    read: readPasswords,
    /* 列出密码本中指定分类的条目；先用 sessionMaster 解，失败则 prompt 主密码 */
    list: async function (cat) {
      if (!dataEncEnabled()) return readPasswords().filter((p) => !cat || p.cat === cat);
      if (!sessionMaster) {
        const m = await window.dialog.prompt(t("common.masterPlaceholder"));
        if (!m) return null;
        try { decryptVault(localStorage.getItem(VAULT_KEY), m); } catch (e) { window.dialog.alert(t("common.importFail")); return null; }
        sessionMaster = m;
      }
      return readPasswords().filter((p) => !cat || p.cat === cat);
    },
    /* 列出全部条目（含 rsa 密钥对）供「密码本」按钮填充 */
    listAll: async function (cat) {
      if (!dataEncEnabled()) return readPasswords().filter((p) => !cat || p.cat === cat);
      if (!sessionMaster) {
        const m = await window.dialog.prompt(t("common.masterPlaceholder"));
        if (!m) return null;
        try { decryptVault(localStorage.getItem(VAULT_KEY), m); } catch (e) { window.dialog.alert(t("common.importFail")); return null; }
        sessionMaster = m;
      }
      return readPasswords().filter((p) => !cat || p.cat === cat);
    },
  };
})();
