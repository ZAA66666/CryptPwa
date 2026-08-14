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
function showPanel(name) {
  if (name === "asym") { name = "sym"; symCat = "asym"; } // 非对称并入「加/解密」面板
  if (name === "sm2") { name = "sym"; symCat = "asym"; asymAlgo = "sm2"; } // SM2 并入「加/解密」面板
  const panel = document.getElementById("panel-" + name);
  if (!panel) return;
  document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
  panel.classList.add("active");
  // 主页才显示顶部 Toolbar（含三点菜单）；进入功能页时隐藏，用面板内返回键
  document.body.classList.toggle("on-home", name === "home");
  // 状态栏文字色：on-home 黑底 → 白字；其他白底 → 黑字
  try {
    const sb = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.StatusBar;
    if (sb && sb.setStyle) {
      sb.setStyle({ style: name === "home" ? "DARK" : "LIGHT" }).catch(() => {});
    }
  } catch (e) {}
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

/* ---------- 2. 哈希面板 ---------- */
const hashInput = document.getElementById("hash-input");
const hashAlgo = document.getElementById("hash-algo");
const hashKeyWrap = document.getElementById("hash-key-wrap");
const hashKey = document.getElementById("hash-key");

// HMAC 类算法才需要密钥输入框
hashAlgo.addEventListener("change", () => {
  hashKeyWrap.style.display = hashAlgo.value.startsWith("HMAC") ? "block" : "none";
});

document.getElementById("hash-btn").addEventListener("click", () => {
  const text = hashInput.value;
  const out = document.getElementById("hash-output");
  if (!text) { out.value = ""; return; }
  const algo = hashAlgo.value;
  let res;
  if (algo === "SHA3-512") {
    /* 标准 SHA3-512（FIPS 202）：js-sha3 */
    res = sha3_512(text);
  } else if (algo === "KECCAK-512") {
    /* Keccak-512（NIST 原始 Keccak，非标准 SHA3）：crypto-js 兼容模式 */
    res = CryptoJS.SHA3(text, { outputLength: 512 }).toString();
  } else if (algo.startsWith("HMAC")) {
    if (!hashKey.value) { out.value = "❌ HMAC 需要密钥"; return; }
    res = CryptoJS[algo](text, hashKey.value).toString();
  } else {
    res = CryptoJS[algo](text).toString();
  }
  out.value = res;
  addHistory({ cat: "hash", go: "hash", op: "hash", method: algo, preview: text.slice(0, 24) });
  // 仅 HMAC（带密钥）才提示存密码本；普通哈希没有密码，无需保存
  if (algo.startsWith("HMAC")) {
    maybePromptVault({ method: "HMAC-" + algo, password: hashKey.value, targetId: "hash-input", cat: "hash" });
  }
});
document.getElementById("hash-copy").addEventListener("click", (e) => copyText(hashOutput.value, e.target));
const hashOutput = document.getElementById("hash-output");

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
    if (!/^\d+$/.test(tok)) throw new Error("罗马数字仅支持整数：" + tok);
    let n = parseInt(tok, 10);
    if (n < 1 || n > 3999) throw new Error("范围 1~3999：" + tok);
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
    if (i !== up.length) throw new Error("非法罗马数字：" + tok);
    if (toRoman(String(n)) !== up) throw new Error("非法罗马数字：" + tok);
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
      const methodName = { b64: "Base64", hex: "Hex", url: "URL", b32: "Base32", b58: "Base58", unicode: "Unicode", jwt: "JWT", oct: "Octal", ascii: "ASCII", htmlent: "HTML 实体", utf16: "UTF-16", roman: "罗马数字" }[method];
      addHistory({ cat: "enc", go: "enc", op: action, method: methodName, preview: inp.slice(0, 24) });
      // 编码没有密码概念，不提示保存到密码本（仅加解密相关功能才会提示）
      if (window.toast) toast(t(action === "enc" ? "enc.okEnc" : "enc.okDec"));
    }
  } catch (e) {
    out.value = "❌ 处理失败：" + e.message;
    if (window.toast) toast((typeof t === "function" ? t("enc.fail") : "❌ 处理失败：") + e.message);
  }
}
document.getElementById("enc-encode").addEventListener("click", () => encDo("enc"));
document.getElementById("enc-decode").addEventListener("click", () => encDo("dec"));

