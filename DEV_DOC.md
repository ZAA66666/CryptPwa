# CryptPwa（哈机码）开发文档

> **定位**：安卓端离线加解密工具箱 App（网页版 PWA 为附加形态）。
> **仓库**：github.com/ZAA66666/CryptPwa（默认分支 main，CI 自动构建 Release APK）
> **当前版本**：v260815_0013（versionCode 21）
> **签名**：android/app/cryptpwa-release.p12（固定签名，PKCS12，alias=cryptpwa / 密码 cryptpwa2026；CI 与本机同签名，可覆盖安装）
> **用途**：本文件是快速上手上下文 —— 换新 AI / 换会话时先读这份，无需翻历史对话。

---

## 一、技术架构

| 项 | 说明 |
|---|---|
| 形态 | 纯前端 PWA + Capacitor 8 打包安卓 App（无后端） |
| 核心 JS | `js/app.js`（2107 行，工具逻辑+交互）、`js/settings.js`（1539 行，设置/密码本）、`js/i18n.js`（620 行，中英双语 499 键） |
| 页面 | `index.html`（882 行，单页，panel 切换） |
| 样式 | `css/style.css`（单文件，酷安绿 `#00a862` 主题） |
| 离线 | `sw.js` Service Worker，CACHE_NAME `crypto-pwa-v69`（改动必 +1） |
| vendor 库 | `js/vendor/`：crypto-js、qrcode-generator、jsqr、jsbarcode.all.min、sm-crypto.esm（依赖已 rewire 到本地 jsbn.esm.js） |
| Android | `android/`（Capacitor，webDir=webapp；`scripts/sync-web.mjs` 同步 web→webapp） |
| 数据 | localStorage（`set_vault` 密码本密文、`crypto_history_v1` 最近使用、设置项） |
| 加密体系 | 对称 AES/DES/3DES/RC4/Rabbit/Blowfish（crypto-js）；非对称 RSA（Web Crypto）、国密 SM2（sm-crypto）；密码本主密码 AES-256-CBC + PBKDF2 10000 次 |

**构建/发布流程**：改代码 → `sw.js` CACHE_NAME +1 + 版本号升级（i18n `APP_VERSION` / build.gradle `versionCode,versionName`）→ `node --check` 校验 → **必须 `npm run sync` + `npx cap sync android` 把 web 资源灌进 android 打包件** → git commit（含 `webapp/` 与 `android/.../public/`）→ push origin main → GitHub Actions 自动构建 → Release 出 APK。⚠️ 见第八节「构建同步陷阱」。

---

## 二、功能清单（10 个面板）

| 页面 | 功能 | 详细能力 |
|---|---|---|
| **主页** | 单页工具网格 + 最近使用历史 + Toolbar | 顶部 Toolbar（标题 + 右上角三点菜单 → 设置/关于）；8 张功能卡跳转；历史记录可点击回跳、可清空 |
| **哈希** | 12 种算法 | MD5 / SHA-1 / SHA-224 / SHA-256 / SHA-384 / SHA-512 / SHA-3 / RIPEMD-160 / HMAC-MD5 / HMAC-SHA1 / HMAC-SHA256 / HMAC-SHA512，支持密钥（HMAC 时） |
| **编/解码** | 8 种方法 | Base64（含文件/图片转 Base64）/ Base32 / Base58 / Hex / URL / Unicode 转义 / JWT（编解码、解 Header+Payload） |
| **加/解密（对称）** | 6 算法 × 5 模式 | AES(16/24/32 字节)/DES/3DES/Blowfish/RC4/Rabbit；CBC/CTR/CFB/OFB/ECB；自动/手动密钥档位、IV 生成；随机密钥/IV 按钮 |
| **加/解密（非对称）** | RSA + SM2 | RSA 密钥对生成/导入导出 PEM/保存文件/加密解密/签名验签；SM2 同套能力 + 导出文件；密钥查看弹窗 |
| **二维码** | 生成 + 扫描 + 条形码 | QR 生成（容错级别/下载 PNG）；相机实时扫码（jsqr）+ 图片文件解码；条形码生成（CODE128/39、EAN13/8、UPC、ITF14、CODABAR、MSI） |
| **JSON** | 3 个子页 | 格式化/压缩/校验（可选缩进、语言格式）、路径提取、KV 模板生成/导入 |
| **Crontab** | 表达式解析 | 解析 5 段 cron、显示下次执行时间、"怎么写"折叠教程卡片 |
| **随机** | 随机文本/密钥 | 数字/小写/大写/特殊字符胶囊按钮组合、自定义字符集、正则约束、长度与生成数量（带 −/+ 步进） |
| **教程** | 使用指南 | 各功能入门教程（详情/折叠卡片） |

