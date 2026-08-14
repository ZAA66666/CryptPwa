# 加解密工具箱 · 交接 / 教学文档（给下一任 AI 看）

> 用途：让接手的 AI（或人类）**不翻聊天记录**就能读懂这个 App 是怎么搭的、怎么改、以及修 bug 的正确姿势。
> 配套：`DEV_DOC.md`（开发规范速查，偏“约定对齐”）；本文件偏“全局理解 + 排障”。
> 当前版本：`v260815_0021`（versionCode 22 / SW v70）。

---

## 0. 一句话定位
一个**离线优先的加密工具箱 Android App**：纯前端（HTML/CSS/JS，无框架无打包器）写界面与逻辑，Capacitor 套原生壳，算法离线跑（crypto-js / WebCrypto / sm-crypto）。目标是“像微信一样顺手的国产加密百宝箱”。

## 1. 技术栈
- 前端：原生 HTML/CSS/JS 手写 SPA（刻意不引入框架，便于单文件维护与 AI 改写）。
- 算法库（js/vendor/）：crypto-js（哈希/对称）、浏览器 WebCrypto（RSA，仅 https/localhost）、sm-crypto.esm（SM2 国密，依赖已 rewire 到本地 jsbn）、qrcode-generator（二维码）、jsQR（扫码）、JsBarcode（条形码）。
- 原生壳：Capacitor 5（MainActivity + 少量原生插件：FolderPicker 选系统文件夹、StatusBar、SplashScreen、App 返回键、Share/Intent 外部内容）。
- 离线：Service Worker（`sw.js`，`CACHE_NAME` 改必 +1）。
- 持久化：localStorage（历史记录、设置、密码本密文、日志环形缓冲）。

## 2. 目录结构与文件职责
| 路径 | 作用 |
|---|---|
| `index.html` | 所有页面 DOM 骨架：主页工具列表 + 各功能 `<section class="panel">` + 设置 `#settings-overlay` + 各弹窗。**脚本在 `</body>` 前按序加载**：vendor 库 → i18n → tools → app → settings。 |
| `css/style.css` | 全部样式。**文件顶部有“布局系统总览”注释，改样式前必读。** |
| `js/i18n.js` | 多语言词条（`window.I18N={zh,en}` + `t(key)` + `data-i18n` 属性）；顶部 `APP_VERSION` 是版本号唯一真相源。 |
| `js/tools.js` | 通用工具（驼峰命名、toast、统一 `dialog.alert/confirm/prompt/sheet` 弹窗）。 |
| `js/app.js` | 主逻辑：面板切换、12 个工具的算法调用与结果展示、状态栏、弹窗系统、返回键、SW 注册、闪屏隐藏。 |
| `js/settings.js` | 设置模块：主题/语言/字体/沉浸式/常用密码/密码本/关于·隐私·协议；用 stack 栈管理“设置主页→子页”导航。 |
| `sw.js` | Service Worker 离线缓存。 |
| `android/` | Capacitor 原生工程；打包实际读取 `android/app/src/main/assets/public/` 下的 web 资源。 |
| `webapp/` | `npm run sync` 从根目录生成的 web 产物（CI 用，本地可忽略，被 git 忽略）。 |
| `scripts/sync-web.mjs` | 把根目录源码同步进 `webapp/`。 |
| `.github/workflows/build-apk.yml` | CI：构建并发布 APK（见 §6）。 |

## 3. 布局系统（最关键）
读 `css/style.css` 顶部“布局系统总览”。要点：
- **主页 + 功能页共用一个 WebView**。`body` 是竖向 flex 列：顶部 `.app-header`（绿色工具栏，仅主页显示）+ `.app-card`（内容容器，`flex:1` 占满剩余高度）。
- **滑动链（缺一环节就不滚动）**：`body(flex列)` → `app-card(flex:1, min-height:0)` → `main(flex:1, min-height:0)` → `.panel.active(flex:1, min-height:0, overflow-y:auto)`。每个工具是一个 `.panel`，同一时刻只有一个 `.active`。
- **设置是另一个全屏 overlay**：`#settings-overlay`（`position:fixed; inset:0` 的 flex 列），内部 `.overlay-bar` + `.overlay-body(滚动)`。短页面（如“关于”）靠 `.overlay-body::after` 弹性占位撑满到屏幕底部，避免“没铺满”。
- **状态栏**：主页黑字（`StatusBar.setStyle DARK`），功能页/设置白字（`LIGHT`），由 `app.js` 在切换面板时控制。
- **弹窗**：统一 `.vp-*` / `.exp-*` / `.scan-*` / `.dlg-*` 系列，中心扩散或底部上滑。
- **全屏编辑框（`.exp-panel`）**：占满整屏（`100vw × 100dvh`，微信式沉浸式），编辑区 `flex:1` 撑满，顶部按钮 + 底部“复制/保存”操作行。
- **闪屏**：Capacitor SplashScreen 插件（绿色，`capacitor.config.json` 的 `launchShowDuration`）。`html` 底色预置强调绿，且 `app.js` 在 UI 就绪后主动 `SplashScreen.hide()`，避免首帧白闪。