// 图片 → Base64（输出 data URL，可直接用于 <img src> 或嵌入）
document.getElementById("enc-img-b64").addEventListener("click", () => {
  const file = document.getElementById("enc-file").files[0];
  const out = document.getElementById("enc-output");
  if (!file) { out.value = "❌ 请先选择一张图片"; return; }
  const reader = new FileReader();
  reader.onload = () => {
    out.value = reader.result;
    addHistory({ cat: "enc", go: "enc", op: "imgb64", preview: file.name });
  };
  reader.onerror = () => { out.value = "❌ 读取图片失败"; };
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

/* ---------- 4. 对称加密面板（AES/DES/3DES/Blowfish/RC4/Rabbit） ---------- */
const symAlgo = document.getElementById("sym-algo");
const symAlgoBtn = document.getElementById("sym-algo-btn");
const symAlgoLabel = document.getElementById("sym-algo-label");
const SYM_ALGOS = [
  { v: "AES",      label: "AES（密钥 16/24/32 字节）" },
  { v: "DES",      label: "DES（密钥 8 字节）" },
  { v: "3DES",     label: "3DES（密钥 24 字节）" },
  { v: "Blowfish", label: "Blowfish（密钥 1~56 字节）" },
  { v: "RC4",      label: "RC4（流密码）" },
  { v: "Rabbit",   label: "Rabbit（流密码）" },
];
function refreshSymAlgoLabel() {
  const cur = SYM_ALGOS.find((a) => a.v === symAlgo.value);
  if (cur && symAlgoLabel) symAlgoLabel.textContent = cur.label;
}
if (symAlgoBtn) symAlgoBtn.addEventListener("click", async () => {
  if (!window.dialog) return;
  const items = SYM_ALGOS.map((a) => ({ label: a.label, desc: "" }));
  const res = await window.dialog.sheet(items, t("sym.algo"));
  if (res == null || res < 0) return;
  symAlgo.value = SYM_ALGOS[res].v;
  refreshSymAlgoLabel();
  updateKeySizeUI(); refreshSymHints();
});
refreshSymAlgoLabel();
const symKey = document.getElementById("sym-key");
const symKeyHint = document.getElementById("sym-key-hint");
const symModeBox = document.getElementById("sym-mode");
const symModeLabel = symModeBox.previousElementSibling; // 它前面的 <label>
const symIvWrap = document.getElementById("sym-iv-wrap");
const symIv = document.getElementById("sym-iv");
const symIvHint = document.getElementById("sym-iv-hint");
const symInput = document.getElementById("sym-input");
const symOutput = document.getElementById("sym-output");
const STREAM = ["RC4", "Rabbit"]; // 流密码：密钥任意，无模式/IV

// 分组模式改为“点击”分段控件（不再是下拉框）
function getSymMode() { const a = symModeBox.querySelector("button.active"); return a ? a.dataset.v : "CBC"; }
// 通过深链设置分组模式（点击控件改为按钮，需手动切换 active）
function setSymMode(val) {
  symModeBox.querySelectorAll("button[data-v]").forEach((b) => b.classList.toggle("active", b.dataset.v === val));
  refreshSymHints();
}
symModeBox.querySelectorAll("button[data-v]").forEach((b) => {
  b.addEventListener("click", () => {
    symModeBox.querySelectorAll("button").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    updateKeySizeUI();  /* 切换模式时同步刷新密钥长度档位与提示 */
    refreshSymHints();
  });
});

// 生成随机可见字符串（每个字符 1 字节，便于满足密钥/IV 字节长度校验）
function randStr(len) {
  const cs = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const arr = new Uint32Array(len);
  (window.crypto || window.msCrypto).getRandomValues(arr);
  let s = "";
  for (let i = 0; i < len; i++) s += cs[arr[i] % cs.length];
  return s;
}
// 随机密钥 / 随机 IV（按当前算法长度）
function genRandSymKey() {
  const rule = symKeyRule(symAlgo.value);
  let len;
  if (rule.sizes) {
    // 多档算法：随机挑一个合法长度，让“随机密钥”真正随机位数（128/192/256）
    const pick = rule.sizes[Math.floor(Math.random() * rule.sizes.length)];
    setSymKeySize(pick);
    len = pick;
  } else if (rule.exact) len = rule.exact[0];      // DES→8, 3DES→24（固定）
  else if (rule.min) {
    // Blowfish：1~56，取 8~32 之间随机，避免每次都是 16
    const lo = Math.max(rule.min, 8), hi = Math.min(rule.max, 32);
    len = lo + Math.floor(Math.random() * (hi - lo + 1));
  } else len = 16 + Math.floor(Math.random() * 17); // 流密码 16~32 随机
  symKey.value = randStr(len);
  refreshSymHints();
}
function genRandSymIv() {
  const rule = symKeyRule(symAlgo.value);
  const len = rule.block || 16;
  symIv.value = randStr(len);
  refreshSymHints();
}

// 各算法的密钥长度规则与分组大小（字节）
function symKeyRule(algo) {
  switch (algo) {
    case "DES": return { exact: [8], block: 8 };
    case "3DES": return { exact: [24], block: 8 };
    case "AES": return { exact: [16, 24, 32], sizes: [16, 24, 32], block: 16 };
    case "Blowfish": return { min: 1, max: 56, block: 8 };
    default: return { flex: true }; // RC4 / Rabbit
  }
}

// 密钥长度分段控件（仅 AES 这类多长度算法显示）
const symKeySizeWrap = document.getElementById("sym-keysize-wrap");
const symKeySizeBox = document.getElementById("sym-keysize");
const symKsCur = document.getElementById("sym-ks-cur");
function getSymKeySize() {
  const a = symKeySizeBox.querySelector("button.active");
  return a ? Number(a.dataset.bytes) : 16;
}
function setSymKeySize(bytes) {
  symKeySizeBox.querySelectorAll("button").forEach((b) =>
    b.classList.toggle("active", Number(b.dataset.bytes) === bytes));
}
// 同步“当前位数”指示（如 192 位）
function updateKeySizeLabel() {
  const a = symKeySizeBox.querySelector("button.active");
  if (symKsCur) symKsCur.textContent = a ? `${a.dataset.bits} 位` : "";
}
symKeySizeBox.querySelectorAll("button[data-bytes]").forEach((b) => {
  b.addEventListener("click", () => {
    symKeySizeBox.querySelectorAll("button").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    updateKeySizeLabel();
    refreshSymHints();
  });
});
// 根据算法显隐密钥长度控件（只 AES 有多档）
function updateKeySizeUI() {
  const rule = symKeyRule(symAlgo.value);
  if (rule.sizes) { symKeySizeWrap.style.display = ""; setSymKeySize(rule.sizes[0]); updateKeySizeLabel(); }
  else symKeySizeWrap.style.display = "none";
}

// 切换算法/模式时刷新提示，并隐藏流密码不需要的模式/IV
function refreshSymHints() {
  const algo = symAlgo.value, mode = getSymMode();
  const rule = symKeyRule(algo);
  if (rule.flex) {
    symKeyHint.textContent = "流密码，密钥长度任意。";
    symKeyHint.classList.remove("error");
    symModeLabel.style.display = "none"; symModeBox.style.display = "none";
    symIvWrap.style.display = "none";
    return;
  }
  symModeLabel.style.display = ""; symModeBox.style.display = "";
  let need;
  if (rule.sizes) {
    const sel = getSymKeySize();
    need = `${sel} 字节（${sel * 8} 位）`;
  } else if (rule.exact) need = rule.exact.join(" / ") + " 字节";
  else need = `${rule.min}~${rule.max} 字节`;

  const cur = utf8ByteLength(symKey.value);
  const ok = rule.sizes ? rule.sizes.includes(cur)
            : rule.exact ? rule.exact.includes(cur)
            : (cur >= rule.min && cur <= rule.max);
  const mark = !symKey.value ? "" : (ok ? " ✓" : " ✗");
  const hintTpl = (t && typeof t === "function") ? t("sym.hintKey") : "密钥需 {need}；当前已填 {cur} 字节";
  symKeyHint.innerHTML = hintTpl.replace("{need}", need).replace("{cur}", cur + " " + mark);
  symKeyHint.classList.toggle("error", !!symKey.value && !ok);
  updateKeySizeLabel();
  symIvWrap.style.display = mode === "ECB" ? "none" : "block";
  if (mode !== "ECB") {
    const ivTpl = (t && typeof t === "function") ? t("sym.hintIv") : "IV 需正好 {block} 字节（当前 {cur} 字节）";
    symIvHint.textContent = ivTpl.replace("{block}", rule.block).replace("{cur}", utf8ByteLength(symIv.value));
  }
}
[symAlgo, symKey, symIv].forEach((el) => el.addEventListener("input", refreshSymHints));
symAlgo.addEventListener("change", () => { updateKeySizeUI(); refreshSymHints(); });

function validateSym(op) {
  const algo = symAlgo.value, mode = getSymMode(), key = symKey.value, iv = symIv.value;
  const inp = symInput.value || "";
  const rule = symKeyRule(algo);
  if (rule.flex) return { algo, mode, key, iv }; // 流密码不校验长度
  const kl = utf8ByteLength(key);
  if (rule.sizes) {
    const need = getSymKeySize();
    if (kl !== need) {
      const e = (t("sym.errKeyLen") || "❌ 密钥长度不对：AES 需要 {need} 字节（{bits} 位），当前 {cur} 字节")
        .replace("{need}", need).replace("{bits}", need * 8).replace("{cur}", kl);
      showError(symKeyHint, e);
      return null;
    }
  } else if (rule.exact && !rule.exact.includes(kl)) {
    const e = (t("sym.errKeyExact") || "❌ 密钥长度不对：需要 {need} 字节，当前 {cur} 字节")
      .replace("{need}", rule.exact.join(" / ")).replace("{cur}", kl);
    showError(symKeyHint, e);
    return null;
  }
  if (rule.min !== undefined && (kl < rule.min || kl > rule.max)) {
    const e = (t("sym.errBlowfish") || "❌ Blowfish 密钥需 {min}~{max} 字节，当前 {cur} 字节")
      .replace("{min}", rule.min).replace("{max}", rule.max).replace("{cur}", kl);
    showError(symKeyHint, e);
    return null;
  }
  symKeyHint.classList.remove("error");
  /* 解密时新格式密文自带 IV（v1:<base64iv>:<ct>）：自动提取并回填输入框，跳过 IV 校验 */
  let effIv = iv, skipIvCheck = false;
  if (op === "decrypt" && inp.indexOf("v1:") === 0) {
    const parts = inp.split(":");
    if (parts.length >= 3) {
      try {
        const ivStr = CryptoJS.enc.Base64.parse(parts[1]).toString(CryptoJS.enc.Utf8);
        if (ivStr) { effIv = ivStr; skipIvCheck = true; if (symIv) symIv.value = ivStr; }
      } catch (e) {}
    }
  }
  if (mode !== "ECB" && !skipIvCheck && utf8ByteLength(effIv) !== rule.block) {
    const e = (t("sym.errIvLen") || "❌ IV 需正好 {block} 字节，当前 {cur} 字节")
      .replace("{block}", rule.block).replace("{cur}", utf8ByteLength(effIv));
    showError(symIvHint, e);
    return null;
  }
  return { algo, mode, key, iv: effIv };
}

function runSym(op) {
  const cfg = validateSym(op);
  if (!cfg) { symOutput.value = ""; return; }
  const { algo, mode, key, iv } = cfg;
  const input = symInput.value;
  if (!input) { symOutput.value = ""; return; }
  try {
    let outVal;
    if (STREAM.includes(algo)) {
      // 流密码：直接把密钥当字符串传入
      const ct = CryptoJS[algo].encrypt(input, key).toString();
      const pt = CryptoJS[algo].decrypt(input, key).toString(CryptoJS.enc.Utf8);
      outVal = op === "encrypt" ? ct : (pt || "❌ 解密失败：密钥不正确或密文非法。");
    } else {
      const keyWA = CryptoJS.enc.Utf8.parse(key);
      const options = { mode: CryptoJS.mode[mode], padding: CryptoJS.pad.Pkcs7 };
      if (mode !== "ECB") options.iv = CryptoJS.enc.Utf8.parse(iv);
      /* 解密时去掉 v1: 前缀（IV 已由 validateSym 提取回填） */
      const ctIn = (op === "decrypt" && input.indexOf("v1:") === 0) ? input.split(":").slice(2).join(":") : input;
      let outVal2;
      try {
        if (op === "encrypt") {
          const ct = CryptoJS[algo].encrypt(input, keyWA, options).toString();
          outVal2 = (mode !== "ECB") ? "v1:" + CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(iv)) + ":" + ct : ct;
        } else {
          const pt = CryptoJS[algo].decrypt(ctIn, keyWA, options).toString(CryptoJS.enc.Utf8);
          outVal2 = pt || "❌ 解密失败：密钥/模式/IV 不正确，或密文非法。";
        }
      } catch (e) {
        outVal2 = "❌ 解密失败：密钥或 IV 不正确（或密文非法）。";
      }
      outVal = outVal2;
    }
    symOutput.value = outVal;
    if (!outVal.startsWith("❌")) {
      const opName = (typeof t === "function") ? t(op === "encrypt" ? "op.encrypt" : "op.decrypt") : (op === "encrypt" ? "加密" : "解密");
      addHistory({ cat: "sym", go: "sym", op: op, method: algo, extra: mode, preview: input.slice(0, 20) });
      const methodLabel = STREAM.includes(algo) ? algo : `${algo}-${mode}`;
      /* 保存密钥；若 IV 是决定值（非 ECB 且已填）则一并存入密码本，填入时可自动恢复 */
      maybePromptVault({ method: methodLabel, password: key, targetId: "sym-key", cat: "sym", iv: (mode !== "ECB" && iv) ? iv : null });
    }
  } catch (e) {
    symOutput.value = "❌ 出错了：" + e.message;
  }
}
document.getElementById("sym-encrypt").addEventListener("click", () => runSym("encrypt"));
document.getElementById("sym-decrypt").addEventListener("click", () => runSym("decrypt"));
document.getElementById("sym-copy").addEventListener("click", (e) => copyText(symOutput.value, e.target));
const symRandKeyBtn = document.getElementById("sym-rand-key");
if (symRandKeyBtn) symRandKeyBtn.addEventListener("click", genRandSymKey);
const symRandIvBtn = document.getElementById("sym-rand-iv");
if (symRandIvBtn) symRandIvBtn.addEventListener("click", genRandSymIv);

/* ---------- 5. 非对称加密 RSA（Web Crypto） ---------- */
const rsaPub = document.getElementById("rsa-pub");
const rsaPriv = document.getElementById("rsa-priv");
const rsaOp = document.getElementById("rsa-op");
const rsaOpBtn = document.getElementById("rsa-op-btn");
const rsaOpLabel = document.getElementById("rsa-op-label");
const rsaRun = document.getElementById("rsa-run");
const rsaInput = document.getElementById("rsa-input");
const rsaInputLabel = document.getElementById("rsa-input-label");
const rsaMsgWrap = document.getElementById("rsa-msg-wrap");
const rsaMsg = document.getElementById("rsa-msg");
const rsaOutput = document.getElementById("rsa-output");

// 根据操作切换输入框标签 / 显示/隐藏"验签原文" / 改执行按钮文案
const RSA_OP_LABELS = { encrypt: "asym.opEnc", decrypt: "asym.opDec", sign: "asym.opSign", verify: "asym.opVerify" };
const RSA_BTN_LABELS = { encrypt: "asym.btnEnc", decrypt: "asym.btnDec", sign: "asym.btnSign", verify: "asym.btnVerify" };
const RSA_INPUT_LABELS = { encrypt: "明文", decrypt: "Base64 密文", sign: "待签名文本", verify: "签名 (Base64)" };
function refreshRsaLabels() {
  rsaInputLabel.textContent = RSA_INPUT_LABELS[rsaOp.value];
  rsaMsgWrap.style.display = rsaOp.value === "verify" ? "" : "none";
  rsaOpLabel.textContent = t(RSA_OP_LABELS[rsaOp.value]);
  rsaRun.textContent = t(RSA_BTN_LABELS[rsaOp.value]);
  rsaRun.setAttribute("data-i18n", RSA_BTN_LABELS[rsaOp.value]);
}
rsaOpBtn.addEventListener("click", async () => {
  if (!window.dialog) return;
  const ops = ["encrypt", "decrypt", "sign", "verify"];
  const items = ops.map((v) => ({ label: t(RSA_OP_LABELS[v]), desc: "" }));
  const res = await window.dialog.sheet(items, t("asym.opLabel"));
  if (res == null || res < 0) return;
  rsaOp.value = ops[res];
  refreshRsaLabels();
});
refreshRsaLabels();

// 二进制 <-> Base64 / PEM 互转
function abToB64(buf) { return btoa(String.fromCharCode(...new Uint8Array(buf))); }
function b64ToAb(b64) { const s = atob(b64); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; }
function pemToBuf(pem) { return b64ToAb(pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "")); }
function bufToPem(buf, type) {
  const b64 = abToB64(buf).match(/.{1,64}/g).join("\n");
  return `-----BEGIN ${type}-----\n${b64}\n-----END ${type}-----`;
}

