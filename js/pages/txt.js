/* =====================================================================
 * 页面：txt（从 app.js 抽离，独立成文件，便于维护）
 * 本文件只负责本页面/面板的事件绑定与算法调用。
 * 依赖全局 helper（app.js / tools.js 提供）：copyText / addHistory /
 *   maybePromptVault / toast / t / CryptoJS / sha3_512 / JsBarcode / qrcode / jsQR 等。
 * index.html 中本文件在 app.js 之前加载，函数/变量按全局作用域共享。
 * ===================================================================== */

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