## 4. 操作逻辑
- **面板切换** `showPanel(name)`：切 `.panel.active`、切 `body.on-home`、切状态栏文字色、滚到顶。
- **设置导航**：`#settings-overlay` 用 `stack` 数组管理“设置主页 → 子页”，返回键逐级 `pop`；到栈底则关闭 overlay（再按返回键退出 App）。
- **原生插件**：FolderPicker（选系统文件夹作为保存路径，持久化权限）、StatusBar（沉浸式文字色）、SplashScreen（启动闪屏）、App（安卓返回键拦截）、Share/Intent（外部内容进入 `panel-incoming`）。
- **桌面快捷方式 + 深链**：`shortcuts.xml` 4 个直达工具；MainActivity 处理深链后 JS `__handleDeepLink` 跳转。
- **统一弹窗**：一律用 `window.dialog.*`（自定义 UI + 中心扩散动画），**禁用原生 `alert/confirm/prompt`**；`confirm/prompt` 返回 Promise，调用点需 `.then` 处理。

## 5. 功能清单（主页 12 入口）
哈希 / 编解码(Base64·Hex·URL 等 12 种) / 加解密(AES·DES·RSA·SM2) / 二维码·条形码 / JSON(格式化·提取·键值) / 随机文本 / 文本工具(字数·去重·diff) / Crontab / 使用教程 / 外部调用(系统分享入口)。每个工具一个 `.panel`，结构在 `index.html` 里分段注释清晰。

## 6. 构建与同步链路（血的教训）
- **源码在根目录**；构建产物 `webapp/`（npm run sync 生成）和 `android/.../public/`（Capacitor 打包真正读取）。
- **CI（build-apk.yml）流程**：`npm ci` → `npm run sync` → **`npx cap sync android`**（关键一步，曾缺失）→ `gradle assembleRelease` → 发 Release。
- **历史大坑**：曾长期只跑 `npm run sync`、缺 `npx cap sync android`，导致 `android/.../public/` 永远是**最初那版旧代码**。用户每次装的 APK 都看不到源码改动——这就是“说了 100 遍改了、用户说一直没改”的**真正根因**（不是用户记错，是打包件从没更新）。已在 `build-apk.yml` 补上该步。
- **本地改完要见效**：要么 `git push` 让 CI 重建（推荐）；要么手动 `cp -r webapp/. android/app/src/main/assets/public/`（本机已这样做）。**验证 bug 时优先看 `android/.../public/` 里的实际打包件，而不是根目录源码——两者可能不一致。**

## 7. 已修清单（本版 v260815_0021）
- footer“学习与实践”提示行**彻底移除并进入 APK**（此前只在根目录删、打包件从没更新）。
- 滑动链完整（功能页/设置页都能滑）。
- “关于”等短页面**铺满到屏幕底部**（`.overlay-body::after` 占位）。
- 全屏编辑框**占满整屏**（微信式沉浸式，`.exp-panel` 改 `100vw×100dvh`）。
- 进 App **顶部白闪**修复：`html` 预置绿色底色 + `app.js` 主动 `SplashScreen.hide()` + 闪屏时长 1200ms（原生 `splash.png` 是否绿色取决于 `npx cap sync` 重生，CI 已包含该步）。

## 8. 给下一任 AI 的排障 checklist
1. 改样式 → 先读 `css/style.css` 顶部“布局系统总览”。
2. 改完**必升版本号**（三处同步：`js/i18n.js` 的 `APP_VERSION` + `android/app/build.gradle` 的 `versionCode/versionName` + `sw.js` 的 `CACHE_NAME` +1），否则用户看不到更新、且旧缓存会卡住。
3. 改完**必同步进 android 打包件**（push 触发 CI，或本地 `cp`）。
4. 真机 bug 优先查 `android/app/src/main/assets/public/` 实际打包件，而非根目录源码。
5. 历史/设置/密码本走 localStorage；密码本主密码 AES-256-CBC（PBKDF2 10000 次），密文存 `set_vault`。
6. **绝不碰** keystore / `ghp_` token 明文（GitHub push protection 会拦截）；文档/代码里不得写 token。
7. 文案不出现“浏览器/localStorage”字眼（安卓 App 语境：用“本机/系统/本地存储”）。

## 9. 与 DEV_DOC.md 的关系
- `DEV_DOC.md`：**开发规范速查**（版本规则、SW、构建、i18n、已废弃功能、易踩坑）——用于快速对齐约定。
- 本文件（HANDOFF.md）：**全局架构 + 操作逻辑 + 排障**——让新人/新 AI 真正“看懂项目并动手修”。
- 两者互补；改完功能顺手更新这两份。

## 10. 一段必须记住的事故（footer 误删布局）
用户曾质问“为什么删一行提示，把整个布局删了”。真相：**不是架构耦合，是上一任 AI 编辑失误**。
- 最初删 footer（`8704cb2`）只是删了那段 `<p>` 和对应 CSS；但同一次操作中，删除命令匹配范围过大，**误删了 1156 行 CSS**，导致主页/功能页样式全崩。
- 随后 `66226a2` 从旧版 CSS 恢复，再按行号**精确删 footer 相关 25 行**，布局才完好。
- 教训：删文案用精确 Edit，绝不用会吞掉大片区域的删除；且删完必须确认打包件真的更新（见 §6 同步链路）。
