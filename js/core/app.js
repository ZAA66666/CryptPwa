/* =====================================================================
 * 加解密工具箱 —— 主逻辑（手写，带中文注释）
 * 依赖（页面已通过 <script> 引入，挂为全局对象）：
 *   - CryptoJS        ：哈希 / 对称加密（crypto-js 库，成熟可信）
 *   - qrcode          ：二维码生成（qrcode-generator 库）
 *   - window.crypto   ：RSA 非对称（浏览器原生 Web Crypto，仅 https/localhost 可用）
 * 本文件负责「界面交互 + 调用算法 + 结果展示」。
 * ===================================================================== */

/* ---------- 0. 通用小工具 ---------- */

/* ---------- 全局日志：无论开关都记录（localStorage 环形缓冲 500 条），便于问题排查 ---------- */
(function () {
  const LKEY = "crypto_log_v1";
  window.__log = function (tag, msg) {
    try {
      let arr = [];
      try { arr = JSON.parse(localStorage.getItem(LKEY) || "[]"); } catch (e) { arr = []; }
      arr.push({ ts: new Date().toISOString(), tag: String(tag), msg: String(msg).slice(0, 500) });
      if (arr.length > 500) arr = arr.slice(-500);
      localStorage.setItem(LKEY, JSON.stringify(arr));
    } catch (e) {}
  };
  window.__getLog = function () { try { return JSON.parse(localStorage.getItem(LKEY) || "[]"); } catch (e) { return []; } };
  window.__clearLog = function () { try { localStorage.removeItem(LKEY); } catch (e) {} };
  window.addEventListener("error", function (e) {
    try { window.__log("error", (e.message || "") + " @" + (e.filename || "") + ":" + (e.lineno || "")); } catch (x) {}
  });
  window.addEventListener("unhandledrejection", function (e) {
    try { window.__log("error", "unhandledrejection: " + String(e.reason && e.reason.message || e.reason)); } catch (x) {}
  });
  let ver = "";
  try { ver = window.APP_VERSION || (typeof APP_VERSION !== "undefined" ? APP_VERSION : ""); } catch (e) {}
  window.__log("app", "启动 v" + ver + " UA=" + (navigator.userAgent || "").slice(0, 100));
})();

// 复制文本到剪贴板（兼容非安全上下文的降级方案）
/* 复制上限：超过该字节数视为大内容（剪贴板受限），提示改为保存文件 */
const COPY_FILE_LIMIT = 5000;
function copyText(text, btn) {
  if (!text) return;
  /* 大内容：自动判别是否超过剪贴板限制 → 提示另存为文件（保存到设置的保存路径） */
  if (utf8ByteLength(text) > COPY_FILE_LIMIT) {
    if (window.dialog) {
      window.dialog.confirm(_t("copy.bigFileAsk", "内容较大（超过约 5000 字节，剪贴板可能放不下）\n是否保存为文件？"), { title: _t("dlg.confirm", "确认") })
        .then((ok) => {
          if (!ok) return;
          const name = "result_" + new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19).replace("T", "_") + ".txt";
          saveTextFile(name, text);
        });
    } else {
      const ok = window.confirm(_t("copy.bigFileAsk", "内容较大（超过约 5000 字节，剪贴板可能放不下）\n是否保存为文件？"));
      if (!ok) return;
      const name = "result_" + new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19).replace("T", "_") + ".txt";
      saveTextFile(name, text);
    }
    return;
  }
  const done = () => { const o = btn.textContent; btn.textContent = "✅ 已复制"; setTimeout(() => (btn.textContent = o), 1200); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
}
function fallbackCopy(text, done) {
  const ta = document.createElement("textarea");
  ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select();
  try { document.execCommand("copy"); done(); } catch (e) {}
  document.body.removeChild(ta);
}

// 字符串的 UTF-8 字节长度（一个汉字通常 3 字节）
function utf8ByteLength(str) { return new TextEncoder().encode(str).length; }

// 显示红字错误
function showError(el, msg) { el.textContent = msg; el.classList.add("error"); }

// 加密后是否弹出“保存到密码本”提示：受设置开关控制，且同一密钥已存过则不再询问
function maybePromptVault(opts) {
  try { if (localStorage.getItem("set_ask_save") === "0") return; } catch (e) {}
  if (window.vaultContainsValue && window.vaultContainsValue(opts.password)) return;
  if (window.openVaultPrompt) window.openVaultPrompt(opts);
}