// 生成 RSA 密钥对并导出为标准 PEM（持久化到本机，新用户默认得到一对）
function rsaLoadKeys() {
  try {
    rsaPub.value = localStorage.getItem("set_rsa_pub") || "";
    rsaPriv.value = localStorage.getItem("set_rsa_priv") || "";
  } catch (e) {}
}
function rsaSaveKeys() {
  try {
    localStorage.setItem("set_rsa_pub", rsaPub.value);
    localStorage.setItem("set_rsa_priv", rsaPriv.value);
  } catch (e) {}
}
window.rsaSaveKeys = rsaSaveKeys;
async function generateRsaKeys() {
  if (!crypto.subtle) { rsaOutput.value = "❌ RSA 需要 https 或 localhost 环境。"; return false; }
  try {
    const kp = await crypto.subtle.generateKey(
      { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
      true, ["encrypt", "decrypt"]
    );
    rsaPub.value = bufToPem(await crypto.subtle.exportKey("spki", kp.publicKey), "PUBLIC KEY");
    rsaPriv.value = bufToPem(await crypto.subtle.exportKey("pkcs8", kp.privateKey), "PRIVATE KEY");
    rsaSaveKeys();
    const st = document.getElementById("rsa-status");
    if (st) st.textContent = (typeof t === "function") ? t("asym.keyReady") : "已生成密钥对（2048 位）";
    return true;
  } catch (e) { rsaOutput.value = "❌ 生成失败：" + e.message; return false; }
}
// 进入 RSA 面板时：若本地没有密钥则静默生成一对（新用户默认即有）
function ensureRsaKeys() {
  rsaLoadKeys();
  if (!rsaPub.value && !rsaPriv.value) generateRsaKeys();
  const st = document.getElementById("rsa-status");
  if (st && (rsaPub.value || rsaPriv.value)) {
    st.textContent = (typeof t === "function") ? t("asym.keyReady") : "已生成密钥对（2048 位）";
  }
}

// “查看密码对”弹窗（密钥截断展示；底部 重新生成 / 保存到密码本）
const rsavMask = document.getElementById("rsav-mask");
const rsavPanel = document.getElementById("rsav-panel");
function truncKey(k) {
  k = (k || "").trim();
  if (k.length <= 70) return k;
  const om = (t("rsa.trunc") || "（已省略中间 {n} 个字符）").replace("{n}", k.length - 72);
  return k.slice(0, 48) + "\n        " + om + "\n" + k.slice(-24);
}
function fillRsaView() {
  document.getElementById("rsav-pub").textContent = truncKey(rsaPub.value);
  document.getElementById("rsav-priv").textContent = truncKey(rsaPriv.value);
}
function openRsaView() {
  if (!rsaPub.value.trim() && !rsaPriv.value.trim()) ensureRsaKeys();
  fillRsaView();
  rsavPanel.classList.add("show");
  rsavMask.classList.add("show");
}
function closeRsaView() {
  rsavPanel.classList.remove("show");
  rsavMask.classList.remove("show");
}
const rsaViewBtn = document.getElementById("rsa-view");
if (rsaViewBtn) rsaViewBtn.addEventListener("click", openRsaView);
document.getElementById("rsav-close").addEventListener("click", closeRsaView);
rsavMask.addEventListener("click", closeRsaView);

// 密钥弹窗「粘贴」：读剪贴板 → 校验格式 → 填入对应框（另一把置空，避免拼凑成假的一对）
async function pasteKey(kind) {
  const fail = (msg) => { if (window.toast) toast(msg); };
  let txt;
  try { txt = await navigator.clipboard.readText(); }
  catch (e) { fail(t("vp.pasteDenied")); return; }
  const s = (txt || "").trim();
  if (!s) { fail(t("vp.pasteBad")); return; }
  const apply = (fill, clear, save, refresh, okMsg) => {
    fill.value = s; if (clear) clear.value = "";
    fill.dispatchEvent(new Event("input"));
    if (clear) clear.dispatchEvent(new Event("input"));
    if (save) save();
    if (refresh) refresh();
    fail(okMsg);
  };
  if (kind === "rsa-pub") {
    if (!/-----BEGIN (RSA )?PUBLIC KEY-----/.test(s)) { fail(t("vp.pasteBad")); return; }
    apply(rsaPub, rsaPriv, window.rsaSaveKeys, fillRsaView, t("vp.pasteOk"));
  } else if (kind === "rsa-priv") {
    if (!/-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/.test(s)) { fail(t("vp.pasteBad")); return; }
    apply(rsaPriv, rsaPub, window.rsaSaveKeys, fillRsaView, t("vp.pasteOk"));
  } else if (kind === "sm2-pub") {
    if (!/^04[0-9a-fA-F]{128}$/.test(s)) { fail(t("vp.pasteBad")); return; }
    apply(sm2Pub, sm2Priv, window.sm2SaveKeys, fillSm2View, t("vp.pasteOk"));
  } else if (kind === "sm2-priv") {
    if (!/^[0-9a-fA-F]{64}$/.test(s)) { fail(t("vp.pasteBad")); return; }
    apply(sm2Priv, sm2Pub, window.sm2SaveKeys, fillSm2View, t("vp.pasteOk"));
  }
}
const pasteMap = {
  "rsav-paste-pub": "rsa-pub", "rsav-paste-priv": "rsa-priv",
  "sm2v-paste-pub": "sm2-pub", "sm2v-paste-priv": "sm2-priv",
};
Object.keys(pasteMap).forEach((id) => {
  const b = document.getElementById(id);
  if (b) b.addEventListener("click", () => pasteKey(pasteMap[id]));
});
document.getElementById("rsav-copy-pub").addEventListener("click", (e) => copyText(rsaPub.value, e.target));
document.getElementById("rsav-copy-priv").addEventListener("click", (e) => copyText(rsaPriv.value, e.target));
document.getElementById("rsav-regen").addEventListener("click", async (e) => {
  const btn = e.currentTarget, lbl = btn.querySelector("span"), orig = lbl.textContent;
  btn.disabled = true; lbl.textContent = "生成中…";
  await generateRsaKeys();
  fillRsaView();
  lbl.textContent = orig; btn.disabled = false;
});
document.getElementById("rsav-save").addEventListener("click", () => {
  closeRsaView();
  rsaToVault();
});

// 执行加密/解密/签名/验签
document.getElementById("rsa-run").addEventListener("click", async () => {
  if (!crypto.subtle) { rsaOutput.value = "❌ RSA 需要 https 或 localhost 环境。"; return; }
  const op = rsaOp.value;
  const enc = (s) => new TextEncoder().encode(s);
  const dec = (b) => new TextDecoder().decode(b);
  try {
    if (op === "encrypt") {
      const pub = await crypto.subtle.importKey("spki", pemToBuf(rsaPub.value), { name: "RSA-OAEP", hash: "SHA-256" }, false, ["encrypt"]);
      const ct = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, pub, enc(rsaInput.value));
      rsaOutput.value = abToB64(ct);
    } else if (op === "decrypt") {
      const priv = await crypto.subtle.importKey("pkcs8", pemToBuf(rsaPriv.value), { name: "RSA-OAEP", hash: "SHA-256" }, false, ["decrypt"]);
      const pt = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, priv, b64ToAb(rsaInput.value.trim()));
      rsaOutput.value = dec(pt);
    } else if (op === "sign") {
      const priv = await crypto.subtle.importKey("pkcs8", pemToBuf(rsaPriv.value), { name: "RSA-PSS", saltLength: 32, hash: "SHA-256" }, false, ["sign"]);
      const sig = await crypto.subtle.sign({ name: "RSA-PSS", saltLength: 32 }, priv, enc(rsaInput.value));
      rsaOutput.value = abToB64(sig);
    } else if (op === "verify") {
      const pub = await crypto.subtle.importKey("spki", pemToBuf(rsaPub.value), { name: "RSA-PSS", saltLength: 32, hash: "SHA-256" }, false, ["verify"]);
      const ok = await crypto.subtle.verify({ name: "RSA-PSS", saltLength: 32 }, pub, b64ToAb(rsaInput.value.trim()), enc(rsaMsg.value));
      rsaOutput.value = ok ? "✅ 验签通过：签名有效" : "❌ 验签失败：签名或原文不匹配";
    }
    if (!rsaOutput.value.startsWith("❌")) {
      const opKey = { encrypt: "op.encrypt", decrypt: "op.decrypt", sign: "op.sign", verify: "op.verify" }[op];
      const opName = (typeof t === "function") ? t(opKey) : op;
      addHistory({ cat: "rsa", go: "asym", op: op, preview: rsaInput.value.slice(0, 20) });
    }
  } catch (e) { rsaOutput.value = "❌ 出错了：" + e.message; }
});
document.getElementById("rsa-copy").addEventListener("click", (e) => copyText(rsaOutput.value, e.target));

/* ---------- 5.5 SM2 国密非对称（离线 sm-crypto + jsbn） ---------- */
const sm2Op = document.getElementById("sm2-op");
const sm2Input = document.getElementById("sm2-input");
const sm2InputLabel = document.getElementById("sm2-input-label");
const sm2MsgWrap = document.getElementById("sm2-msg-wrap");
const sm2Msg = document.getElementById("sm2-msg");
const sm2Output = document.getElementById("sm2-output");
const sm2Pub = document.getElementById("sm2-pub");
const sm2Priv = document.getElementById("sm2-priv");

const SM2_OP_LABELS = { encrypt: "asym.opEnc", decrypt: "asym.opDec", sign: "asym.opSign", verify: "asym.opVerify" };
const SM2_BTN_LABELS = { encrypt: "asym.btnEnc", decrypt: "asym.btnDec", sign: "asym.btnSign", verify: "asym.btnVerify" };
const SM2_INPUT_LABELS = { encrypt: "明文", decrypt: "十六进制密文", sign: "待签名文本", verify: "签名 (十六进制)" };
function refreshSm2Labels() {
  sm2InputLabel.textContent = SM2_INPUT_LABELS[sm2Op.value];
  sm2MsgWrap.style.display = sm2Op.value === "verify" ? "" : "none";
  if (sm2OpLabel) sm2OpLabel.textContent = t(SM2_OP_LABELS[sm2Op.value]);
  if (sm2Run) { sm2Run.textContent = t(SM2_BTN_LABELS[sm2Op.value]); sm2Run.setAttribute("data-i18n", SM2_BTN_LABELS[sm2Op.value]); }
}
const sm2OpBtn = document.getElementById("sm2-op-btn");
const sm2OpLabel = document.getElementById("sm2-op-label");
const sm2Run = document.getElementById("sm2-run");
if (sm2OpBtn) sm2OpBtn.addEventListener("click", async () => {
  if (!window.dialog) return;
  const ops = ["encrypt", "decrypt", "sign", "verify"];
  const items = ops.map((v) => ({ label: t(SM2_OP_LABELS[v]), desc: "" }));
  const res = await window.dialog.sheet(items, t("asym.opLabel"));
  if (res == null || res < 0) return;
  sm2Op.value = ops[res];
  refreshSm2Labels();
});
refreshSm2Labels();

function sm2LoadKeys() {
  try { sm2Pub.value = localStorage.getItem("set_sm2_pub") || ""; sm2Priv.value = localStorage.getItem("set_sm2_priv") || ""; } catch (e) {}
}
function sm2SaveKeys() {
  try { localStorage.setItem("set_sm2_pub", sm2Pub.value); localStorage.setItem("set_sm2_priv", sm2Priv.value); } catch (e) {}
}
function ensureSm2Keys() {
  sm2LoadKeys();
  if (!sm2Pub.value && !sm2Priv.value) sm2GenerateKeys();
  const st = document.getElementById("sm2-status");
  if (st && (sm2Pub.value || sm2Priv.value)) {
    st.textContent = (typeof t === "function") ? t("sm2.keyReady") : "已生成密钥对";
  }
}
async function sm2GenerateKeys() {
  if (!window.smCrypto || !window.smCrypto.sm2) { sm2Output.value = "❌ SM2 库未加载，请刷新页面。"; return false; }
  try {
    const kp = window.smCrypto.sm2.generateKeyPairHex();
    sm2Pub.value = kp.publicKey;
    sm2Priv.value = kp.privateKey;
    sm2SaveKeys();
    const st = document.getElementById("sm2-status");
    if (st) st.textContent = (typeof t === "function") ? t("sm2.keyReady") : "已生成密钥对";
    return true;
  } catch (e) { sm2Output.value = "❌ 生成失败：" + e.message; return false; }
}

