/* =====================================================================
 * 页面：sym（从 app.js 抽离，独立成文件，便于维护）
 * 本文件只负责本页面/面板的事件绑定与算法调用。
 * 依赖全局 helper（app.js / tools.js 提供）：copyText / addHistory /
 *   maybePromptVault / toast / t / CryptoJS / sha3_512 / JsBarcode / qrcode / jsQR 等。
 * index.html 中本文件在 app.js 之前加载，函数/变量按全局作用域共享。
 * ===================================================================== */

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
