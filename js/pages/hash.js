/* =====================================================================
 * 页面：hash（从 app.js 抽离，独立成文件，便于维护）
 * 本文件只负责本页面/面板的事件绑定与算法调用。
 * 依赖全局 helper（app.js / tools.js 提供）：copyText / addHistory /
 *   maybePromptVault / toast / t / CryptoJS / sha3_512 / JsBarcode / qrcode / jsQR 等。
 * index.html 中本文件在 app.js 之前加载，函数/变量按全局作用域共享。
 * ===================================================================== */

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