// 「查看/修改密钥对」弹窗（与 RSA 弹窗一致：截断展示 + 复制 + 重新生成 + 保存到密码本）
const sm2vMask = document.getElementById("sm2v-mask");
const sm2vPanel = document.getElementById("sm2v-panel");
function fillSm2View() {
  const pub = document.getElementById("sm2v-pub");
  const priv = document.getElementById("sm2v-priv");
  if (pub) pub.textContent = truncKey(sm2Pub.value);
  if (priv) priv.textContent = truncKey(sm2Priv.value);
}
function openSm2View() {
  if (!sm2Pub.value.trim() && !sm2Priv.value.trim()) sm2GenerateKeys();
  fillSm2View();
  if (sm2vPanel) sm2vPanel.classList.add("show");
  if (sm2vMask) sm2vMask.classList.add("show");
}
function closeSm2View() {
  if (sm2vPanel) sm2vPanel.classList.remove("show");
  if (sm2vMask) sm2vMask.classList.remove("show");
}
const sm2ViewBtn = document.getElementById("sm2-view");
if (sm2ViewBtn) sm2ViewBtn.addEventListener("click", openSm2View);
const sm2vClose = document.getElementById("sm2v-close");
if (sm2vClose) sm2vClose.addEventListener("click", closeSm2View);
if (sm2vMask) sm2vMask.addEventListener("click", closeSm2View);
const sm2vCopyPub = document.getElementById("sm2v-copy-pub");
if (sm2vCopyPub) sm2vCopyPub.addEventListener("click", (e) => copyText(sm2Pub.value, e.target));
const sm2vCopyPriv = document.getElementById("sm2v-copy-priv");
if (sm2vCopyPriv) sm2vCopyPriv.addEventListener("click", (e) => copyText(sm2Priv.value, e.target));
const sm2vRegen = document.getElementById("sm2v-regen");
if (sm2vRegen) sm2vRegen.addEventListener("click", async (e) => {
  const btn = e.currentTarget, span = btn.querySelector("span"), orig = span.textContent;
  btn.disabled = true; span.textContent = "生成中…";
  await sm2GenerateKeys();
  fillSm2View();
  span.textContent = orig; btn.disabled = false;
});
const sm2vSave = document.getElementById("sm2v-save");
if (sm2vSave) sm2vSave.addEventListener("click", () => {
  closeSm2View();
  const pub = sm2Pub.value.trim();
  if (!pub) { alert(_t("save.empty", "请先生成或粘贴密钥")); return; }
  if (window.openVaultPrompt) window.openVaultPrompt({ method: "SM2", password: pub, targetId: "sm2-pub", cat: "sm2" });
});

document.getElementById("sm2-run").addEventListener("click", () => {
  if (!window.smCrypto || !window.smCrypto.sm2) { sm2Output.value = "❌ SM2 库未加载，请刷新页面。"; return; }
  const sm2 = window.smCrypto.sm2;
  const op = sm2Op.value;
  try {
    let out;
    if (op === "encrypt") {
      out = sm2.doEncrypt(sm2Input.value, sm2Pub.value.trim(), 1);
    } else if (op === "decrypt") {
      out = sm2.doDecrypt(sm2Input.value.trim(), sm2Priv.value.trim(), 1);
      if (!out) out = "❌ 解密失败：私钥不正确或密文非法。";
    } else if (op === "sign") {
      out = sm2.doSignature(sm2Input.value, sm2Priv.value.trim(), { hash: true });
    } else if (op === "verify") {
      const ok = sm2.doVerifySignature(sm2Input.value.trim(), sm2Msg.value.trim(), sm2Pub.value.trim(), { hash: true });
      out = ok ? "✅ 验签通过：签名有效" : "❌ 验签失败：签名或原文不匹配";
    }
    sm2Output.value = out;
    if (typeof out === "string" && !out.startsWith("❌") && !out.startsWith("✅")) {
      const opKey = { encrypt: "op.encrypt", decrypt: "op.decrypt", sign: "op.sign", verify: "op.verify" }[op];
      addHistory({ cat: "sm2", go: "sm2", op: op, preview: (op === "verify" ? sm2Msg.value : sm2Input.value).slice(0, 20) });
    }
  } catch (e) { sm2Output.value = "❌ 出错了：" + e.message; }
});
document.getElementById("sm2-copy").addEventListener("click", (e) => copyText(sm2Output.value, e.target));
/* 结果区「保存到文件」：保存运算结果；密钥导出在查看弹窗里 */
document.getElementById("sm2-export-file").addEventListener("click", () => {
  if (sm2Output.value) saveTextFile("sm2_result.txt", sm2Output.value);
  else alert(_t("save.empty", "请先生成或粘贴密钥"));
});
/* 查看弹窗里「导出密钥文件」：导出公钥/私钥 txt */
function sm2ExportKeys() {
  if (sm2Pub.value) saveTextFile("sm2_public.txt", sm2Pub.value);
  if (sm2Priv.value) saveTextFile("sm2_private.txt", sm2Priv.value);
}
const sm2vExport = document.getElementById("sm2v-export");
if (sm2vExport) sm2vExport.addEventListener("click", sm2ExportKeys);

