global.window = {};
require("./js/i18n.js");
const zh = window.I18N.zh, en = window.I18N.en;
console.log("zh:", Object.keys(zh).length, "en:", Object.keys(en).length);
console.log("缺键:", Object.keys(zh).filter(k=>!(k in en)).concat(Object.keys(en).filter(k=>!(k in zh))).join(",") || "无");
