/* =====================================================================
 * 页面：guide（从 app.js 抽离，独立成文件，便于维护）
 * 本文件只负责本页面/面板的事件绑定与算法调用。
 * 依赖全局 helper（app.js / tools.js 提供）：copyText / addHistory /
 *   maybePromptVault / toast / t / CryptoJS / sha3_512 / JsBarcode / qrcode / jsQR 等。
 * index.html 中本文件在 app.js 之前加载，函数/变量按全局作用域共享。
 * ===================================================================== */

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