/* ---------- 1. 面板切换（底部导航 + 主页卡片 通用） ---------- */
let asymAlgo = "rsa"; // 「加/解密」面板当前算法：rsa | sm2
let symCat = "sym";   // 「加/解密」面板当前类别：sym(对称) | asym(非对称)
function setSymCat(v) {
  symCat = v;
  const tabs = document.querySelectorAll("#sym-cat button");
  tabs.forEach((b) => b.classList.toggle("active", b.dataset.v === v));
  const paneSym = document.getElementById("sym-pane-sym");
  const paneAsym = document.getElementById("sym-pane-asym");
  if (paneSym) paneSym.hidden = v !== "sym";
  if (paneAsym) paneAsym.hidden = v !== "asym";
  if (v === "asym") setAsymAlgo(asymAlgo);
}
function setAsymAlgo(v) {
  asymAlgo = v;
  const btn = document.querySelector('#asym-algo button[data-v="' + v + '"]');
  if (btn) {
    document.querySelectorAll("#asym-algo button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  }
  const paneR = document.getElementById("asym-pane-rsa");
  const paneS = document.getElementById("asym-pane-sm2");
  if (paneR) paneR.hidden = v !== "rsa";
  if (paneS) paneS.hidden = v !== "sm2";
  if (v === "sm2") { if (typeof ensureSm2Keys === "function") ensureSm2Keys(); }
  else if (typeof ensureRsaKeys === "function") ensureRsaKeys();
}
/* ---------- 状态栏：预留空间 + 文字色可见 ---------- */
/* 预留空间由原生层保证：capacitor.config.json 的 StatusBar.overlaysWebView=false +
   MainActivity.setDecorFitsSystemWindows(true)，WebView 不再压到状态栏底下，主页内容永不遮挡。
   JS 只负责按页面切换状态栏底色 + 用 DARK 深色图标，保证时钟/电池等永远看得清。 */
function setStatusBar(name) {
  try {
    const sb = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.StatusBar;
    if (!sb || !sb.setStyle) return;
    const GREEN = "#00a862", LIGHT = "#f2f3f5"; // LIGHT 与功能页/设置页浅色背景一致
    if (name === "home") { sb.setBackgroundColor({ color: GREEN }); sb.setStyle({ style: "DARK" }); }
    else { sb.setBackgroundColor({ color: LIGHT }); sb.setStyle({ style: "DARK" }); }
  } catch (e) {}
}
(function () {
  // 设置页打开/关闭时同步状态栏（底层是主页则绿底，否则浅底）
  const ov = document.getElementById("settings-overlay");
  if (ov) {
    const sync = () => setStatusBar(ov.hasAttribute("hidden")
      ? (document.body.classList.contains("on-home") ? "home" : "tool")
      : "settings");
    new MutationObserver(sync).observe(ov, { attributes: true, attributeFilter: ["hidden"] });
  }
})();
function showPanel(name) {
  if (name === "asym") { name = "sym"; symCat = "asym"; } // 非对称并入「加/解密」面板
  if (name === "sm2") { name = "sym"; symCat = "asym"; asymAlgo = "sm2"; } // SM2 并入「加/解密」面板
  const panel = document.getElementById("panel-" + name);
  if (!panel) return;
  document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
  panel.classList.add("active");
  // 主页才显示顶部 Toolbar（含三点菜单）；进入功能页时隐藏，用面板内返回键
  document.body.classList.toggle("on-home", name === "home");
  // 状态栏：主页绿底 / 功能页浅底 / 设置页浅底——统一用深色字（DARK）保证时钟电池等图标始终可见
  setStatusBar(name === "home" ? "home" : "tool");
  // 进入「加/解密」面板：恢复上次类别，并按算法确保密钥存在
  if (name === "sym") setSymCat(symCat);
  window.scrollTo(0, 0);
}
// 加/解密面板：类别切换（对称加密 / 非对称加密）
document.querySelectorAll("#sym-cat button").forEach((b) => {
  b.addEventListener("click", () => setSymCat(b.dataset.v));
});
// 加/解密面板：算法切换（RSA / SM2）
document.querySelectorAll("#asym-algo button").forEach((b) => {
  b.addEventListener("click", () => setAsymAlgo(b.dataset.v));
});

/* ---------- Toolbar 三点菜单（设置入口） ---------- */
(function () {
  const moreBtn = document.getElementById("tb-more");
  const menu = document.getElementById("tb-menu");
  if (!moreBtn || !menu) return;
  const close = () => menu.setAttribute("hidden", "");
  moreBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (menu.hasAttribute("hidden")) menu.removeAttribute("hidden");
    else close();
  });
  document.getElementById("tb-menu-settings").addEventListener("click", () => {
    close();
    if (window.openSettings) window.openSettings();
    else location.href = "#settings";
  });
  document.getElementById("tb-menu-about").addEventListener("click", () => {
    close();
    if (window.openSettings) window.openSettings("about");
  });
  document.addEventListener("click", (e) => {
    if (!menu.hasAttribute("hidden") && !menu.contains(e.target) && e.target !== moreBtn) close();
  });
  document.addEventListener("scroll", close, { passive: true });
})();
// 主页工具列表：点击跳到对应面板（含底部栏没有的「教程」）
document.querySelectorAll(".tool-row").forEach((card) => {
  card.addEventListener("click", () => showPanel(card.dataset.go));
});
// 功能面板内的返回键：回到主页
document.querySelectorAll(".ph-back").forEach((b) => {
  b.addEventListener("click", () => showPanel("home"));
});