/* ---------- 5.5 RSA 密钥「保存到文件」 ---------- */
const _t = (k, f) => (window.t ? window.t(k) : f);
// 默认路径（设置里可改），文件名会带上该路径的最后一级目录名
function getSaveBase() {
  const p = (window.getSavePath ? window.getSavePath() : "sdcard/CrytoPwa").replace(/\/+$/, "");
  return p.split("/").pop() || "CryptoPwa";
}
function fallbackDownload(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
// 保存文本到文件：安卓 WebView 写系统文档目录；桌面优先 File System Access，否则下载
function saveTextFile(filename, content) {
  if (!content) { alert(_t("save.empty", "请先生成或粘贴密钥")); return; }
  /* 优先写进用户选择的保存目录（设置 → 内容保存路径 → 选择文件夹） */
  const saveUri = (localStorage.getItem("set_save_uri") || "").trim();
  if (saveUri && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.FolderPicker) {
    window.Capacitor.Plugins.FolderPicker.saveFile({
      uri: saveUri, name: filename, data: btoa(unescape(encodeURIComponent(content))),
    }).then(() => {
      if (window.toast) toast(_t("save.savedDoc", "已保存到所选目录：" + filename));
    }).catch((err) => {
      if (window.toast) toast(_t("save.fail", "保存失败：") + ((err && err.message) || err));
    });
    return;
  }
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
    window.Capacitor.Plugins.Filesystem.writeFile({
      path: filename, data: content, directory: "DOCUMENTS", recursive: true,
    }).then(() => {
      if (window.toast) toast(_t("save.savedDoc", "已保存到系统文档目录：" + filename));
    }).catch((err) => {
      if (window.toast) toast(_t("save.fail", "保存失败：") + ((err && err.message) || err));
    });
    return;
  }
  if (window.showSaveFilePicker) {
    window.showSaveFilePicker({
      suggestedName: filename,
      types: [{ description: "Text", accept: { "text/plain": [".pem", ".txt"] } }],
    }).then((h) =>
      h.createWritable().then((w) => w.write(content).then(() => w.close()))
    ).catch((err) => { if (err && err.name !== "AbortError") fallbackDownload(filename, content); });
  } else {
    fallbackDownload(filename, content);
  }
}
// 导出 JSON/文本：安卓 WebView 用系统分享/文件系统；桌面用 Blob 下载
window.downloadJson = function (name, content) {
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
    if (navigator.share) {
      try {
        const f = new File([content], name, { type: "application/json" });
        if (navigator.canShare && navigator.canShare({ files: [f] })) {
          navigator.share({ files: [f], title: name }).catch(() => {});
          return;
        }
      } catch (e) {}
    }
    window.Capacitor.Plugins.Filesystem.writeFile({
      path: name, data: content, directory: "DOCUMENTS", recursive: true,
    }).then(() => {
      if (window.toast) toast(_t("save.savedDoc", "已保存到系统文档目录：" + name));
    }).catch(() => { fallbackDownload(name, content); });
    return;
  }
  const blob = new Blob([content], { type: "application/octet-stream" });
  const aEl = document.createElement("a");
  aEl.href = URL.createObjectURL(blob);
  aEl.download = name;
  aEl.click();
  URL.revokeObjectURL(aEl.href);
};
function rsaSaveFile() {
  const pub = rsaPub.value.trim(), priv = rsaPriv.value.trim();
  if (!pub && !priv) { alert(_t("save.empty", "请先生成或粘贴密钥")); return; }
  const mask = document.getElementById("rsan-mask");
  const panel = document.getElementById("rsan-panel");
  const input = document.getElementById("rsa-name-input");
  input.value = getSaveBase();           // 默认带保存路径末级目录名（如 CryptoPwa）
  panel.classList.add("show"); mask.classList.add("show");
  const close = () => { panel.classList.remove("show"); mask.classList.remove("show"); };
  document.getElementById("rsa-name-close").onclick = close;
  mask.onclick = close;
  document.getElementById("rsa-name-ok").onclick = () => {
    let raw = input.value.trim();
    if (!raw) raw = "my_keys";
    const safe = raw.replace(/[\\/:*?"<>|\s]+/g, "_");   // 清洗非法字符
    close();
    // 存在的密钥才导出文件（一对则两个，单把则一个）
    if (pub) saveTextFile(safe + "_public.pem", pub);
    if (priv) saveTextFile(safe + "_private.pem", priv);
  };
}
// 「保存到密码本」：由查看密钥弹窗里的按钮触发（rsav-save / sm2v-save）
// 结果区「保存到文件」：保存运算结果（rsa-output）；密钥导出在查看弹窗里
function rsaSaveResult() {
  const out = rsaOutput.value.trim();
  if (!out) { alert(_t("save.empty", "请先生成或粘贴密钥")); return; }
  saveTextFile("rsa_result.txt", out);
}
const rsaExportBtn = document.getElementById("rsa-export-file");
if (rsaExportBtn) rsaExportBtn.addEventListener("click", rsaSaveResult);
// 查看弹窗里「导出密钥文件」：把当前公钥/私钥导出为 .pem 文件
function rsaExportKeys() {
  const pub = rsaPub.value.trim(), priv = rsaPriv.value.trim();
  if (!pub && !priv) { alert(_t("save.empty", "请先生成或粘贴密钥")); return; }
  const mask = document.getElementById("rsan-mask");
  const panel = document.getElementById("rsan-panel");
  const input = document.getElementById("rsa-name-input");
  input.value = getSaveBase();           // 默认带保存路径末级目录名（如 CryptoPwa）
  panel.classList.add("show"); mask.classList.add("show");
  const close = () => { panel.classList.remove("show"); mask.classList.remove("show"); };
  document.getElementById("rsa-name-close").onclick = close;
  mask.onclick = close;
  document.getElementById("rsa-name-ok").onclick = () => {
    let raw = input.value.trim();
    if (!raw) raw = "my_keys";
    const safe = raw.replace(/[\\/:*?"<>|\s]+/g, "_");   // 清洗非法字符
    close();
    // 存在的密钥才导出文件（一对则两个，单把则一个）
    if (pub) saveTextFile(safe + "_public.pem", pub);
    if (priv) saveTextFile(safe + "_private.pem", priv);
  };
}
const rsavExport = document.getElementById("rsav-export");
if (rsavExport) rsavExport.addEventListener("click", rsaExportKeys);
function rsaToVault() {
  const pub = rsaPub.value.trim(), priv = rsaPriv.value.trim();
  if (!pub && !priv) { alert(_t("save.empty", "请先生成或粘贴密钥")); return; }
  if (window.openVaultPrompt) {
    if (pub && priv) {
      // 一对公钥+私钥 → 存为一组（徽章 2）
      window.openVaultPrompt({ kind: "rsa-pair", pub: pub, priv: priv, targetId: "rsa-priv", cat: "rsa" });
    } else {
      // 只有一把（粘贴了对方公钥或导入的私钥）→ 存为导入项（徽章“外”）
      const isPub = !!pub;
      window.openVaultPrompt({ kind: "rsa-import", side: isPub ? "public" : "private", password: isPub ? pub : priv, targetId: "rsa-" + (isPub ? "pub" : "priv"), cat: "rsa" });
    }
  }
}

/* ---------- 6. 二维码面板 ---------- */
document.getElementById("qr-btn").addEventListener("click", () => {
  const text = document.getElementById("qr-input").value;
  const box = document.getElementById("qr-output");
  if (!text) { box.innerHTML = ""; return; }
  try {
    const qr = qrcode(0, document.getElementById("qr-ec").value); // 0=自动选版本
    qr.addData(text);
    qr.make();
    let svg = qr.createSvgTag({ cellSize: 6, margin: 8, scalable: true });
    /* 美化：前景色 / 背景色 */
    const fg = document.getElementById("qr-fg") ? document.getElementById("qr-fg").value || "#000000" : "#000000";
    const bg = document.getElementById("qr-bg") ? document.getElementById("qr-bg").value || "#ffffff" : "#ffffff";
    svg = svg.replace(/fill="black"/g, 'fill="' + fg + '"').replace(/fill="white"/g, 'fill="' + bg + '"');
    /* 美化：中心 Logo（图片 dataURL 叠加） */
    if (window.__qrLogo) {
      const m = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
      if (m) {
        const size = parseInt(m[1], 10);
        const l = Math.max(20, Math.round(size * 0.24));
        const pos = Math.round((size - l) / 2);
        svg = svg.replace("</svg>",
          `<rect x="${pos - 2}" y="${pos - 2}" width="${l + 4}" height="${l + 4}" rx="${l / 2 + 2}" fill="${bg}" />` +
          `<image href="${window.__qrLogo}" x="${pos}" y="${pos}" width="${l}" height="${l}" preserveAspectRatio="xMidYMid meet" />` +
          `</svg>`);
      }
    }
    box.innerHTML = svg;
    addHistory({ cat: "qr", go: "qr", op: "gen", preview: text.slice(0, 24) });
  } catch (e) {
    box.innerHTML = '<p class="hint error">内容过长，无法生成二维码</p>';
  }
});
/* 二维码美化：Logo 选择/清除 */
(function () {
  const logoBtn = document.getElementById("qr-logo-btn");
  const logoFile = document.getElementById("qr-logo-file");
  const logoClear = document.getElementById("qr-logo-clear");
  if (logoBtn && logoFile) logoBtn.onclick = () => logoFile.click();
  if (logoFile) logoFile.onchange = () => {
    const f = logoFile.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { window.__qrLogo = r.result; if (window.toast) toast(typeof t === "function" ? t("qr.logoOk") : "已设置 Logo，重新生成即可看到"); };
    r.readAsDataURL(f);
  };
  if (logoClear) logoClear.onclick = () => { window.__qrLogo = ""; if (window.toast) toast(typeof t === "function" ? t("qr.logoCleared") : "已清除 Logo"); };
})();
document.getElementById("qr-download").addEventListener("click", () => {
  const svg = document.querySelector("#qr-output svg");
  if (!svg) return;
  const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "qrcode.svg"; a.click();
  URL.revokeObjectURL(url);
});

/* ---------- 6.4 二维码 / 条形码 标签切换 ---------- */
const qrTabs = document.getElementById("qr-tabs");
if (qrTabs) {
  qrTabs.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
    qrTabs.querySelectorAll("button").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    const v = b.dataset.v;
    document.getElementById("qr-pane-qr").style.display = v === "qr" ? "" : "none";
    document.getElementById("qr-pane-bc").style.display = v === "bc" ? "" : "none";
  }));
}

/* ---------- 6.4b 条形码生成（JsBarcode 离线库） ---------- */
const bcBtn = document.getElementById("bc-btn");
/* 条形码生成（可复用；选项变化时自动重新生成） */
let bcTimer = null;
function doBarcode() {
  const val = document.getElementById("bc-input").value;
  const out = document.getElementById("bc-output");
  const hint = document.getElementById("bc-hint");
  if (!val) { if (out) out.innerHTML = ""; if (hint) hint.textContent = ""; return; }
  if (out) out.innerHTML = '<svg id="bc-svg"></svg>';
  try {
    window.JsBarcode("#bc-svg", val, {
      format: document.getElementById("bc-fmt").value,
      displayValue: document.getElementById("bc-showval").checked,
      lineColor: document.getElementById("bc-color").value,
      background: document.getElementById("bc-bg").value,
      height: parseInt(document.getElementById("bc-height").value, 10) || 80,
      width: 2,
      margin: 10,
    });
    if (hint) { hint.textContent = ""; hint.className = "hint"; }
    addHistory({ cat: "qr", go: "qr", op: "bc", preview: val.slice(0, 24) });
  } catch (e) {
    if (out) out.innerHTML = "";
    if (hint) { hint.textContent = ((typeof t === "function") ? t("bc.err") : "无法生成：") + (e && e.message ? e.message : ""); hint.className = "hint error"; }
  }
}
function bcRegen() {
  clearTimeout(bcTimer);
  bcTimer = setTimeout(doBarcode, 160);
}
if (bcBtn) bcBtn.addEventListener("click", doBarcode);
/* 选项变化 → 自动重新生成（字体开关/颜色/背景/高度/格式/内容） */
["bc-showval", "bc-color", "bc-bg", "bc-height", "bc-fmt", "bc-input"].forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener(id === "bc-input" ? "input" : "change", bcRegen);
});
/* 色板预设（酷安风格）：线条色 + 背景色 swatch */
(function () {
  const LINE_COLORS = ["#111111", "#000000", "#00a862", "#1a73e8", "#e53935", "#f59e0b", "#7b1fa2", "#00796b"];
  const BG_COLORS = ["#ffffff", "#f5f5f5", "#e8f5e9", "#e3f2fd", "#fce4ec", "#fff8e1", "#f3e5f5", "#e0f2f1"];
  const mkSwatches = (wrapId, colorInputId, colors) => {
    const wrap = document.getElementById(wrapId);
    const input = document.getElementById(colorInputId);
    if (!wrap || !input) return;
    colors.forEach((c) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "swatch" + (input.value.toLowerCase() === c ? " active" : "");
      b.style.setProperty("--sw", c);
      b.addEventListener("click", () => {
        input.value = c;
        wrap.querySelectorAll(".swatch").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        bcRegen();
      });
      wrap.appendChild(b);
    });
    input.addEventListener("input", () => {
      wrap.querySelectorAll(".swatch").forEach((x) => x.classList.remove("active"));
      bcRegen();
    });
  };
  mkSwatches("bc-color-swatches", "bc-color", LINE_COLORS);
  mkSwatches("bc-bg-swatches", "bc-bg", BG_COLORS);
})();
const bcDl = document.getElementById("bc-download");
if (bcDl) bcDl.addEventListener("click", () => {
  const svg = document.querySelector("#bc-output svg");
  if (!svg) return;
  const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "barcode.svg"; a.click();
  URL.revokeObjectURL(url);
});

/* ---------- 6.5 扫描二维码（摄像头 + jsQR 本地解码） ---------- */
const qrScanBtn = document.getElementById("qr-scan-btn");
const scanMask = document.getElementById("scan-mask");
const scanPanel = document.getElementById("scan-panel");
const scanVideo = document.getElementById("scan-video");
const scanStatus = document.getElementById("scan-status");
const scanResult = document.getElementById("scan-result");
const scanText = document.getElementById("scan-text");
const scanFileInput = document.getElementById("scan-file");
let scanStream = null, scanRaf = null;

function openScan() {
  scanPanel.classList.add("show"); scanMask.classList.add("show");
  scanResult.hidden = true; scanText.value = "";
  startCamera();
}
function closeScan() {
  stopCamera();
  scanPanel.classList.remove("show"); scanMask.classList.remove("show");
}
function stopCamera() {
  if (scanRaf) { cancelAnimationFrame(scanRaf); scanRaf = null; }
  if (scanStream) { scanStream.getTracks().forEach((t) => t.stop()); scanStream = null; }
}
function scanTick() {
  if (!scanVideo.videoWidth) { scanRaf = requestAnimationFrame(scanTick); return; }
  const cv = document.createElement("canvas");
  cv.width = scanVideo.videoWidth; cv.height = scanVideo.videoHeight;
  const ctx = cv.getContext("2d");
  ctx.drawImage(scanVideo, 0, 0, cv.width, cv.height);
  let res = null;
  try { res = window.jsQR(ctx.getImageData(0, 0, cv.width, cv.height).data, cv.width, cv.height); } catch (e) {}
  if (res && res.data) {
    stopCamera();
    scanText.value = res.data;
    scanText.dispatchEvent(new Event("input"));
    scanResult.hidden = false;
    scanStatus.textContent = (typeof t === "function") ? t("qr.scanOk") : "识别成功";
    addHistory({ cat: "qr", go: "qr", op: "scan", preview: res.data.slice(0, 24) });
    return;
  }
  scanRaf = requestAnimationFrame(scanTick);
}
function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    scanStatus.textContent = (typeof t === "function") ? t("qr.noCam") : "此环境不支持摄像头，请改用“从相册选择”";
    return;
  }
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then((stream) => {
      scanStream = stream;
      scanVideo.srcObject = stream;
      scanVideo.play();
      scanStatus.textContent = (typeof t === "function") ? t("qr.scanTip") : "将二维码对准取景框";
      scanRaf = requestAnimationFrame(scanTick);
    })
    .catch((err) => {
      scanStatus.textContent = ((typeof t === "function") ? t("qr.camFail") : "无法打开摄像头：") + (err && err.message ? err.message : "");
    });
}
function decodeImageFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement("canvas");
      cv.width = img.naturalWidth; cv.height = img.naturalHeight;
      const ctx = cv.getContext("2d");
      ctx.drawImage(img, 0, 0, cv.width, cv.height);
      let res = null;
      try { res = window.jsQR(ctx.getImageData(0, 0, cv.width, cv.height).data, cv.width, cv.height); } catch (e) {}
      if (res && res.data) {
        scanText.value = res.data; scanText.dispatchEvent(new Event("input")); scanResult.hidden = false;
        scanStatus.textContent = (typeof t === "function") ? t("qr.scanOk") : "识别成功";
        addHistory({ cat: "qr", go: "qr", op: "scan", preview: res.data.slice(0, 24) });
      } else {
        scanStatus.textContent = (typeof t === "function") ? t("qr.scanNone") : "未识别到二维码，换一张试试";
      }
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}
if (qrScanBtn) {
  qrScanBtn.addEventListener("click", openScan);
  const scanClose = document.getElementById("scan-close");
  if (scanClose) scanClose.onclick = closeScan;
  if (scanMask) scanMask.onclick = closeScan;
  const scanStop = document.getElementById("scan-stop");
  if (scanStop) scanStop.onclick = closeScan;
  const scanUpload = document.getElementById("scan-upload");
  if (scanUpload) scanUpload.onclick = () => scanFileInput.click();
  if (scanFileInput) scanFileInput.onchange = () => { if (scanFileInput.files[0]) decodeImageFile(scanFileInput.files[0]); };
  const scanCopy = document.getElementById("scan-copy");
  if (scanCopy) scanCopy.addEventListener("click", (e) => copyText(scanText.value, e.target));
}

