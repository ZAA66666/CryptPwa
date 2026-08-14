/* =====================================================================
 * 页面：rand（从 app.js 抽离，独立成文件，便于维护）
 * 本文件只负责本页面/面板的事件绑定与算法调用。
 * 依赖全局 helper（app.js / tools.js 提供）：copyText / addHistory /
 *   maybePromptVault / toast / t / CryptoJS / sha3_512 / JsBarcode / qrcode / jsQR 等。
 * index.html 中本文件在 app.js 之前加载，函数/变量按全局作用域共享。
 * ===================================================================== */

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