/* ---------- 1.5 历史记录（localStorage，只记“用了什么”+ 简短预览） ---------- */
const HKEY = "crypto_history_v1";
function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HKEY)) || []; } catch (e) { return []; }
}
function saveHistory(arr) {
  try { localStorage.setItem(HKEY, JSON.stringify(arr.slice(0, 50))); } catch (e) {}
}
function addHistory(item) {
  const arr = loadHistory();
  arr.unshift({ t: Date.now(), ...item });
  saveHistory(arr);
  renderHistory();
}
function fmtHistoryTime(ts) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
// 轻量 toast 提示（不阻塞，自动消失）
let __toastTimer = null;
function toast(msg, ms = 1800) {
  let el = document.getElementById("app-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "app-toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(__toastTimer);
  __toastTimer = setTimeout(() => el.classList.remove("show"), ms);
}

/* ---------- 统一弹窗系统（替代默认 alert/confirm/prompt，中心扩散动画） ---------- */
(function () {
  let maskEl = null, boxEl = null;
  const _esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  function ensure() {
    if (!maskEl) {
      maskEl = document.createElement("div");
      maskEl.id = "dlg-mask"; maskEl.className = "dlg-mask";
      document.body.appendChild(maskEl);
      boxEl = document.createElement("div");
      boxEl.id = "dlg-box"; boxEl.className = "dlg-box";
      document.body.appendChild(boxEl);
    }
    return boxEl;
  }
  function close() {
    if (maskEl) { maskEl.classList.remove("show"); boxEl.classList.remove("show"); }
  }
  function open(html, cls) {
    const box = ensure();
    box.className = "dlg-box" + (cls ? " " + cls : "");
    box.innerHTML = html;
    maskEl.classList.add("show");
    box.classList.add("show");
    return box;
  }
  const T = (k, f) => (typeof t === "function" ? (t(k) === k ? f : t(k)) : f);
  window.dialog = {
    /* 提示 */
    alert: function (msg, title) {
      return new Promise((res) => {
        const box = open(
          `<div class="dlg-title">${_esc(title || T("dlg.tip", "提示"))}</div>` +
          `<div class="dlg-body">${String(msg == null ? "" : msg).replace(/\n/g, "<br>")}</div>` +
          `<div class="dlg-actions"><button class="btn primary" id="dlg-ok">${_esc(T("dlg.ok", "确定"))}</button></div>`
        );
        const ok = box.querySelector("#dlg-ok");
        if (ok) ok.focus();
        const done = () => { close(); ok.removeEventListener("click", done); maskEl.removeEventListener("click", done); res(); };
        if (ok) ok.addEventListener("click", done);
        maskEl.addEventListener("click", done);
      });
    },
    /* 确认：返回 Promise<boolean> */
    confirm: function (msg, opts) {
      opts = opts || {};
      return new Promise((res) => {
        const box = open(
          `<div class="dlg-title">${_esc(opts.title || T("dlg.confirm", "确认"))}</div>` +
          `<div class="dlg-body">${String(msg == null ? "" : msg).replace(/\n/g, "<br>")}</div>` +
          `<div class="dlg-actions">` +
          `<button class="btn ghost" id="dlg-no">${_esc(opts.noLabel || T("dlg.cancel", "取消"))}</button>` +
          `<button class="btn primary" id="dlg-yes">${_esc(opts.yesLabel || T("dlg.ok", "确定"))}</button>` +
          `</div>`
        );
        const done = (v) => { close(); res(v); };
        box.querySelector("#dlg-no").addEventListener("click", () => done(false));
        box.querySelector("#dlg-yes").addEventListener("click", () => done(true));
        maskEl.addEventListener("click", () => done(false));
      });
    },
    /* 输入：返回 Promise<string|null> */
    prompt: function (msg, placeholder) {
      return new Promise((res) => {
        const box = open(
          `<div class="dlg-title">${_esc(T("dlg.input", "输入"))}</div>` +
          `<div class="dlg-body">${String(msg == null ? "" : msg).replace(/\n/g, "<br>")}</div>` +
          `<input id="dlg-input" type="text" placeholder="${_esc(placeholder || "")}" />` +
          `<div class="dlg-actions">` +
          `<button class="btn ghost" id="dlg-no">${_esc(T("dlg.cancel", "取消"))}</button>` +
          `<button class="btn primary" id="dlg-yes">${_esc(T("dlg.ok", "确定"))}</button>` +
          `</div>`
        );
        const inp = box.querySelector("#dlg-input");
        const done = (v) => { close(); res(v); };
        box.querySelector("#dlg-no").addEventListener("click", () => done(null));
        box.querySelector("#dlg-yes").addEventListener("click", () => done(inp.value));
        maskEl.addEventListener("click", () => done(null));
        setTimeout(() => inp.focus(), 60);
      });
    },
    /* 底部动作表（bottom sheet） */
    sheet: function (items, title) {
      return new Promise((res) => {
        const list = items.map((it, i) =>
          `<button class="sheet-item" data-i="${i}">${_esc(it.label)}${it.desc ? `<span class="sheet-desc">${_esc(it.desc)}</span>` : ""}</button>`
        ).join("");
        const box = open(
          `<div class="sheet-title">${_esc(title || "")}</div><div class="sheet-list">${list}</div>`,
          "dlg-sheet"
        );
        const done = (i) => { close(); res(items[i] || null); };
        box.querySelectorAll(".sheet-item").forEach((b) =>
          b.addEventListener("click", () => done(parseInt(b.dataset.i, 10)))
        );
        maskEl.addEventListener("click", () => done(-1));
      });
    },
    close: close,
  };
  /* 覆盖系统 alert（无返回值，安全）；confirm/prompt 保持系统原样（同步 API 不破坏既有逻辑），
     新代码请用 dialog.confirm / dialog.prompt（异步 Promise） */
  window.alert = function (m) { window.dialog.alert(m); };
})();
// 分类 → 主页工具图标（与工具网格一致），历史记录用图标而非文字徽章
const CAT_ICONS = {
  hash: '<path d="M9 4 7 20"/><path d="M17 4 15 20"/><path d="M4 9h16"/><path d="M3.5 15h17"/>',
  enc: '<path d="M9 8 5 12l4 4"/><path d="M15 8l4 4-4 4"/><path d="M13 6l-2 12"/>',
  sym: '<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  rsa: '<circle cx="8.5" cy="8.5" r="3.6"/><path d="M11 11 20 20"/><path d="M16.5 16.5 19 14"/><path d="M14.5 14.5 17 12"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="5" y="5" width="3" height="3" rx="0.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="16" y="5" width="3" height="3" rx="0.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><rect x="5" y="16" width="3" height="3" rx="0.6"/><rect x="14" y="14" width="3" height="3" rx="1"/><rect x="18" y="18" width="3" height="3" rx="1"/>',
  json: '<path d="M8 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h2"/><path d="M16 3h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2"/><path d="M9 9l3 3-3 3"/><path d="M15 9l-3 3 3 3"/>',
  txt: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
  sm2: '<path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z"/><path d="M9 12l2 2 4-4"/>',
  cron: '<circle cx="12" cy="13" r="7"/><path d="M12 9v4l2.5 2.5"/><path d="M9 2h6"/>',
  rand: '<rect x="4" y="4" width="7" height="7" rx="1.4"/><circle cx="7.5" cy="7.5" r="1"/><rect x="13" y="13" width="7" height="7" rx="1.4"/><circle cx="16.5" cy="16.5" r="1"/>',
  // 旧记录兼容：中文分类标签
  "编码": '<path d="M9 8 5 12l4 4"/><path d="M15 8l4 4-4 4"/><path d="M13 6l-2 12"/>',
  "哈希": '<path d="M9 4 7 20"/><path d="M17 4 15 20"/><path d="M4 9h16"/><path d="M3.5 15h17"/>',
  "对称": '<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  "RSA": '<circle cx="8.5" cy="8.5" r="3.6"/><path d="M11 11 20 20"/><path d="M16.5 16.5 19 14"/><path d="M14.5 14.5 17 12"/>',
  "二维码": '<rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="5" y="5" width="3" height="3" rx="0.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="16" y="5" width="3" height="3" rx="0.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><rect x="5" y="16" width="3" height="3" rx="0.6"/><rect x="14" y="14" width="3" height="3" rx="1"/><rect x="18" y="18" width="3" height="3" rx="1"/>'
};
function catIcon(cat) {
  const inner = CAT_ICONS[cat] || '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>';
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}
// 历史名称按当前语言即时生成（切换语言后“最近使用”会同步翻译）
function historyDisplayName(it) {
  const L = (k) => (typeof t === "function" ? t(k) : k);
  if (it.cat === "hash") return L("hist.hash") + "-" + (it.method || it.name || "");
  if (it.cat === "enc") {
    if (it.op === "imgb64") return L("hist.imgB64");
    const opL = it.op === "dec" ? L("enc.decode") : L("enc.encode");
    return (it.method || "") + " " + opL;
  }
  if (it.cat === "sym") {
    const opL = it.op === "decrypt" ? L("op.decrypt") : L("op.encrypt");
    return L("hist.sym") + "-" + (it.method || "") + " " + opL + (it.extra ? " " + it.extra : "");
  }
  if (it.cat === "rsa") {
    const m = { encrypt: "op.encrypt", decrypt: "op.decrypt", sign: "op.sign", verify: "op.verify" }[it.op] || it.op;
    return L("cat.rsa") + "-" + L(m);
  }
  if (it.cat === "sm2") {
    const m = { encrypt: "op.encrypt", decrypt: "op.decrypt", sign: "op.sign", verify: "op.verify" }[it.op] || it.op;
    return "SM2-" + L(m);
  }
  if (it.cat === "qr") {
    if (it.op === "bc") return L("hist.bc") + "-" + L("hist.gen");
    return L("hist.qr") + "-" + (it.op === "scan" ? L("hist.scan") : L("hist.gen"));
  }
  if (it.cat === "json") {
    const opL = { fmt: L("json.tabFmt"), minify: L("json.minify"), validate: L("json.validate"), extract: L("json.tabExtract"), kv: L("json.tabKv") }[it.op] || it.op;
    return L("hist.json") + "-" + opL;
  }
  if (it.cat === "cron") return L("cat.cron") + "-" + (it.preview || L("cron.parse"));
  if (it.cat === "rand") return L("cat.rand") + "-" + (it.method || "");
  return it.name || it.method || "";
}
function renderHistory() {
  const list = document.getElementById("history-list");
  const empty = document.getElementById("history-empty");
  if (!list) return;
  const arr = loadHistory();
  list.innerHTML = "";
  if (arr.length === 0) { if (empty) empty.style.display = ""; return; }
  if (empty) empty.style.display = "none";
  const f = (typeof window.__histFilter === "string" && window.__histFilter) || "all";
  const filtered = f === "all" ? arr : arr.filter((it) => it.cat === f);
  if (filtered.length === 0) { if (empty) { empty.textContent = (typeof t === "function" ? t("hist.none") : "该分类暂无记录"); empty.style.display = ""; } return; }
  if (empty) empty.style.display = "none";
  filtered.forEach((it) => {
    const sub = (it.preview || "") + (it.extra ? " · " + it.extra : "");
    // 分类本地化名称（仅作 title 提示，主视觉用图标）
    let catName = it.cat;
    if (typeof t === "function") {
      const v = t("cat." + it.cat);
      if (v !== "cat." + it.cat) catName = v;
    }
    const li = document.createElement("li");
    li.className = "history-item";
    li.innerHTML =
      `<span class="hi-ico" title="${escapeHtml(catName)}">${catIcon(it.cat)}</span>` +
      `<span class="hi-main"><div class="hi-name">${escapeHtml(historyDisplayName(it))}</div>` +
      `<div class="hi-sub">${escapeHtml(sub)}</div></span>` +
      `<span class="hi-time">${fmtHistoryTime(it.t)}</span>`;
    if (it.go) {
      li.classList.add("clickable");
      li.dataset.go = it.go;
      li.title = (typeof t === "function" ? t("home.tapBack") : "点击回到该功能");
      li.addEventListener("click", () => showPanel(it.go));
    }
    list.appendChild(li);
  });
}
/* 历史记录：类型筛选 */
(function () {
  const wrap = document.getElementById("hist-filters");
  if (!wrap) return;
  wrap.querySelectorAll(".chip").forEach((b) => {
    b.addEventListener("click", () => {
      wrap.querySelectorAll(".chip").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      window.__histFilter = b.dataset.f;
      renderHistory();
    });
  });
})();
/* 历史记录：导出 JSON */
document.getElementById("history-export").addEventListener("click", () => {
  const arr = loadHistory();
  if (!arr.length) { toast(t("hist.emptyTip")); return; }
  const name = "history_" + new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19).replace("T", "_") + ".json";
  window.downloadJson(name, JSON.stringify(arr, null, 2));
  if (window.toast) toast(t("hist.exported"));
});
document.getElementById("history-clear").addEventListener("click", () => {
  if (loadHistory().length === 0) { toast(t("hist.emptyTip")); return; }
  if (window.dialog) {
    window.dialog.confirm(t("hist.clearConfirm"), { title: t("hist.clear") }).then((ok) => { if (ok) { saveHistory([]); renderHistory(); } });
  } else if (confirm(t("hist.clearConfirm"))) { saveHistory([]); renderHistory(); }
});

