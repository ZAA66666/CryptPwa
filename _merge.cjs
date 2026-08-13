const fs = require('fs');
let main = fs.readFileSync('js/i18n.js', 'utf8');
let extra = fs.readFileSync('js/i18n-extra.js', 'utf8');
const m = extra.match(/window\.I18N\.ar\s*=\s*(\{[\s\S]*?\n\});/);
if (!m) { console.error("ar dict not found"); process.exit(1); }
const marker = "    \"common.askSave\": \"Ask to save after encrypting\",\n    \"common.savedOk\": \"Saved to password book.\"\n  }\n};";
if (!main.includes(marker)) { console.error("marker not found"); process.exit(1); }
main = main.replace(marker, marker + "\nwindow.I18N.ar = " + m[1] + ";\n");
fs.writeFileSync('js/i18n.js', main);
console.log("ar merged");
