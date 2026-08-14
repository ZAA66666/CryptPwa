/* =====================================================================
 * 页面：json（从 app.js 抽离，独立成文件，便于维护）
 * 本文件只负责本页面/面板的事件绑定与算法调用。
 * 依赖全局 helper（app.js / tools.js 提供）：copyText / addHistory /
 *   maybePromptVault / toast / t / CryptoJS / sha3_512 / JsBarcode / qrcode / jsQR 等。
 * index.html 中本文件在 app.js 之前加载，函数/变量按全局作用域共享。
 * ===================================================================== */

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