/* ▶ hash 页面/面板逻辑已抽离到 js/pages/hash.js（该文件在 app.js 之前加载） */

/* ▶ enc 页面/面板逻辑已抽离到 js/pages/enc.js（该文件在 app.js 之前加载） */

/* ▶ sym 页面/面板逻辑已抽离到 js/pages/sym.js（该文件在 app.js 之前加载） */

/* ▶ asym 页面/面板逻辑已抽离到 js/pages/asym.js（该文件在 app.js 之前加载） */

/* ▶ qr 页面/面板逻辑已抽离到 js/pages/qr.js（该文件在 app.js 之前加载） */

/* ▶ guide 页面/面板逻辑已抽离到 js/pages/guide.js（该文件在 app.js 之前加载） */
// 其他 App “分享”文字/链接（manifest share_target，GET 方式）会以 ?text=...&url=...&title=... 打开本页；
// 也支持自定义 URL Scheme / Intent：crypto-pwa://?text=... 或直接 ?text=... 打开。
// 收到内容后不直接塞进某个面板，而是弹出“外部内容”选择器，让用户挑编码/加密方式。
/* ▶ incoming 页面/面板逻辑已抽离到 js/pages/incoming.js（该文件在 app.js 之前加载） */

// 处理启动参数：有共享内容 → 进选择器；否则保留旧的精确 ?tab= 深链
function applyLaunchParams() {
  const p = new URLSearchParams(location.search);
  const raw = p.get("text") || p.get("url") || p.get("title") || "";
  const text = (raw || "").trim();

  /* 外部回调地址：调用方带 callback=... 时，处理完后可跳回 */
  const cb = (p.get("callback") || "").trim();
  window.__callback = cb || "";

  // 若用户在「设置→外部调用与分享」中关闭了自动弹出，则忽略外部内容
  const extOn = (localStorage.getItem("set_ext_incoming") || "1") === "1";
  if (text && !extOn) return;

  if (text) {
    // data:image 直接当图片处理
    if (text.startsWith("data:image")) {
      window.__incomingImage = text;
      window.__incomingText = "";
    } else {
      window.__incomingImage = "";
      window.__incomingText = text;
    }
    wireIncomingChips();
    wireCallback();
    showPanel("incoming");
    renderIncoming();
    return;
  }

  // 无共享内容：兼容旧的精确深链（如其它模块/文档里写死的 URL Scheme）
  const tab = p.get("tab");  if (tab && ["hash", "enc", "sym", "asym", "qr", "guide", "json", "sm2", "cron", "rand"].includes(tab)) {
    const setVal = (el, v) => { if (v !== null && el) el.value = v; };
    const setSel = (el, v) => { if (v !== null && el && [...el.options].some((o) => o.value === v)) el.value = v; };
    if (tab === "hash") { setVal(hashInput, p.get("text")); setSel(hashAlgo, p.get("algo")); }
    else if (tab === "enc") {
      setVal(encInput, p.get("text"));
      const mv = p.get("op") || p.get("method"); // b64/hex/url
      if (mv) { const m = encMethodSeg.querySelector('button[data-v="' + mv + '"]'); if (m) { encMethodSeg.querySelectorAll("button").forEach((x) => x.classList.remove("active")); m.classList.add("active"); } }
    }
    else if (tab === "sym") {
      symCat = "sym";
      setVal(symInput, p.get("text")); setSel(symAlgo, p.get("algo")); setSymMode(p.get("mode"));
      setVal(symKey, p.get("key")); setVal(symIv, p.get("iv")); refreshSymHints();
    }
    else if (tab === "asym") { symCat = "asym"; setVal(rsaInput, p.get("text")); setSel(rsaOp, p.get("op")); setVal(rsaPub, p.get("key")); }
    else if (tab === "sm2") { symCat = "asym"; asymAlgo = "sm2"; setVal(sm2Input, p.get("text")); setSel(sm2Op, p.get("op")); setVal(sm2Pub, p.get("key")); }
    else if (tab === "qr") { setVal(document.getElementById("qr-input"), p.get("text")); setSel(document.getElementById("qr-ec"), p.get("ec")); }
    showPanel(tab);
    if (p.get("run") === "1") {
      if (tab === "hash") document.getElementById("hash-btn").click();
      else if (tab === "enc") encDo(p.get("act") === "dec" ? "dec" : "enc");
      else if (tab === "sym") (p.get("op") === "decrypt" ? document.getElementById("sym-decrypt") : document.getElementById("sym-encrypt")).click();
      else if (tab === "qr") document.getElementById("qr-btn").click();
    }
  }
}

