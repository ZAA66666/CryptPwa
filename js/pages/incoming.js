/* =====================================================================
 * 页面：incoming（从 app.js 抽离，独立成文件，便于维护）
 * 本文件只负责本页面/面板的事件绑定与算法调用。
 * 依赖全局 helper（app.js / tools.js 提供）：copyText / addHistory /
 *   maybePromptVault / toast / t / CryptoJS / sha3_512 / JsBarcode / qrcode / jsQR 等。
 * index.html 中本文件在 app.js 之前加载，函数/变量按全局作用域共享。
 * ===================================================================== */

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
