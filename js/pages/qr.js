/* =====================================================================
 * 页面：qr（从 app.js 抽离，独立成文件，便于维护）
 * 本文件只负责本页面/面板的事件绑定与算法调用。
 * 依赖全局 helper（app.js / tools.js 提供）：copyText / addHistory /
 *   maybePromptVault / toast / t / CryptoJS / sha3_512 / JsBarcode / qrcode / jsQR 等。
 * index.html 中本文件在 app.js 之前加载，函数/变量按全局作用域共享。
 * ===================================================================== */

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
    box.innerHTML = '<p class="hint error">' + (typeof t === "function" ? t("qr.errTooLong") : "内容过长，无法生成二维码") + '</p>';
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
    r.onload = () => { window.__qrLogo = r.result; if (window.toast && typeof t === "function") toast(t("qr.logoOk")); };
    r.readAsDataURL(f);
  };
  if (logoClear) logoClear.onclick = () => { window.__qrLogo = ""; if (window.toast && typeof t === "function") toast(t("qr.logoCleared")); };
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
    if (hint) { hint.textContent = (typeof t === "function" ? t("bc.err") : "Cannot generate: ") + (e && e.message ? e.message : ""); hint.className = "hint error"; }
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
    scanStatus.textContent = (typeof t === "function") ? t("qr.scanOk") : "Decoded";
    addHistory({ cat: "qr", go: "qr", op: "scan", preview: res.data.slice(0, 24) });
    return;
  }
  scanRaf = requestAnimationFrame(scanTick);
}
function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    scanStatus.textContent = (typeof t === "function") ? t("qr.noCam") : "Camera not available — use pick from album";
    return;
  }
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then((stream) => {
      scanStream = stream;
      scanVideo.srcObject = stream;
      scanVideo.play();
      scanStatus.textContent = (typeof t === "function") ? t("qr.scanTip") : "Aim the QR code at the frame";
      scanRaf = requestAnimationFrame(scanTick);
    })
    .catch((err) => {
      scanStatus.textContent = ((typeof t === "function") ? t("qr.camFail") : "Cannot open camera: ") + (err && err.message ? err.message : "");
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
        scanStatus.textContent = (typeof t === "function") ? t("qr.scanOk") : "Decoded";
        addHistory({ cat: "qr", go: "qr", op: "scan", preview: res.data.slice(0, 24) });
      } else {
        scanStatus.textContent = (typeof t === "function") ? t("qr.scanNone") : "No QR found — try another image";
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