/* 全局 data-fill 委托：所有页面的"密码本"快速按钮（sym/asym 等）都生效
 * 只处理带 data-cat 的（密码本填充）；WebDAV 快捷 chip 等无 data-cat 的走各自原有行为 */
(function () {
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-fill]");
    if (!b) return;
    if (!b.dataset.cat) return;   // 非密码本填充（如坚果云快捷地址）→ 交给原按钮自己的 handler
    e.preventDefault();
    e.stopPropagation();
    const targetId = b.dataset.fill;
    const cat = b.dataset.cat || "generic";
    const api = window.__vaultApi;
    if (!api) return;
    const arr = await api.listAll(cat);
    if (arr === null) return;
    if (!arr.length) {
      if (window.dialog) await window.dialog.alert(t("vault.empty", "密码本为空，先保存一个"), t("vp.title"));
      return;
    }
    const items = arr.map((p, i) => ({
      label: p.label || (p.method || p.kind || "条目"),
      desc: p.method || p.kind || "",
    }));
    const res = await window.dialog.sheet(items, t("vp.pickFill", "从密码本选取"));
    if (res == null || res < 0) return;
    const ent = arr[res];
    let val = "";
    if (ent.kind === "rsa-pair") {
      const isPriv = /priv/.test(targetId || "");
      val = isPriv ? (ent.priv || "") : (ent.pub || "");
    } else {
      val = ent.value || ent.pub || ent.priv || "";
    }
    const inp = document.getElementById(targetId);
    if (inp) {
      inp.value = val;
      inp.dispatchEvent(new Event("input"));
      inp.focus();
    }
  });
})();