/* 使用教程：按语言渲染（zh / en 完整双语内容） */
function renderGuide() {
  const box = document.getElementById("guide-box");
  if (!box) return;
  const v = (typeof t === "function") ? t("guide.text", "") : "";
  box.innerHTML = v || "";
}
if (document.getElementById("guide-box")) {
  renderGuide();
  /* 语言切换后重新渲染 */
  document.addEventListener("applylang", renderGuide);
}
// 其他 App “分享”文字/链接（manifest share_target，GET 方式）会以 ?text=...&url=...&title=... 打开本页；
// 也支持自定义 URL Scheme / Intent：crypto-pwa://?text=... 或直接 ?text=... 打开。
// 收到内容后不直接塞进某个面板，而是弹出“外部内容”选择器，让用户挑编码/加密方式。
function renderIncoming() {
  const preview = document.getElementById("inc-preview");
  if (!preview) return;
  const img = window.__incomingImage;
  const txt = (window.__incomingText || "").trim();
  if (img) {
    preview.classList.add("img");
    preview.innerHTML = '<img src="' + img + '" alt="shared" />';
  } else {
    preview.classList.remove("img");
    preview.textContent = txt || _t("inc.none", "（无内容）");
  }
}

// 把外部内容送到某个目标面板并填充、跳转
function sendTo(target, opts) {
  opts = opts || {};
  if (target === "enc") {
    const inp = document.getElementById("enc-input");
    inp.value = window.__incomingText || "";
    // opts.v 形如 b64 / hex / url（快捷编码芯片）；选中对应方式并直接编码
    if (opts.v) {
      const m = encMethodSeg.querySelector('button[data-v="' + opts.v + '"]');
      if (m) { encMethodSeg.querySelectorAll("button").forEach((x) => x.classList.remove("active")); m.classList.add("active"); }
    }
    showPanel("enc");
    if (opts.run !== false) encDo("enc");
  } else if (target === "sym") {
    const inp = document.getElementById("sym-input");
    inp.value = window.__incomingText || "";
    const sel = document.getElementById("sym-algo");
    sel.value = opts.v || "AES";
    refreshSymHints();
    showPanel("sym");
  } else if (target === "rsa") {
    const inp = document.getElementById("rsa-input");
    inp.value = window.__incomingText || "";
    const sel = document.getElementById("rsa-op");
    sel.value = "encrypt"; // 用对方公钥加密
    refreshRsaLabels();
    showPanel("asym");
  } else if (target === "hash") {
    const inp = document.getElementById("hash-input");
    inp.value = window.__incomingText || "";
    const sel = document.getElementById("hash-algo");
    if (opts.v) sel.value = opts.v;
    showPanel("hash");
  } else if (target === "qr") {
    const inp = document.getElementById("qr-input");
    inp.value = window.__incomingText || "";
    showPanel("qr");
    document.getElementById("qr-btn").click();
  } else if (target === "imgb64") {
    // 图片 → Base64：优先用已收到的图片，否则跳到编码页手动选图
    if (window.__incomingImage) {
      const out = document.getElementById("enc-output");
      out.value = window.__incomingImage;
      showPanel("enc");
    } else {
      showPanel("enc");
      document.getElementById("enc-file").click();
    }
  }
}

function wireIncomingChips() {
  document.querySelectorAll("#panel-incoming .chip").forEach((c) => {
    c.addEventListener("click", () => sendTo(c.dataset.act, { v: c.dataset.v }));
  });
  const pick = document.getElementById("inc-pick-img");
  const file = document.getElementById("inc-file");
  if (pick && file) {
    pick.addEventListener("click", () => file.click());
    file.addEventListener("change", () => {
      const f = file.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => { window.__incomingImage = reader.result; renderIncoming(); };
      reader.readAsDataURL(f);
    });
  }
}

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
 * 点击 → __vaultApi.listAll(cat) 列出条目 → dialog.sheet 选 → 填到目标 input */