**设置页**（8 组，分组白底卡片样式）：每组 `settings-group` 圆角卡片（`box-shadow` 浅），组标题小色块+文字（13px muted），组内 `settings-item` 行（图标+文字+箭头›）；13 项均有 SVG 图标（`SETTINGS_ICONS` 字典）。
- **通用**：密码本（主密码设置/修改/锁定[有反馈]/条目增删改查、**长按条目查看完整内容**、**默认显示第一个库**、连按标题 10 次弹库管理、**数据加密开关已移入本页顶部**）、显示设置（语言/字体大小）、主题（浅/深/跟随 + 7 色板 + 自定义取色，选中圈用色板自身颜色）、**内容保存路径**（加/解密结果大内容超 5000 字节自动提示另存为文件；安卓可选目录）
- **数据隐私**：数据备份与同步（WebDAV 备份/恢复，自动连通性检测；导出本地注明保存到系统文档/下载目录）、**清理缓存**（清日志等临时数据，显示上次清理时间）
- **外部调用与分享**：URL Scheme 说明、外部数据接收页（inc-*）、**小窗/分屏拖放接收**（原生 OnDragListener → JS __dragDrop）
- **实验性**：**数据回调开关** + **调试功能开关**（开启后显示日志查看/清空；日志无论开关都记录，localStorage 500 条环形缓冲）
- **隐私与条款**：关于（**版本+GitHub+检测更新 Hero 置顶**）/隐私政策/用户协议/安全条款/个人信息

**统一弹窗系统**：`window.dialog.{alert,confirm,prompt,sheet}`（自定义 UI，中心 scale 扩散动画；sheet 底部上滑）；**禁用原生 window.alert/confirm/prompt**（confirm/prompt 为异步 Promise，调用点 .then 处理）；vp/exp/scan 面板动画统一中心扩散；全屏编辑 openEditor 按触发位置 from-top/from-bottom 延伸。

**安卓原生能力**：沉浸式状态栏（默认开）、全局返回键（弹窗→设置→面板→**双击退出**）、Toolbar 三点菜单（设置/关于）、状态栏安全区留白、**小窗拖放接收文字/图片**、按钮圆角点击高亮、overscroll 禁止整页滑动、**固定签名 p12（Actions Secret 注入）**、**Android 系统预测性返回手势**（`enableOnBackInvokedCallback="true"`，开始预览/完成返回/取消停留行为正确）。文案约定：不出现"浏览器/localStorage"字眼（用"本机/系统/本地存储"）。

---

## 三、竞品对比（2026-08 调研）

| 功能 | **本 App** | HashCalc | Crypto Encoder Decoder | CryptX | De&EnCrypt | 彩虹糖工具箱 |
|---|---|---|---|---|---|---|
| 对称加密 | ✅ 6 算法 | ❌ | ❌ | ✅ AES/DES/3DES/Blowfish/ChaCha20 | ✅ AES/RC4/Blowfish/DES/DESede | ✅ AES/DES/RC4/3DES |
| 非对称 RSA | ✅ | ❌ | ❌ | 路线图中 | ❌ | ❌ |
| 国密 SM2 | ✅ 独有 | ❌ | ❌ | ❌ | ❌ | ❌ |
| 哈希 | ✅ 8+4 HMAC | ✅ 含标准 SHA3 | ✅ | ✅ | ✅ | ✅ |
| **哈希类型识别** | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **文件哈希** | ❌ | ✅ 4GB+ | ❌ | ❌ | ✅ | ✅ |
| **文件加/解密** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| 编解码 | ✅ 8 种 | ❌ | ✅ 15+ | ❌ | ✅ 更多(Octal/ASCII/HTML/UTF16) | ✅ 部分 |
| JWT | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 古典密码(摩斯/凯撒/维吉尼亚) | ❌ | ❌ | ✅ | ❌ | ✅ 维吉尼亚/摩斯 | ❌ |
| 二维码生成/扫描 | ✅ + 条形码 | ❌ | ❌ | ❌ | ❌ | ✅ |
| JSON 工具 | ✅ | ❌ | ❌ | ❌ | ❌ | 部分 |
| Cron 解析 | ✅ 独有 | ❌ | ❌ | ❌ | ❌ | ❌ |
| 密码本加密存储 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 历史记录 | ✅ 最近使用 | ✅ 50 条可导出 | ❌ | ✅ | ❌ | ❌ |
| WebDAV 云备份 | ✅ 独有 | ❌ | ❌ | ❌ | ❌ | ❌ |
| 外部 App 调用接收 | ✅ 独有 | ❌ | ❌ | ❌ | ❌ | ❌ |
| 离线/隐私 | ✅ 全离线 | ✅ | ✅ | ✅ 无网络权限 | ✅ | 部分在线 |
| 多语言 | ✅ 中/英 | ❌ | ❌ | 计划 | ❌ | 仅中文 |