/* 小窗/分屏拖放接收：安卓原生把拖入的文字/图片 URI 推到这里 */
window.__dragDrop = function (text) {
  try {
    if (window.__log) window.__log("drag", String(text).slice(0, 200));
  } catch (e) {}
  const s = String(text || "").trim();
  if (!s) return;
  if (s.startsWith("data:image")) {
    window.__incomingImage = s;
    window.__incomingText = "";
  } else if (s.startsWith("content://") || /\.(png|jpe?g|gif|webp)$/i.test(s)) {
    /* 图片 URI：content:// 可直接作为 <img> src 显示（拖放系统已授予读取权限） */
    window.__incomingImage = s;
    window.__incomingText = "";
  } else {
    window.__incomingImage = "";
    window.__incomingText = s;
  }
  try { if (window.toast) toast(typeof t === "function" ? t("inc.dragOk") : "已接收拖入的内容"); } catch (e) {}
  wireIncomingChips();
  showPanel("incoming");
  renderIncoming();
};
/* 系统分享接收：其他 App「分享」文本/图片 → 这里（原生 ACTION_SEND intent） */
window.__sharedText = function (text) {
  try {
    if (window.__log) window.__log("share", String(text).slice(0, 200));
  } catch (e) {}
  const s = String(text || "").trim();
  if (!s) return;
  if (s.startsWith("content://") || s.startsWith("file://") || /\.(png|jpe?g|gif|webp)$/i.test(s)) {
    window.__incomingImage = s;
    window.__incomingText = "";
  } else {
    window.__incomingImage = "";
    window.__incomingText = s;
  }
  try { if (window.toast) toast(typeof t === "function" ? t("inc.dragOk") : "已接收分享的内容"); } catch (e) {}
  wireIncomingChips();
  showPanel("incoming");
  renderIncoming();
};
/* 桌面快捷方式 / 深链：crypto-pwa://?tab=hash → 直达对应工具（原生 intent data 转来） */
window.__handleDeepLink = function (q) {
  try {
    if (window.__log) window.__log("deeplink", String(q || "").slice(0, 200));
  } catch (e) {}
  let query = String(q || "").trim();
  if (!query) return;
  if (query.indexOf("?") !== 0) query = query.indexOf("?") === -1 ? "?" + query : query.slice(query.indexOf("?"));
  const p = new URLSearchParams(query);
  const tab = p.get("tab");
  if (tab && ["hash", "enc", "sym", "qr", "json", "cron", "rand", "txt", "guide"].includes(tab)) {
    showPanel(tab);
    return;
  }
  if (p.get("text") || p.get("url")) applyLaunchParams();
};
/* 外部回调：把处理结果跳回调用方（callback 参数） */
function wireCallback() {
  const card = document.getElementById("inc-callback-card");
  if (!card) return;
  if (!window.__callback) { card.hidden = true; return; }
  card.hidden = false;
  const btn = document.getElementById("inc-callback-go");
  if (btn) btn.onclick = () => {
    const result = (document.getElementById("inc-callback-input") || {}).value || window.__incomingText || "";
    let url = window.__callback;
    url += (url.indexOf("?") >= 0 ? "&" : "?") + "result=" + encodeURIComponent(result);
    try { if (window.__log) window.__log("callback", url.slice(0, 200)); } catch (e) {}
    window.location.href = url;
  };
}

