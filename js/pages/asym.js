/* =====================================================================
 * 页面：asym（从 app.js 抽离，独立成文件，便于维护）
 * 本文件只负责本页面/面板的事件绑定与算法调用。
 * 依赖全局 helper（app.js / tools.js 提供）：copyText / addHistory /
 *   maybePromptVault / toast / t / CryptoJS / sha3_512 / JsBarcode / qrcode / jsQR 等。
 * index.html 中本文件在 app.js 之前加载，函数/变量按全局作用域共享。
 * ===================================================================== */

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