**结论**：本 App 在「对称+非对称+国密全覆盖、编解码、QR/条码、JSON、Cron、密码本、云备份、外部调用」上远超竞品；**短板集中在哈希识别、文件级处理、古典密码、更多编码格式**。

---

## 四、可增加功能建议（按优先级）

**P0（核心补差，最值得做）**
1. ✅ **SHA3 兼容性 Bug（已修复 bf4e9f5）**：引入 js-sha3 标准实现；hash 页选项拆为「标准 SHA3-512」（js-sha3，FIPS 202，输出 `b751850b...`）与「Keccak-512」（crypto-js 原始算法，输出 `18587dc2...`），两选项均加 i18n。
2. **哈希类型识别（Hash Detector）**：输入 hash 自动猜算法（长度+字符集判断），HashCalc/CryptX 都有，用户高频需求。
3. **文件哈希**：从文件选择器取文件算 MD5/SHA（App 内可用 input[type=file] 读取，安卓 WebView 可用）。
4. **文件加/解密**：大文件分块 AES 加解密并保存（CryptX 有，实用性高）。

**P1（增强体验）**
5. **古典密码**：摩斯（可自定义点划字符）、凯撒、维吉尼亚、Atbash、ROT13（两款竞品都有）。
6. ✅ **更多编码（已实现 v1.4）**：Octal / ASCII 十进制 / HTML entity / UTF-16 转义 / 罗马数字，共 12 种编码。
7. **密码强度检测**：给"随机文本"生成结果加强度评分条。
8. ✅ **历史记录增强（已实现 v1.4）**：类型筛选 chips（全部/哈希/编码/加解密/RSA/SM2/二维码/JSON/随机）+ 导出 JSON。
9. ✅ **二维码美化（已实现 v1.4）**：前景色/背景色选择器 + 中心 Logo 图片叠加。
10. ✅ **文本工具（已实现 v1.4）**：新面板 txt——字数统计（字符/字数/行/字节实时）、去重（每行）、文本对比（行级 LCS diff，+/- 标记）。