/* ---------- 7.5 编辑框增强：清空按钮 + 全屏编辑 ---------- */
// 给所有 textarea 包一层 .expand-wrap：
//  · 右上角“清空”按钮（仅可编辑、有内容时显示）
//  · 右下角“全屏编辑”按钮（内容溢出、或只读查看时显示）——点开大框编辑/复制
function ensureExpEl(id, cls) {
  let el = document.getElementById(id);
  if (!el) { el = document.createElement("div"); el.id = id; el.className = cls; document.body.appendChild(el); }
  return el;
}
// 全屏编辑/查看窗口：仿微信输入框全屏样式（左下角收起 + 右上角完成）
function openEditor(ta, editable) {
  const mask = ensureExpEl("exp-mask", "exp-mask");
  const panel = ensureExpEl("exp-panel", "exp-panel");
  /* 延伸方向：输入框在上半屏 → 从顶部滑入；下半屏 → 从底部滑入 */
  try {
    const r = ta.getBoundingClientRect ? ta.getBoundingClientRect() : null;
    const vh = window.innerHeight || 800;
    panel.classList.remove("from-top", "from-bottom");
    if (r && r.top > vh / 2) panel.classList.add("from-bottom");
    else if (r) panel.classList.add("from-top");
  } catch (e) {}
  const doneLbl = (typeof t === "function") ? t("ui.done") : "完成";
  const closeLbl = (typeof t === "function") ? t("ui.collapse", "收起") : "收起";
  const copyLbl = (typeof t === "function") ? t("copy") : "复制";
  const saveLbl = (typeof t === "function") ? t("ui.saveFile", "保存到文件") : "保存到文件";
  /* 弹窗内部操作行（编辑框外）：复制 + 保存到文件（保留右上角完成） */
  panel.innerHTML =
    `<div class="exp-head">` +
      `<button class="exp-collapse" id="exp-close" aria-label="${closeLbl}" title="${closeLbl}">` +
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>` +
      `</button>` +
      `<button class="btn primary exp-done" id="exp-ok">${escapeHtml(doneLbl)}</button>` +
    `</div>` +
    `<textarea class="exp-text" id="exp-edit" ${editable ? "" : "readonly"}>${escapeHtml(ta.value)}</textarea>` +
    `<div class="exp-ops">` +
      `<button type="button" class="exp-op" id="exp-copy">📋 ${escapeHtml(copyLbl)}</button>` +
      `<button type="button" class="exp-op" id="exp-save">💾 ${escapeHtml(saveLbl)}</button>` +
    `</div>`;
  panel.classList.add("show"); mask.classList.add("show");
  const close = () => { panel.classList.remove("show"); mask.classList.remove("show"); };
  const editArea = panel.querySelector("#exp-edit");
  if (editable) setTimeout(() => { editArea.focus(); editArea.setSelectionRange(editArea.value.length, editArea.value.length); }, 60);
  panel.querySelector("#exp-close").onclick = close;
  mask.onclick = close;
  panel.querySelector("#exp-ok").onclick = () => {
    if (editable) {
      ta.value = editArea.value;
      ta.dispatchEvent(new Event("input"));
    }
    close();
    if (editable) ta.focus();
  };
  const copyBtn = panel.querySelector("#exp-copy");
  if (copyBtn) copyBtn.onclick = (e) => copyText(editArea.value, e.currentTarget);
  const saveBtn = panel.querySelector("#exp-save");
  if (saveBtn) saveBtn.onclick = () => {
    const name = "output_" + new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-") + ".txt";
    if (window.downloadJson) window.downloadJson(name, editArea.value);
    else saveTextFile(name, editArea.value);
  };
}
function setupExpanders() {
  document.querySelectorAll("textarea").forEach((ta) => {
    if (ta.dataset.enhanced) return;
    ta.dataset.enhanced = "1";
    let wrap = ta.parentNode;
    if (!wrap.classList || !wrap.classList.contains("expand-wrap")) {
      wrap = document.createElement("div");
      wrap.className = "expand-wrap";
      ta.parentNode.insertBefore(wrap, ta);
      wrap.appendChild(ta);
    }
    const editable = !ta.readOnly;
    // 清空按钮（右上角，仅可编辑、有内容时显示）
    if (editable) {
      const clr = document.createElement("button");
      clr.type = "button"; clr.className = "box-clear";
      clr.setAttribute("aria-label", (typeof t === "function") ? t("ui.clear") : "清空");
      clr.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
      clr.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); ta.value = ""; ta.dispatchEvent(new Event("input")); ta.focus(); });
      wrap.appendChild(clr);
      const updClr = () => { clr.style.display = ta.value ? "flex" : "none"; };
      ta.addEventListener("input", updClr); setTimeout(updClr, 0);
    }
    // 全屏编辑按钮（右下角，内容溢出或只读查看时显示）
    const exp = document.createElement("button");
    exp.type = "button"; exp.className = "expand-btn";
    exp.setAttribute("aria-label", (typeof t === "function") ? t("ui.full") : "全屏编辑");
    exp.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>';
    exp.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); openEditor(ta, editable); });
    wrap.appendChild(exp);
    const updExp = () => {
      const overflow = ta.scrollHeight > ta.clientHeight + 6 && ta.clientHeight > 0;
      exp.style.display = (overflow || !editable) ? "flex" : "none";
    };
    ta.addEventListener("input", () => setTimeout(updExp, 0));
    ta.addEventListener("focus", updExp); setTimeout(updExp, 0);
  });
}

/* ▶ json 页面/面板逻辑已抽离到 js/pages/json.js（该文件在 app.js 之前加载） */

/* ▶ cron 页面/面板逻辑已抽离到 js/pages/cron.js（该文件在 app.js 之前加载） */

/* ▶ rand 页面/面板逻辑已抽离到 js/pages/rand.js（该文件在 app.js 之前加载） */

/* ▶ txt 页面/面板逻辑已抽离到 js/pages/txt.js（该文件在 app.js 之前加载） */

/* ---------- 8. 初始化 ---------- */
updateKeySizeUI();
refreshSymHints();
refreshRsaLabels();
renderHistory();   // 主页展示已有历史
ensureRsaKeys();   // 若本机无 RSA 密钥，默认生成一对
setupExpanders();  // 给 textarea 加“展开查看全文”
applyLaunchParams();

/* 首屏闪屏：本机 UI 与 WebView 就绪后主动隐藏闪屏（不再死等定时器），
   避免闪屏消失瞬间露出未绘制好的 WebView 造成“闪一下”。插件不可用或异常时静默忽略。 */
(function () {
  try {
    const SP = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.SplashScreen;
    if (SP && SP.hide) {
      const hideSplash = () => { try { SP.hide(); } catch (e) {} };
      if (document.readyState === "complete") hideSplash();
      else window.addEventListener("load", hideSplash);
      setTimeout(hideSplash, 2500); // 兜底：最多 2.5s 强制隐藏，防插件异常卡死闪屏
    }
  } catch (e) {}
})();

/* ---------- 9. Service Worker（离线 + 可添加到主屏幕） ---------- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
  // 新版本就绪后自动刷新一次，避免被旧缓存卡住看不到更新
  let _reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!_reloaded) { _reloaded = true; location.reload(); }
  });
}

/* ---------- 10. 安卓返回键：关闭弹窗 → 设置页返回 → 面板回主页 → 退出 App ---------- */
(function () {
  if (!window.Capacitor || !window.Capacitor.Plugins || !window.Capacitor.Plugins.App) return;
  window.Capacitor.Plugins.App.addListener("backButton", () => {
    /* 1. 优先关闭任何打开的弹窗（密码本 / 选择器 / 扫码 / 密钥查看 / 全屏编辑 / 模板） */
    const shownMask = document.querySelector(".vp-mask.show, .pw-mask.show, .scan-mask.show, .exp-mask.show, .rsan-mask.show");
    if (shownMask) {
      const closeBtn = shownMask.querySelector(".vp-close, .pp-close, .scan-close, #exp-close, #rsa-name-close");
      if (closeBtn) { closeBtn.click(); return; }
      shownMask.click();
      return;
    }
    /* 2. 设置页打开 → 返回上一级（或关闭） */
    const settingsOverlay = document.getElementById("settings-overlay");
    if (settingsOverlay && !settingsOverlay.hasAttribute("hidden")) {
      if (window.settingsBack) { window.settingsBack(); return; }
    }
    /* 3. 功能面板（非主页）→ 返回主页 */
    const cur = document.querySelector(".panel.active");
    if (cur && cur.id !== "panel-home") {
      const back = cur.querySelector(".ph-back");
      if (back) { back.click(); return; }
      showPanel("home");
      return;
    }
    /* 4. 主页 → 双击返回才退出（2 秒内再按一次） */
    const now = Date.now();
    if (window.__lastBackExit && now - window.__lastBackExit < 2000) {
      window.Capacitor.Plugins.App.exitApp();
      return;
    }
    window.__lastBackExit = now;
    if (window.toast) toast(typeof t === "function" ? t("back.pressAgain") : "再按一次返回退出");
  });
})();
