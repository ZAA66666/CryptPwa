const fs = require("fs");
global.window = {};
require("./js/i18n.js");
const zh = window.I18N.zh;
fs.writeFileSync("中文语言包_zh.json", JSON.stringify({ lang: "zh", name: "简体中文", data: zh }, null, 1) + "\n", "utf8");
console.log("zh pack keys:", Object.keys(zh).length);