**P2（工程/生态）**
11. WebDAV 定时自动备份（现有手动）。
12. ✅ **外部回调真正实现（v1.4）**：URL 带 callback 参数 → incoming 面板显示「结果回调」卡片，处理结果粘贴后一键跳回 callback URL（带 result 参数）。
13. ✅ **测试接入 CI（v1.4）**：脚本入库 scripts/tests/（consistency.cjs + smoke.cjs），workflow 构建前自动运行（静态一致性 + 算法冒烟）。
14. ✅ **系统分享接入（v1.4）**：AndroidManifest 注册 ACTION_SEND（text/plain + image/*）+ SEND_MULTIPLE；MainActivity onNewIntent 处理 EXTRA_TEXT/EXTRA_STREAM → JS __sharedText → incoming 面板。

---

## 五、已废弃 / 被排除功能（避免误改）

| 功能 | 状态 | 说明 |
|---|---|---|
| 底部「主页/设置」双 tab 导航 | ❌ 已移除 | 改为单页布局 + Toolbar 右上角三点菜单（设置/关于） |
| 主页品牌头（大标题+副标题） | ❌ 已移除 | 改为紧凑 Toolbar（标题 + 三点菜单） |
| 实验性-导入方式子页 | ❌ 已删除 | 实验性页改为「数据回调开关 + 长按查看示例」 |
| 沉浸式状态栏开关 | ❌ 已移除 | 沉浸式默认开启（设置页不再有开关） |
| WebDAV「检测连接」按钮 | ❌ 已移除 | 改为填写即自动检测（600ms 防抖） |
| 实验性-生成回调数据交互 | ❌ 已改版 | 改为「数据回调」开关 + 长按查看使用示例 |
| 浏览器 File System Access 目录选择 | ⚠️ 桌面专用 | 安卓无 API，已用 input[webkitdirectory]（挂 DOM 后 click）兜底+手填路径 |

**交互约定**：中文 UI 涨红跌绿（本项目不涉股市）、金额 ¥；生成的 Markdown 链接一律 `[显示文字](https://网址)`。

---

## 六、测试报告（2026-08-14 自动化验证）

**通过项（23/23 核心算法 + 5/5 静态一致性 + 12/12 资源可达）**

| 测试类型 | 内容 | 结果 |
|---|---|---|
| 语法 | app.js / settings.js / i18n.js / sw.js / sync-web.mjs `node --check` | ✅ 全过 |
| i18n 一致性 | zh/en 各 499 键完全对齐；HTML data-i18n 205 键全部存在 | ✅ |
| 引用一致性 | JS 引用的所有元素 id 均存在于 index.html 或动态创建 | ✅ |
| 缓存清单 | sw.js ASSETS 10 项全部存在；HTML 引用的 8 个本地资源可访问 | ✅ |
| 算法冒烟 | MD5/SHA256 已知值、SHA3/HMAC 与 Node 原生对照、AES-CBC/CTR、DES、3DES、RC4、Rabbit、Blowfish 往返、Base64/32/58/Hex/Unicode/JWT 编解码、密钥规则 | ✅ 22/23 |
| HTTP 冒烟 | 本地服务器 12 个关键资源全部 200 | ✅ |

**发现的问题（1 个真实 Bug）**
- 🔴 **SHA3 = Keccak**：`CryptoJS.SHA3("abc")` 输出 `18587dc2...`，标准 SHA3-512 应为 `b751850b...`（Node/Python/OpenSSL 三方确认）。crypto-js 的 SHA3 实为原始 Keccak（FIPS 202 定稿前的版本）。**影响**：用户拿结果与标准工具比对会不一致。**建议**：见"四、P0-1"。

**测试脚本**（可复用，位于临时目录，未入库）：`consistency.cjs`（静态一致性）+ `smoke.cjs`（DOM stub + vm 加载真实 app.js 跑算法）。

---

## 七、开发规范速查

1. **每次功能改动后**：`sw.js` CACHE_NAME +1 → `node --check` 校验 → 本地 `python -m http.server` 冒烟 → 写每日日志。
2. **i18n**：`window.I18N={zh,en}` + `t(key)` + `data-i18n`/`data-i18n-attr`，`applyLang()` 切语言；新增文案必须中英双语同步加键（当前 499 键）。
3. **主题**：CSS 变量驱动（`:root` 浅色 + `[data-theme=dark]` 深色），主色 `--accent` 酷安绿 `#00a862`。
4. **密码本**：`set_vault` 密文存储，主密码 AES-256-CBC（PBKDF2 10000 次）；`readPasswords()`/`writePasswords()` 读写。
5. **GitHub**：本地 user `crypto-pwa / crypto-pwa@users.noreply.github.com`（推送时用 `-c user.name=ZAA66666` 覆盖）；push 需带 Authorization Basic（token 用个人访问令牌（PAT，避免写在文档里触发 GitHub push protection），base64 编码 `ZAA66666:<token>`；token 已存于本机记忆）。
6. **构建触发**：push 到 main 即触发 GitHub Actions → 自动 Release APK。
7. **安卓侧**：`android/app/build.gradle` 版本号（当前 versionCode 21 / versionName v260815_0013）需与 `js/i18n.js` 的 `APP_VERSION` 同步。

---

## 八、构建同步陷阱（血泪教训，必读）

**现象**：源码（根目录 index.html / js / css）改了，但装进手机的 APK 永远旧——footer 删不掉、滑动加不上、状态栏改不动，反复改反复"没生效"。

**根因**：APK 打包用的是 `android/app/src/main/assets/public/`（Capacitor 的 webDir 镜像）。CI 原来只跑 `npm run sync`（刷新 `webapp/`）就直接 `gradlew assembleRelease`，**缺了 `npx cap sync android` 把 `webapp/` 灌进 android 打包件这一步**。结果 gradle 一直用仓库里那份古老的 android 打包件编译，源码改动从没进过 APK。

**正确做法（每次改完源码必做）**：
1. 根目录改代码；
2. `npm run sync` → 刷新 `webapp/`；
3. `npx cap sync android` → 把 `webapp/` 同步进 `android/app/src/main/assets/public/`；
4. 提交时**必须同时提交 `webapp/` 和 `android/.../public/`**（它们被纳入版本管理，CI 只做 `cap sync`，不重新生成 android 资源）；
5. 本地验证：直接看 `android/app/src/main/assets/public/index.html` 里有没有你的改动，比看根目录源码更准。

**CI 已修复**：build-apk.yml 在 `npm run sync` 后补了 `npx cap sync android`（v260815_0013 起生效）。