(function () {
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-fill]");
    if (!b) return;
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

/* ---------- 7.8 JSON 工具（格式化 / 提取代码 / 键值编辑） ---------- */
(function () {
  const $ = (id) => document.getElementById(id);

  // 子标签切换：格式化 / 提取代码 / 键值编辑
  const jsonTabs = $("json-tabs");
  const panes = { fmt: $("json-pane-fmt"), extract: $("json-pane-extract"), kv: $("json-pane-kv") };
  if (jsonTabs) {
    jsonTabs.querySelectorAll("button").forEach((b) => {
      b.addEventListener("click", () => {
        jsonTabs.querySelectorAll("button").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        const v = b.dataset.v;
        Object.keys(panes).forEach((k) => { if (panes[k]) panes[k].hidden = (k !== v); });
      });
    });
  }

  // —— 1) 格式化 / 压缩 / 校验 ——
  const jIn = $("json-input"), jOut = $("json-output"), jHint = $("json-fmt-hint");
  function tryParse(txt) {
    try { return { ok: true, val: JSON.parse(txt) }; }
    catch (e) { return { ok: false, err: e }; }
  }
  function setFmtHint(msg, isErr) {
    if (!jHint) return;
    jHint.textContent = msg || "";
    jHint.classList.toggle("error", !!isErr);
  }
  if ($("json-format")) {
    $("json-format").addEventListener("click", () => {
      const r = tryParse(jIn.value);
      if (!r.ok) { setFmtHint(t("json.invalid") + "：" + r.err.message, true); jOut.value = ""; return; }
      jOut.value = JSON.stringify(r.val, null, 2);
      setFmtHint("✓ " + t("json.ok"), false);
      addHistory({ cat: "json", go: "json", op: "fmt", preview: jIn.value.slice(0, 24) });
    });
    $("json-minify").addEventListener("click", () => {
      const r = tryParse(jIn.value);
      if (!r.ok) { setFmtHint(t("json.invalid") + "：" + r.err.message, true); jOut.value = ""; return; }
      jOut.value = JSON.stringify(r.val);
      setFmtHint("✓ " + t("json.ok"), false);
      addHistory({ cat: "json", go: "json", op: "minify", preview: jIn.value.slice(0, 24) });
    });
    $("json-validate").addEventListener("click", () => {
      const r = tryParse(jIn.value);
      if (!r.ok) { setFmtHint(t("json.invalid") + "：" + r.err.message, true); return; }
      setFmtHint("✓ " + t("json.ok"), false);
      addHistory({ cat: "json", go: "json", op: "validate", preview: jIn.value.slice(0, 24) });
    });
    $("json-copy").addEventListener("click", (e) => { if (jOut.value) copyText(jOut.value, e.currentTarget); });
  }

  // —— 2) 按路径提取并生成代码 ——
  const jExIn = $("json-ex-input"), jPath = $("json-path"), jLang = $("json-lang"),
        jCode = $("json-code"), jExHint = $("json-ex-hint");
  function renderValuePreview(v) {
    if (v === null) return "null";
    if (typeof v === "string") return '"' + v + '"';
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    return JSON.stringify(v);
  }
  function genCode(lang, path, segs, value) {
    const vPrev = renderValuePreview(value);
    const bracket = (s) => (/^\d+$/.test(s) ? "[" + s + "]" : '["' + s.replace(/"/g, '\\"') + '"]');
    const chain = segs.map(bracket).join("");
    const getChain = segs.map((s) => (/^\d+$/.test(s) ? ".get(" + s + ")" : '.get("' + s.replace(/"/g, '\\"') + '")')).join("");
    const head = "// " + t("json.fieldPath") + "：" + path + "\n// " + t("json.output") + "： " + vPrev + "\n";
    switch (lang) {
      case "py":    return "# " + t("json.fieldPath") + "：" + path + "\n# " + t("json.output") + "： " + vPrev + "\nvalue = data" + chain;
      case "php":   return "// " + t("json.fieldPath") + "：" + path + "\n// " + t("json.output") + "： " + vPrev + "\n$value = $data" + chain + ";";
      case "csharp":return head + "var value = data" + chain + ";";
      case "java":  return head + "Object value = (Object) data" + getChain + ";";
      case "go":    return head + "value := data" + chain + "  // 可能需要类型断言 (map[string]interface{})";
      case "js":
      default:      return head + "const value = data" + chain + ";";
    }
  }
  if ($("json-extract")) {
    $("json-extract").addEventListener("click", () => {
      const r = tryParse(jExIn.value);
      if (!r.ok) { jExHint.textContent = t("json.invalid") + "：" + r.err.message; jExHint.classList.add("error"); jCode.value = ""; return; }
      const segs = jPath.value.split(".").map((s) => s.trim()).filter(Boolean);
      if (segs.length === 0) { jExHint.textContent = t("json.notFound"); jExHint.classList.add("error"); jCode.value = ""; return; }
      let cur = r.val, found = true;
      for (const s of segs) {
        if (Array.isArray(cur) && /^\d+$/.test(s)) {
          const i = Number(s);
          if (i >= cur.length) { found = false; break; }
          cur = cur[i];
        } else if (cur !== null && typeof cur === "object" && s in cur) {
          cur = cur[s];
        } else { found = false; break; }
      }
      if (!found) { jExHint.textContent = t("json.notFound") + "：" + jPath.value; jExHint.classList.add("error"); jCode.value = ""; return; }
      jCode.value = genCode(jLang.value, jPath.value, segs, cur);
      jExHint.textContent = ""; jExHint.classList.remove("error");
      addHistory({ cat: "json", go: "json", op: "extract", method: jLang.value, preview: jPath.value.slice(0, 24) });
    });
    $("json-code-copy").addEventListener("click", (e) => { if (jCode.value) copyText(jCode.value, e.currentTarget); });
  }

  // —— 3) 键值对编辑 ——
  const kvList = $("json-kv-list");
  function kvRow(key = "", val = "", type = "string") {
    const row = document.createElement("div");
    row.className = "kv-row";
    const opt = (v, label) => '<option value="' + v + '"' + (type === v ? " selected" : "") + ">" + label + "</option>";
    row.innerHTML =
      '<input class="kv-key" type="text" placeholder="key" value="' + escapeHtml(key) + '" />' +
      '<input class="kv-val" type="text" placeholder="value" value="' + escapeHtml(val) + '" />' +
      '<select class="kv-type">' +
      opt("string", t("kv.string") || "字符串") +
      opt("number", t("kv.number") || "数字") +
      opt("boolean", t("kv.boolean") || "布尔") +
      opt("null", t("kv.null") || "空") +
      "</select>" +
      '<button class="kv-del" type="button" aria-label="删除">✕</button>';
    row.querySelector(".kv-del").addEventListener("click", () => row.remove());
    return row;
  }
  function addKvRow(key, val, type) { if (kvList) kvList.appendChild(kvRow(key, val, type)); }
  if ($("json-kv-add")) {
    $("json-kv-add").addEventListener("click", () => addKvRow());
    /* 「＋ 模板」：弹窗选择 随机示例 / JSON 模板，一键填入键值列表 */
    $("json-kv-template").addEventListener("click", () => {
      const mask = document.createElement("div");
      mask.className = "vp-mask";
      const panel = document.createElement("div");
      panel.className = "vp-panel";
      panel.innerHTML =
        `<div class="vp-inner">` +
        `<div class="vp-head"><span class="vp-title">${escapeHtml(t("json.tplTitle"))}</span><button class="vp-close" id="kv-tpl-close">✕</button></div>` +
        `<div class="kv-tpl-list">` +
        `<button class="kv-tpl-opt" id="kv-tpl-random">${escapeHtml(t("json.tplRandom"))}</button>` +
        `<button class="kv-tpl-opt" id="kv-tpl-json">${escapeHtml(t("json.tplTemplate"))}</button>` +
        `</div>` +
        `</div>`;
      mask.appendChild(panel);
      document.body.appendChild(mask);
      const close = () => mask.remove();
      panel.querySelector("#kv-tpl-close").onclick = close;
      mask.addEventListener("click", (e) => { if (e.target === mask) close(); });
      panel.querySelector("#kv-tpl-random").onclick = () => {
        kvList.innerHTML = "";
        addKvRow("name", "Tom", "string");
        addKvRow("age", String(20 + Math.floor(Math.random() * 30)), "number");
        addKvRow("email", "user" + Math.floor(Math.random() * 9999) + "@example.com", "string");
        addKvRow("active", Math.random() > 0.5 ? "true" : "false", "boolean");
        addKvRow("remark", "random-" + Date.now().toString(36), "string");
        close();
      };
      panel.querySelector("#kv-tpl-json").onclick = () => {
        kvList.innerHTML = "";
        addKvRow("id", "1", "number");
        addKvRow("name", "zhangsan", "string");
        addKvRow("email", "zhangsan@example.com", "string");
        addKvRow("role", "admin", "string");
        addKvRow("enabled", "true", "boolean");
        addKvRow("profile", '{"city":"北京","level":3}', "string");
        close();
      };
      mask.classList.add("show"); panel.classList.add("show");
    });
    $("json-kv-import").addEventListener("click", () => {
      const r = tryParse(jIn.value);
      if (!r.ok || typeof r.val !== "object" || r.val === null || Array.isArray(r.val)) { toast(t("json.invalid")); return; }
      kvList.innerHTML = "";
      let n = 0;
      Object.entries(r.val).forEach(([k, v]) => {
        let type = "string";
        if (typeof v === "number") type = "number";
        else if (typeof v === "boolean") type = "boolean";
        else if (v === null) type = "null";
        addKvRow(k, typeof v === "object" ? JSON.stringify(v) : String(v), type);
        n++;
      });
      toast(t("json.imported").replace("N", n));
    });
    $("json-kv-gen").addEventListener("click", () => {
      const obj = {};
      let skipped = 0;
      kvList.querySelectorAll(".kv-row").forEach((row) => {
        const k = row.querySelector(".kv-key").value.trim();
        const raw = row.querySelector(".kv-val").value;
        const type = row.querySelector(".kv-type").value;
        if (!k) { skipped++; return; }
        let v;
        if (type === "number") v = raw.trim() === "" ? 0 : Number(raw);
        else if (type === "boolean") v = raw.trim().toLowerCase() === "true";
        else if (type === "null") v = null;
        else v = raw;
        obj[k] = v;
      });
      const out = $("json-kv-output");
      try { out.value = JSON.stringify(obj, null, 2); }
      catch (e) { out.value = ""; toast(t("json.invalid")); return; }
      if (skipped) toast(t("json.emptyKey"));
      addHistory({ cat: "json", go: "json", op: "kv", preview: Object.keys(obj).length + " keys" });
    });
    $("json-kv-copy").addEventListener("click", (e) => { const out = $("json-kv-output"); if (out.value) copyText(out.value, e.currentTarget); });
  }
})();

/* ---------- 7.9 Crontab 定时表达式 ---------- */
(function () {
  const $ = (id) => document.getElementById(id);
  const expr = $("cron-expr");
  const nextEl = $("cron-next");
  const parseBtn = $("cron-parse");
  if (!expr || !nextEl || !parseBtn) return;

  const FIELDS = [
    { key: "min", min: 0, max: 59 },
    { key: "hour", min: 0, max: 23 },
    { key: "dom", min: 1, max: 31 },
    { key: "mon", min: 1, max: 12 },
    { key: "dow", min: 0, max: 7 },
  ];

  // 单段解析：支持 * 、a,b,c 列表、a-b 区间、*/n 步长、a-b/n 区间步长
  function parseCronField(raw, min, max) {
    const set = new Set();
    raw.split(",").forEach((p) => {
      if (p === "") throw new Error("empty");
      let step = 1, base = p;
      if (p.indexOf("/") >= 0) {
        const sp = p.split("/");
        if (sp.length !== 2) throw new Error("bad step");
        base = sp[0]; step = parseInt(sp[1], 10);
        if (!Number.isInteger(step) || step <= 0) throw new Error("bad step");
      }
      if (base === "*") {
        for (let i = min; i <= max; i += step) set.add(i);
      } else if (base.indexOf("-") >= 0) {
        const range = base.split("-");
        if (range.length !== 2) throw new Error("bad range");
        const a = parseInt(range[0], 10), b = parseInt(range[1], 10);
        if (!Number.isInteger(a) || !Number.isInteger(b)) throw new Error("bad range");
        if (a < min || b > max || a > b) throw new Error("range oob");
        for (let i = a; i <= b; i += step) set.add(i);
      } else {
        const v = parseInt(base, 10);
        if (!Number.isInteger(v) || v < min || v > max) throw new Error("value oob");
        set.add(v);
      }
    });
    return [...set];
  }

  function parseExpr(str) {
    const parts = (str || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length !== 5) throw new Error(t("cron.badFields"));
    const allowed = {};
    FIELDS.forEach((f, i) => {
      const raw = parts[i];
      allowed[f.key + "Star"] = raw === "*";
      allowed[f.key] = parseCronField(raw, f.min, f.max);
    });
    // 周字段 0/7 都表示周日，统一归并到 0
    if (allowed.dow.includes(7) && !allowed.dow.includes(0)) allowed.dow.push(0);
    allowed.dow = [...new Set(allowed.dow)];
    return allowed;
  }

  // 日/周：Vixie 语义——两者都受限时取“或”，否则各自必须匹配
  function dayMatches(d, a) {
    const dom = d.getDate(), dow = d.getDay();
    if (a.domStar || a.dowStar) {
      if (!a.domStar && !a.dom.includes(dom)) return false;
      if (!a.dowStar && !a.dow.includes(dow)) return false;
      return true;
    }
    return a.dom.includes(dom) || a.dow.includes(dow);
  }
  function nextAfter(arr, cur) { for (const v of arr) if (v > cur) return v; return null; }
  function advanceMonth(d, months) {
    const nd = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
    nd.setMonth(nd.getMonth() + 1);
    let g = 0;
    while (!months.includes(nd.getMonth() + 1) && g < 300) { nd.setMonth(nd.getMonth() + 1); g++; }
    return nd;
  }
  // 计算 from 之后的下一个匹配时刻（精确到分钟）
  function nextCron(a, from) {
    let d = new Date(from.getTime());
    d.setSeconds(0, 0); d.setMinutes(d.getMinutes() + 1);
    const limit = new Date(from.getTime() + 6 * 366 * 24 * 3600 * 1000);
    let guard = 0;
    while (d < limit && guard < 4000000) {
      guard++;
      if (!a.mon.includes(d.getMonth() + 1)) { d = advanceMonth(d, a.mon); continue; }
      if (!dayMatches(d, a)) { d.setDate(d.getDate() + 1); d.setHours(0, 0, 0, 0); continue; }
      if (!a.hour.includes(d.getHours())) {
        const nh = nextAfter(a.hour, d.getHours());
        if (nh === null) { d.setDate(d.getDate() + 1); d.setHours(0, 0, 0, 0); continue; }
        d.setHours(nh, 0, 0, 0); continue;
      }
      if (!a.min.includes(d.getMinutes())) {
        const nm = nextAfter(a.min, d.getMinutes());
        if (nm === null) { d.setHours(d.getHours() + 1, 0, 0, 0); continue; }
        d.setMinutes(nm, 0, 0); continue;
      }
      return d;
    }
    return null;
  }

  function weekday(d) {
    const L = window.__lang;
    if (L === "ja") return ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
    if (L === "ko") return ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
    if (L === "ar") return ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"][d.getDay()];
    if (L === "en") return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
    return "周" + ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
  }
  function fmt(d) {
    const p = (x) => String(x).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())} ${weekday(d)}`;
  }

  function doParse() {
    let allowed;
    try { allowed = parseExpr(expr.value); }
    catch (e) { nextEl.innerHTML = `<div class="cron-err">${escapeHtml(t("cron.bad"))}${escapeHtml(expr.value || "")}</div>`; return; }
    const runs = [];
    let from = new Date();
    for (let i = 0; i < 5; i++) {
      const r = nextCron(allowed, from);
      if (!r) break;
      runs.push(r); from = r;
    }
    if (runs.length === 0) {
      nextEl.innerHTML = `<div class="cron-err">${escapeHtml(t("cron.noRun"))}</div>`;
      return;
    }
    nextEl.innerHTML = runs.map((d, i) =>
      `<div class="cron-run"><span class="cron-idx">${i + 1}</span><span class="cron-when">${fmt(d)}</span></div>`
    ).join("");
    addHistory({ cat: "cron", go: "cron", op: "parse", preview: expr.value });
  }

  parseBtn.addEventListener("click", doParse);
  document.querySelectorAll(".cron-tpls .chip").forEach((b) =>
    b.addEventListener("click", () => { expr.value = b.dataset.expr; doParse(); })
  );
})();

/* ---------- 7.10 随机文本生成 ---------- */
(function () {
  const $ = (id) => document.getElementById(id);
  const tabs = $("rand-tabs");
  const paneStr = $("rand-pane-str");
  const paneFake = $("rand-pane-fake");
  if (!tabs || !paneStr || !paneFake) return;

  tabs.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
    tabs.querySelectorAll("button").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    const v = b.dataset.v;
    paneStr.style.display = v === "str" ? "" : "none";
    paneFake.style.display = v === "fake" ? "" : "none";
  }));

  const SETS = {
    digit: "0123456789",
    lower: "abcdefghijklmnopqrstuvwxyz",
    upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    special: "!@#$%^&*()-_=+[]{};:,.<>?",
  };
  const LOWER = "abcdefghijklmnopqrstuvwxyz";
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const digit = () => Math.floor(Math.random() * 10);
  const randLower = (n) => { let s = ""; for (let i = 0; i < n; i++) s += LOWER[digit()]; return s; };
  function countUnit() {
    const L = window.__lang;
    if (L === "en") return " items";
    if (L === "ja") return " 件";
    if (L === "ko") return " 개";
    if (L === "ar") return " عناصر";
    return " 条";
  }
  function clampInt(v, lo, hi, def) {
    let n = parseInt(v, 10);
    if (!Number.isInteger(n)) n = def;
    return Math.max(lo, Math.min(hi, n));
  }
  function genOne(pool, len, re) {
    if (!re) {
      let s = "";
      for (let i = 0; i < len; i++) s += pool[Math.floor(Math.random() * pool.length)];
      return s;
    }
    for (let a = 0; a < 500; a++) {
      let s = "";
      for (let i = 0; i < len; i++) s += pool[Math.floor(Math.random() * pool.length)];
      if (re.test(s)) return s;
    }
    return null;
  }

  /* 字符范围按钮：点击切换 active（多选） */
  document.querySelectorAll(".rcs-btn").forEach((b) => {
    b.addEventListener("click", () => b.classList.toggle("active"));
  });
  /* 数量/长度上下按钮 */
  document.querySelectorAll(".num-btn").forEach((b) => {
    b.addEventListener("click", () => {
      const target = document.getElementById(b.dataset.target);
      if (!target) return;
      const step = parseInt(b.dataset.step, 10) || 1;
      const min = parseInt(target.min, 10) || 0;
      const max = parseInt(target.max, 10) || 9999;
      let v = parseInt(target.value, 10) || 0;
      v = Math.max(min, Math.min(max, v + step));
      target.value = v;
      target.dispatchEvent(new Event("input"));
    });
  });

  $("rand-gen").addEventListener("click", () => {
    const chosen = [...document.querySelectorAll(".rcs-btn.active")].map((c) => c.dataset.v);
    let pool = chosen.map((k) => SETS[k] || "").join("");
    const custom = $("rand-custom").value || "";
    if (custom) pool += custom;
    if (!pool) { toast(t("rand.noCharset")); return; }
    const len = clampInt($("rand-len").value, 1, 512, 16);
    const count = clampInt($("rand-count").value, 1, 200, 1);
    let re = null;
    const reStr = ($("rand-regex").value || "").trim();
    if (reStr) { try { re = new RegExp(reStr); } catch (e) { toast(t("rand.regexBad") + e.message); return; } }
    const out = [];
    for (let i = 0; i < count; i++) {
      const one = genOne(pool, len, re);
      if (one === null) { toast(t("rand.regexFail")); return; }
      out.push(one);
    }
    $("rand-output").value = out.join("\n");
    addHistory({ cat: "rand", go: "rand", op: "gen", method: "str", preview: count + countUnit() });
  });

  /* ---- 随机虚假数据生成器（无需外部库） ---- */
  const SUR = "王李张刘陈杨黄赵周吴徐孙朱马胡郭林何高罗郑梁谢宋唐许韩冯邓曹彭曾萧田董袁潘于蒋蔡余杜叶程苏魏吕丁任沈姚卢傅钟姜崔谭廖范汪熊金陆郝孔白康毛邱秦江史顾侯邵孟龙万段钱汤尹黎易常武乔贺".split("");
  const GIVEN = ["伟", "芳", "娜", "秀英", "敏", "静", "丽", "强", "磊", "军", "洋", "勇", "艳", "杰", "娟", "涛", "明", "超", "秀兰", "霞", "平", "刚", "桂英", "建华", "文", "华", "金凤", "婷", "宇", "浩然", "子轩", "梓涵", "欣怡", "雨欣", "志强", "建国", "春梅", "海燕", "晓东", "晓明"];
  const EMAIL_D = ["gmail.com", "qq.com", "163.com", "outlook.com", "hotmail.com", "yahoo.com", "foxmail.com"];
  const PROV = ["北京市", "上海市", "广东省广州市", "江苏省南京市", "浙江省杭州市", "四川省成都市", "湖北省武汉市", "陕西省西安市", "山东省济南市", "湖南省长沙市"];
  const DIST = ["朝阳区", "海淀区", "浦东新区", "天河区", "鼓楼区", "西湖区", "武侯区", "雁塔区", "历下区", "岳麓区"];
  const STREET = ["人民路", "中山路", "解放路", "建设大街", "和平路", "南京路", "北京路"];
  const URL_TLD = ["com", "cn", "net", "org", "io", "xyz"];
  const CO_PRE = ["鼎", "宏", "盛", "泰", "安", "华", "瑞", "鑫", "众", "智", "博", "创", "联", "恒", "兴"];
  const CO_IND = ["科技", "信息", "网络", "电子", "智能", "数据", "软件", "文化", "贸易", "生物"];
  const CO_SUF = ["有限公司", "股份有限公司", "集团有限公司"];
  const AREA = ["110101", "310101", "440101", "510101", "320101", "330101", "420101", "610101", "120101", "500101"];
  const W = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const CODE = "10X98765432";

  function genName() { return pick(SUR) + pick(GIVEN); }
  function genEmail() { return randLower(8 + digit()) + "@" + pick(EMAIL_D); }
  function genPhone() { let s = "1" + pick(["3", "4", "5", "6", "7", "8", "9"]); for (let i = 0; i < 9; i++) s += digit(); return s; }
  function genId() {
    const y = 1960 + Math.floor(Math.random() * 46);
    const m = 1 + Math.floor(Math.random() * 12);
    const d = 1 + Math.floor(Math.random() * 28);
    const p = (x) => String(x).padStart(2, "0");
    let s = pick(AREA) + y + p(m) + p(d);
    for (let i = 0; i < 3; i++) s += digit();
    let sum = 0;
    for (let i = 0; i < 17; i++) sum += parseInt(s[i], 10) * W[i];
    s += CODE[sum % 11];
    return s;
  }
  function genAddr() { return pick(PROV) + pick(DIST) + pick(STREET) + (1 + Math.floor(Math.random() * 200)) + "号"; }
  function genCompany() { return pick(CO_PRE) + pick(CO_PRE) + pick(CO_IND) + pick(CO_SUF); }
  function genUuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0; const v = c === "x" ? r : (r & 0x3 | 0x8); return v.toString(16);
    });
  }
  function genUrl() { return "https://www." + randLower(6 + Math.floor(Math.random() * 6)) + "." + pick(URL_TLD); }
  function genBank() {
    let s = "62";
    while (s.length < 15) s += digit();
    let sum = 0, alt = true;
    for (let i = s.length - 1; i >= 0; i--) {
      let d = parseInt(s[i], 10);
      if (alt) { d *= 2; if (d > 9) d -= 9; }
      sum += d; alt = !alt;
    }
    return s + ((10 - (sum % 10)) % 10);
  }
  function genColor() { return "#" + Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, "0"); }
  function genDate() {
    const y = 2000 + Math.floor(Math.random() * 27);
    const m = 1 + Math.floor(Math.random() * 12);
    const d = 1 + Math.floor(Math.random() * 28);
    const p = (x) => String(x).padStart(2, "0");
    return `${y}-${p(m)}-${p(d)}`;
  }
  const PRESETS = { name: genName, email: genEmail, phone: genPhone, id: genId, addr: genAddr, company: genCompany, uuid: genUuid, url: genUrl, bank: genBank, color: genColor, date: genDate };

  let fakeType = "name";
  const presetBtns = document.querySelectorAll(".rand-presets .chip");
  if (presetBtns[0]) presetBtns[0].classList.add("active");

  function doFakeGen() {
    const count = clampInt($("rand-fake-count").value, 1, 200, 5);
    const fn = PRESETS[fakeType] || genName;
    const out = [];
    for (let i = 0; i < count; i++) out.push(fn());
    $("rand-output").value = out.join("\n");
    addHistory({ cat: "rand", go: "rand", op: "gen", method: "fake:" + fakeType, preview: count + countUnit() });
  }
  presetBtns.forEach((b) => b.addEventListener("click", () => {
    fakeType = b.dataset.preset;
    presetBtns.forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    doFakeGen();
  }));
  $("rand-fake-gen").addEventListener("click", doFakeGen);
  $("rand-copy").addEventListener("click", (e) => {
    const v = $("rand-output").value;
    if (v) copyText(v, e.currentTarget);
  });
})();

/* ---------- 7.9 文本工具（字数统计 / 去重 / 文本对比） ---------- */
(function () {
  const $ = (id) => document.getElementById(id);
  const tabs = $("txt-tabs");
  const panes = { count: $("txt-pane-count"), dedupe: $("txt-pane-dedupe"), diff: $("txt-pane-diff") };
  if (tabs) {
    tabs.querySelectorAll("button").forEach((b) => {
      b.addEventListener("click", () => {
        tabs.querySelectorAll("button").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        Object.keys(panes).forEach((k) => { if (panes[k]) panes[k].hidden = (k !== b.dataset.v); });
      });
    });
  }
  /* 字数统计：实时 */
  const cntInput = $("txt-count-input");
  if (cntInput) {
    const upd = () => {
      const v = cntInput.value;
      if ($("st-chars")) $("st-chars").textContent = v.length;
      if ($("st-lines")) $("st-lines").textContent = v ? v.split(/\n/).length : 0;
      if ($("st-words")) $("st-words").textContent = v ? (v.match(/[\u4e00-\u9fff]|[A-Za-z0-9]+/g) || []).length : 0;
      if ($("st-bytes")) $("st-bytes").textContent = new TextEncoder().encode(v).length;
    };
    cntInput.addEventListener("input", upd);
    upd();
  }
  /* 去重：每行一条，Set 去重（可选保留空行） */
  if ($("txt-dupe-btn")) $("txt-dupe-btn").addEventListener("click", () => {
    const lines = $("txt-dupe-input").value.split("\n");
    const seen = new Set();
    const out = lines.filter((l) => {
      const k = l.trim();
      if (!k) return true; // 保留空行
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    $("txt-dupe-output").value = out.join("\n");
    addHistory({ cat: "txt", go: "txt", op: "dedupe", preview: lines.length + " 行 → " + out.length + " 行" });
    if (window.toast) toast(t("txt.done") + " " + out.length + "/" + lines.length);
  });
  if ($("txt-dupe-copy")) $("txt-dupe-copy").addEventListener("click", (e) => copyText($("txt-dupe-output").value, e.currentTarget));
  /* 文本对比：行级 LCS diff */
  function lcsDiff(a, b) {
    const A = a.split("\n"), B = b.split("\n");
    const m = A.length, n = B.length;
    const dp = Array.from({ length: m + 1 }, () => new Uint32Array(n + 1));
    for (let i = m - 1; i >= 0; i--)
      for (let j = n - 1; j >= 0; j--)
        dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const out = [];
    let i = 0, j = 0;
    while (i < m && j < n) {
      if (A[i] === B[j]) { out.push("  " + A[i]); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push("- " + A[i]); i++; }
      else { out.push("+ " + B[j]); j++; }
    }
    while (i < m) out.push("- " + A[i++]);
    while (j < n) out.push("+ " + B[j++]);
    return out.join("\n");
  }
  if ($("txt-diff-btn")) $("txt-diff-btn").addEventListener("click", () => {
    const a = $("txt-diff-a").value, b = $("txt-diff-b").value;
    $("txt-diff-output").value = lcsDiff(a, b);
    addHistory({ cat: "txt", go: "txt", op: "diff", preview: "对比 " + a.split("\n").length + " 行 vs " + b.split("\n").length + " 行" });
    if (window.toast) toast(t("txt.done"));
  });
  if ($("txt-diff-copy")) $("txt-diff-copy").addEventListener("click", (e) => copyText($("txt-diff-output").value, e.currentTarget));
})();

/* ---------- 8. 初始化 ---------- */
updateKeySizeUI();
refreshSymHints();
refreshRsaLabels();
renderHistory();   // 主页展示已有历史
ensureRsaKeys();   // 若本机无 RSA 密钥，默认生成一对
setupExpanders();  // 给 textarea 加“展开查看全文”
applyLaunchParams();

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
