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
    const on = getSetting("immersive", "0") === "1";
    document.body.classList.toggle("immersive", on);
  }

  /* ---------- 莫奈取色（动态强调色） ----------
     默认 accent 为墨黑/白（中性黑灰白）；用户可在「设置→主题」里选预设或自定义取色，
     从种子色生成一套 Monet 风格的同色调色板（accent / on-accent / soft / ring），
     浅色与深色分别取不同明度，保证可读。 */
  const ACCENT_PRESETS = [
    { v: "default", bg: "#1a1a1a", name: "墨黑(默认)" },
    { v: "#07c160", bg: "#07c160", name: "微信绿" },
    { v: "#576b95", bg: "#576b95", name: "微信蓝" },
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
    const { h, s, l } = rgbToHsl(hexToRgb(seed).r, hexToRgb(seed).g, hexToRgb(seed).b);
    const sat = clamp(s, 0.45, 0.95);
    const lightAccent = hslToHex(h, sat, 0.52);
    const darkAccent = hslToHex(h, sat, 0.72);
    const onLight = relLuminance(lightAccent) < 0.45 ? "#ffffff" : "#1a1a1a";
    const onDark = relLuminance(darkAccent) < 0.45 ? "#ffffff" : "#1a1a1a";
    const softLight = hslToHex(h, clamp(s, 0.4, 0.9), 0.93);
    const softDark = hslToHex(h, clamp(s, 0.3, 0.7), 0.22);
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

  function openSettings() { stack = ["main"]; render(); overlay.classList.add("show"); overlay.removeAttribute("hidden"); }
  function closeSettings() { overlay.classList.remove("show"); overlay.setAttribute("hidden", ""); stack = []; }
  function go(name) { stack.push(name); render(); }
  function back() { stack.pop(); if (stack.length === 0) { closeSettings(); return; } render(); }

  function render() {
    const top = stack[stack.length - 1];
    if (top === "main") renderMain();
    else renderSubview(top);
  }

  function renderMain() {
    titleEl.textContent = t("set.title");
    const groups = [
      { title: t("set.grpGeneral"), items: ["display", "theme", "extcall", "exp", "storage"] },
      { title: t("set.grpData"), items: ["common", "sync"] },
      { title: t("set.grpPrivacy"), items: ["about", "privacy", "terms", "security", "personal"] },
    ];
    let html = "";
    groups.forEach((g) => {
      html += `<div class="settings-group"><div class="settings-group-title">${escapeHtml(g.title)}</div><ul class="settings-list">`;
      g.items.forEach((it) => {
        const label = t("set." + it) || t(it + ".title") || it;
        html += `<li class="settings-item" data-go="${it}"><span>${escapeHtml(label)}</span><span class="si-arrow">›</span></li>`;
      });
      html += "</ul>";
      /* 数据加密开关（数据隐私组末尾） */
      if (g.items.indexOf("sync") >= 0) {
        html += `<div class="settings-row" id="enc-row"><span class="sr-label">${t("set.dataEnc")}</span><label class="switch"><input type="checkbox" id="enc-toggle" ${dataEncEnabled() ? "checked" : ""}><span class="track"></span><span class="thumb"></span></label></div>`;
      }
      html += "</div>";
    });
    bodyEl.innerHTML = html;
    bodyEl.querySelectorAll(".settings-item").forEach((li) => (li.onclick = () => go(li.dataset.go)));
    /* 数据加密开关：默认开启；切换时在 密文(主密码) / 明文 之间迁移 */
    const encToggle = document.getElementById("enc-toggle");
    if (encToggle) {
      encToggle.onchange = () => {
        const on = encToggle.checked;
        if (on) {
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
  }

  function renderSubview(name) {
    let html = "";
    if (["about", "privacy", "terms", "security", "personal"].includes(name)) {
      titleEl.textContent = t(name + ".title");
      html = `<div class="legal-text">${t(name + ".text")}</div>`;
      if (name === "about") {
        html +=
          `<div class="btn-row" style="margin-top:18px">` +
          `<button class="btn primary" id="about-check-update">🔄 ${t("about.update")}</button>` +
          `<a class="btn ghost" href="${GITHUB_REPO}/releases" target="_blank" rel="noopener">★ ${t("about.open")}</a>` +
          `</div>` +
          `<p class="hint" id="about-update-hint" style="margin-top:10px"></p>`;
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
        `<div class="cp-note">${t("storage.locHint")}</div>` +
        `<div class="cp-form">` +
        `<input id="sp-path" value="${escapeHtml(path)}" placeholder="sdcard/CrytoPwa" />` +
        `<div class="btn-row">` +
        `<button class="btn" id="sp-pick">${t("storage.pick")}</button>` +
        `<button class="btn ghost" id="sp-reset">${t("storage.reset")}</button>` +
        `</div>` +
        `</div>` +
        `<div class="btn-row"><button class="btn primary" id="sp-save">${t("common.save")}</button></div>` +
        `<p class="hint" id="sp-pick-hint"></p>`;
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
        `<input type="color" id="accent-color" value="${seed === "default" ? "#07c160" : seed}" /></div>`;
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
      /* 实验性：分组入口（列表） */
      titleEl.textContent = t("exp.title");
      html =
        `<div class="settings-group"><ul class="settings-list">` +
        `<li class="settings-item" id="exp-go-cb"><span>${t("exp.cb")}</span><span class="si-arrow">›</span></li>` +
        `<li class="settings-item" id="exp-go-import"><span>${t("exp.import")}</span><span class="si-arrow">›</span></li>` +
        `</ul></div>`;
    } else if (name === "exp-cb") {
      /* 数据回调：处理结果回传给调用方 */
      titleEl.textContent = t("exp.cb");
      const inc = window.__incomingText || window.__incomingImage || "";
      html =
        `<div class="cp-note">${t("exp.hint")}</div>` +
        `<div class="cp-form">` +
        `<textarea id="exp-input" rows="3" placeholder="${t("exp.input")}">${escapeHtml(inc)}</textarea>` +
        `<div class="btn-row"><button class="btn primary" id="exp-gen">${t("exp.genBtn")}</button>` +
        `<button class="btn ghost" id="exp-copy">${t("exp.copy")}</button></div>` +
        `</div>` +
        `<label class="field-label">${t("exp.result")}</label>` +
        `<textarea id="exp-result" readonly rows="5"></textarea>` +
        `<label class="field-label">${t("exp.schemeTitle")}</label>` +
        `<textarea id="exp-scheme-code" readonly rows="2" style="font-family:monospace;font-size:12px"></textarea>` +
        `<label class="field-label">${t("exp.intentTitle")}</label>` +
        `<textarea id="exp-intent-code" readonly rows="3" style="font-family:monospace;font-size:12px"></textarea>` +
        `<div class="legal-text" style="margin-top:14px"><h3>${t("exp.noteTitle")}</h3><p>${t("exp.note")}</p></div>`;
    } else if (name === "exp-import") {
      /* 导入方式：外部数据如何传入本应用 */
      titleEl.textContent = t("exp.importTitle");
      html =
        `<div class="cp-note">${t("exp.importHint")}</div>` +
        `<div class="legal-text" style="margin-top:10px">` +
        `<h3>URL Scheme</h3><p>${t("exp.importUrl")}</p>` +
        `<h3>Android Intent</h3><p>${t("exp.importIntent")}</p>` +
        `<h3>系统分享</h3><p>${t("exp.importShare")}</p>` +
        `<h3>剪贴板</h3><p>${t("exp.importClip")}</p>` +
        `</div>` +
        `<div class="cp-form" style="margin-top:12px">` +
        `<input id="exp-import-example" readonly value="crypto-pwa://?text=hello" />` +
        `<div class="btn-row"><button class="btn ghost" id="exp-import-copy">${t("exp.copy")}</button></div>` +
        `</div>`;
    } else if (name === "display") {
      titleEl.textContent = t("display.title");
      const f = getSetting("font", "normal");
      const imm = getSetting("immersive", "0") === "1";
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
        `</div></div>` +
        `<div class="settings-row"><span class="sr-label">${t("disp.immersive")}</span>` +
        `<label class="switch"><input type="checkbox" id="imm-toggle" ${imm ? "checked" : ""}><span class="track"></span><span class="thumb"></span></label></div>`;
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
      document.getElementById("sp-save").onclick = () => {
        const v = (bodyEl.querySelector("#sp-path").value || "").trim() || "sdcard/CrytoPwa";
        setSetting("savepath", v);
        alert(t("storage.saved"));
        render();
      };
      /* 选择文件夹：优先用 File System Access API（Chrome/Edge 可用），否则提示手动输入 */
      const pickBtn = document.getElementById("sp-pick");
      const pickHint = document.getElementById("sp-pick-hint");
      if (pickBtn) pickBtn.onclick = async () => {
        if (window.showDirectoryPicker) {
          try {
            const h = await window.showDirectoryPicker({ id: "crypto-pwa-save" });
            const name = h.name || "selected";
            const dir = "sdcard/" + name;
            bodyEl.querySelector("#sp-path").value = dir;
            setSetting("savepath", dir);
            if (pickHint) pickHint.textContent = "✅ " + name;
          } catch (e) {
            if (e && e.name !== "AbortError" && pickHint) pickHint.textContent = t("storage.pickFail") + " " + (e.message || "");
          }
        } else if (pickHint) {
          pickHint.textContent = t("storage.pickUnsupported");
        }
      };
      const resetBtn = document.getElementById("sp-reset");
      if (resetBtn) resetBtn.onclick = () => {
        setSetting("savepath", "sdcard/CrytoPwa");
        bodyEl.querySelector("#sp-path").value = "sdcard/CrytoPwa";
        if (pickHint) pickHint.textContent = "";
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
      const immT = document.getElementById("imm-toggle");
      if (immT) immT.onchange = () => {
        setSetting("immersive", immT.checked ? "1" : "0");
        applyImmersive();
        render();
      };
    } else if (name === "extcall") {
      const et = document.getElementById("ext-toggle");
      if (et) et.onchange = () => { setSetting("ext_incoming", et.checked ? "1" : "0"); render(); };
      const exCopy = bodyEl.querySelector("#ext-copy");
      if (exCopy) exCopy.onclick = (e) => {
        const v = bodyEl.querySelector("#ext-example").value;
        if (window.copyText) window.copyText(v, e.target);
      };
    } else if (name === "exp") {
      /* 实验性列表入口 */
      const goCb = bodyEl.querySelector("#exp-go-cb");
      if (goCb) goCb.onclick = () => go("exp-cb");
      const goImp = bodyEl.querySelector("#exp-go-import");
      if (goImp) goImp.onclick = () => go("exp-import");
    } else if (name === "exp-cb") {
      /* 数据回调：生成回调数据（成功/时间戳/处理后数据）+ 回调地址示例 */
      bodyEl.querySelector("#exp-gen").onclick = () => {
        const d = bodyEl.querySelector("#exp-input").value;
        const payload = { ok: !!d, ts: new Date().toISOString(), data: d || "", app: "CryptPwa" };
        const json = JSON.stringify(payload, null, 2);
        const enc = encodeURIComponent(JSON.stringify(payload));
        bodyEl.querySelector("#exp-result").value = json;
        bodyEl.querySelector("#exp-scheme-code").value = "myapp://crypto-callback?result=" + enc;
        bodyEl.querySelector("#exp-intent-code").value = "intent://crypto-callback?result=" + enc + "#Intent;scheme=myapp;package=com.example.caller;end";
      };
      bodyEl.querySelector("#exp-copy").onclick = (e) => {
        const v = bodyEl.querySelector("#exp-result").value;
        if (v && window.copyText) window.copyText(v, e.target);
      };
    } else if (name === "exp-import") {
      /* 导入方式：复制 URL Scheme 示例 */
      const ic = bodyEl.querySelector("#exp-import-copy");
      if (ic) ic.onclick = (e) => {
        const v = bodyEl.querySelector("#exp-import-example").value;
        if (window.copyText) window.copyText(v, e.target);
      };
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
            if (window.confirm(msg + "\n\n" + t("about.open") + "？")) {
              window.open(rel.html_url || GITHUB_REPO + "/releases", "_blank");
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

    if (!vaultExists() && dataEncEnabled()) {
      /* 首次使用：设置主密码，之后才创建空库（仅加密模式） */
      html =
        `<div class="cp-note">${t("common.masterHint")}</div>` +
        `<div class="cp-form">` +
        `<input id="mp1" type="password" placeholder="${t("common.masterPlaceholder")}" />` +
        `<input id="mp2" type="password" placeholder="${t("common.confirmMaster")}" />` +
        `<div class="btn-row"><button class="btn primary" id="mp-set">${t("common.setMaster")}</button></div>` +
        `</div>`;
    } else if (isLocked()) {
      /* 已加密但未解锁 */
      html =
        `<div class="cp-note">${t("common.lockedTip")}</div>` +
        `<div class="cp-form">` +
        `<input id="mpu" type="password" placeholder="${t("common.masterPlaceholder")}" />` +
        `<div class="btn-row"><button class="btn primary" id="mp-unlock">${t("common.unlockNow")}</button></div>` +
        `</div>`;
    } else {
      /* 已解锁：列表 + 新增 + 导入导出 + 锁/改密（按当前密码库展示） */
      const all = readPasswords();
      const arr = all.filter((p) => inSlot(p));
      html =
        `<div class="seg-inline vault-slot-seg" id="vault-slot-seg">` +
          `<button data-v="0" class="${vaultSlot === 0 ? "active" : ""}">${t("vault.slot1")}</button>` +
          `<button data-v="1" class="${vaultSlot === 1 ? "active" : ""}">${t("vault.slot2")}</button>` +
          `<button data-v="2" class="${vaultSlot === 2 ? "active" : ""}">${t("vault.slot3")}</button>` +
        `</div>` +
        `<div class="cp-note">${t("common.vaultReady")}</div>` +
        `<div class="cp-form">` +
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
        `<button class="btn ghost" id="cp-export">${t("common.export")}</button>` +
        `<button class="btn ghost" id="cp-import">${t("common.import")}</button>` +
        `</div>` +
        `<input type="file" id="cp-file" accept="application/json,.json" style="display:none" />` +
        `<div class="btn-row">` +
        `<button class="btn ghost" id="mp-change">${t("common.changeMaster")}</button>` +
        `<button class="btn ghost" id="mp-lock">${t("common.lock")}</button>` +
        `</div>`;
    }
    bodyEl.innerHTML = html;
    appendAskToggle();

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
          const nv = window.prompt(t("rsa.rename") + "：", p.label || "");
          if (nv === null) return;
          const a = readPasswords(); a[i].label = nv.trim() || a[i].label; writePasswords(a); render();
        };
        list.appendChild(row);
      });
      bodyEl.querySelector("#cp-save").onclick = () => {
        const name = bodyEl.querySelector("#cp-name").value.trim();
        const val = bodyEl.querySelector("#cp-val").value;
        const m = bodyEl.querySelector("#cp-method").value.trim() || t("vp.generic");
        const cat = bodyEl.querySelector("#cp-cat") ? bodyEl.querySelector("#cp-cat").value : "generic";
        if (!name || !val) { alert(t("common.label") + " / " + t("common.value")); return; }
        const a = readPasswords(); a.push({ label: name, value: val, method: m, cat: cat, slot: vaultSlot }); writePasswords(a); render();
      };
      /* 密码库切换：点击库号 → 记忆并重绘（展示对应库的密码） */
      const slotSeg = bodyEl.querySelector("#vault-slot-seg");
      if (slotSeg) slotSeg.querySelectorAll("button").forEach((b) =>
        (b.onclick = () => { setVaultSlot(parseInt(b.dataset.v, 10) || 0); render(); })
      );
      /* 导出（CryptoData.json：弹窗选 加密保存 / 明文保存） */
      bodyEl.querySelector("#cp-export").onclick = () => {
        if (isLocked()) { alert(t("exp.locked")); return; }
        const mask = ensureEl("exp-mask", "vp-mask");
        const panel = ensureEl("exp-panel", "vp-panel");
        panel.innerHTML =
          `<div class="vp-inner">` +
          `<div class="vp-head"><span class="vp-title">${t("exp.title")}</span><button class="vp-close" id="exp-close">✕</button></div>` +
          `<div class="kv-tpl-list">` +
          `<button class="kv-tpl-opt" id="exp-enc">${t("exp.enc")}</button>` +
          `<button class="kv-tpl-opt" id="exp-plain">${t("exp.plain")}</button>` +
          `</div></div>`;
        mask.classList.add("show"); panel.classList.add("show");
        const close = () => { mask.classList.remove("show"); panel.classList.remove("show"); };
        panel.querySelector("#exp-close").onclick = close;
        mask.onclick = close;
        const doExport = (enc) => {
          const arr = readPasswords();
          const ud = enc ? encryptVault(arr, sessionMaster) : JSON.stringify(arr);
          const blob = new Blob([JSON.stringify({ Version: "V1.0", UpdateTime: new Date().toISOString(), UserData: ud }, null, 2)], { type: "application/json" });
          const aEl = document.createElement("a");
          aEl.href = URL.createObjectURL(blob);
          aEl.download = "CryptoData.json";
          aEl.click();
          URL.revokeObjectURL(aEl.href);
          alert(t("exp.done"));
          close();
        };
        panel.querySelector("#exp-enc").onclick = () => doExport(true);
        panel.querySelector("#exp-plain").onclick = () => doExport(false);
      };
      /* 导入（CryptoData 加密/明文 + 兼容旧备份包） */
      const fileInput = bodyEl.querySelector("#cp-file");
      bodyEl.querySelector("#cp-import").onclick = () => fileInput.click();
      fileInput.onchange = () => {
        const f = fileInput.files[0]; if (!f) return;
        const reader = new FileReader();
        reader.onload = () => {
          const txt = reader.result;
          try {
            if (isBackupBundle(txt)) { applyBackup(txt); render(); alert(t("common.importDone")); return; }
            const o = JSON.parse(txt);
            if (!o || o.Version !== "V1.0" || typeof o.UserData !== "string") throw new Error("fmt");
            const ud = JSON.parse(o.UserData);
            if (ud && typeof ud === "object" && ud.ct && ud.salt && ud.iv) {
              /* 加密文件：输入主密码解密后写入 */
              const master = window.prompt(t("common.masterPlaceholder"));
              if (!master) return;
              writePasswords(decryptVault(o.UserData, master));
            } else if (Array.isArray(ud)) {
              writePasswords(ud); // 明文文件
            } else throw new Error("fmt");
            render(); alert(t("common.importDone"));
          } catch (e) { alert(t("common.importFail")); }
        };
        reader.readAsText(f);
      };
      /* 修改主密码 */
      bodyEl.querySelector("#mp-change").onclick = () => {
        const cur = window.prompt(t("common.masterPlaceholder"));
        if (!cur) return;
        let arr;
        try { arr = decryptVault(localStorage.getItem(VAULT_KEY), cur); }
        catch (e) { alert(t("common.importFail")); return; }
        const nw = window.prompt(t("common.confirmMaster"));
        if (!nw) return;
        sessionMaster = nw;
        localStorage.setItem(VAULT_KEY, encryptVault(arr, nw));
        alert(t("common.changeMaster") + " ✅"); render();
      };
      /* 锁定（清空内存中的主密码） */
      bodyEl.querySelector("#mp-lock").onclick = () => { lock(); render(); };
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
      const master = window.prompt(t("common.masterPlaceholder"));
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
      `<button class="btn ghost" id="wd-test"><span class="wd-dot" id="wd-dot"></span><span id="wd-test-label">${t("sync.test")}</span></button>` +
      `</div>` +
      `<p class="hint" id="wd-test-hint"></p>` +
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
    /* 检测连接：用当前输入框的地址/账号/密码发 WebDAV PROPFIND 测联通性（无需先保存） */
    const wdDot = bodyEl.querySelector("#wd-dot");
    const wdTestBtn = bodyEl.querySelector("#wd-test");
    const wdTestHint = bodyEl.querySelector("#wd-test-hint");
    if (wdTestBtn && wdDot) {
      wdTestBtn.onclick = async () => {
        const cfg = {
          url: bodyEl.querySelector("#wd-url").value.trim(),
          user: bodyEl.querySelector("#wd-user").value,
          pass: bodyEl.querySelector("#wd-pass").value,
        };
        if (!cfg.url) { alert(t("sync.needUrl")); return; }
        wdDot.className = "wd-dot"; // 置灰（检测中）
        if (wdTestHint) wdTestHint.textContent = t("sync.testing");
        wdTestBtn.disabled = true;
        const label = wdTestBtn.querySelector("#wd-test-label");
        const orig = label ? label.textContent : "";
        if (label) label.textContent = t("sync.testing");
        try {
          const res = await fetch(wdTarget(cfg), {
            method: "PROPFIND",
            headers: { "Authorization": wdAuth(cfg.user, cfg.pass), "Depth": "0" },
          });
          if (!(res.ok || res.status === 207)) throw new Error("HTTP " + res.status);
          wdDot.className = "wd-dot ok"; // 绿：联通
          if (wdTestHint) wdTestHint.textContent = t("sync.testOk");
        } catch (e) {
          wdDot.className = "wd-dot bad"; // 红：不联通
          if (wdTestHint) wdTestHint.textContent = t("sync.testFail") + (e.message || "");
        }
        wdTestBtn.disabled = false;
        if (label) label.textContent = orig;
      };
    }
    bodyEl.querySelector("#wd-backup").onclick = () => {
      /* 先让用户勾选备份范围（密码本 / 软件配置），再上传 WebDAV */
      pickScope(false, async (scope) => {
        try { await webdavBackup(scope); alert(t("sync.backupDone")); }
        catch (e) { if (e.message !== "cancel") alert(t("sync.fail") + e.message); }
      });
    };
    bodyEl.querySelector("#wd-restore").onclick = () => {
      pickScope(true, async (scope) => {
        try { await webdavRestore(scope); render(); alert(t("sync.restoreDone")); }
        catch (e) { if (e.message !== "cancel") alert(t("sync.fail") + e.message); }
      });
    };
    /* 导出本地备份（先勾选范围，再下载 JSON 文件） */
    bodyEl.querySelector("#wd-export-local").onclick = () => {
      pickScope(false, (scope) => {
        const blob = new Blob([buildBackup(scope)], { type: "application/json" });
        const aEl = document.createElement("a");
        aEl.href = URL.createObjectURL(blob);
        aEl.download = "crypto-pwa-backup.json";
        aEl.click();
        URL.revokeObjectURL(aEl.href);
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
        const master = window.prompt(t("common.masterPlaceholder"));
        if (!master) return;
        try { importVault(txt, master); render(); alert(t("sync.importDone")); }
        catch (e) { alert(t("sync.importFail")); }
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
          alert(t("common.savedOk"));
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
        html += `<button class="btn ghost" id="vp-skip">${t("vp.skip")}</button>`;
        panel.innerHTML = wrap(html);
        const list = panel.querySelector("#vp-list");
        arr.forEach((p) => list.appendChild(makeRow(p, -1)));
        panel.querySelector("#vp-save-new").onclick = () => {
          commitNew(panel.querySelector("#vp-label").value.trim());
          renderVP();
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
})();
