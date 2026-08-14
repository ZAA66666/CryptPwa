/* =====================================================================
 * 页面：cron（从 app.js 抽离，独立成文件，便于维护）
 * 本文件只负责本页面/面板的事件绑定与算法调用。
 * 依赖全局 helper（app.js / tools.js 提供）：copyText / addHistory /
 *   maybePromptVault / toast / t / CryptoJS / sha3_512 / JsBarcode / qrcode / jsQR 等。
 * index.html 中本文件在 app.js 之前加载，函数/变量按全局作用域共享。
 * ===================================================================== */

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
