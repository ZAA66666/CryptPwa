# CryptPwa 加解密工具箱 🔐

> 本地优先（Local-first）的网页版加解密工具箱：**所有计算都在你自己的设备上完成**，数据不上传、不联网也能用。

![PWA](https://img.shields.io/badge/PWA-%E5%8F%AF%E5%AE%89%E8%A3%85-brightgreen) ![离线可用](https://img.shields.io/badge/%E7%A6%BB%E7%BA%BF-%E5%8F%AF%E7%94%A8-blue) ![语言](https://img.shields.io/badge/%E8%AF%AD%E8%A8%80-%E4%B8%AD%E6%96%87%2FEnglish-orange)

> 🤖 **AI 生成声明**：本项目代码由 AI 辅助生成，供学习交流使用，使用前请自行审查。详见 [AI_DISCLOSURE.md](AI_DISCLOSURE.md)。— English version: [README.md](README.md)

---

## ✨ 功能特性

| 模块 | 说明 |
|---|---|
| **哈希** | MD5 / SHA1 / SHA256 / SHA512 / HMAC 等，支持直接计算与校验 |
| **编解码** | Base64 / Hex / URL / Base32 / Base58 / Unicode / JWT，图片转 Base64 |
| **加/解密** | 对称：AES(128/192/256) / DES / 3DES / Blowfish / RC4 / Rabbit，支持 ECB/CBC/CTR/CFB/OFB；非对称：RSA、SM2（国密） |
| **二维码/条形码** | 生成（含容错级别、尺寸）、摄像头扫码、条形码生成 |
| **JSON 工具** | 格式化 / 压缩 / 校验 / 按路径提取代码 / 键值对可视化编辑 |
| **Crontab** | 定时表达式解析 + 最近 5 次执行时间预览 |
| **随机文本** | 随机密码 / 随机数 / 随机字符串生成 |
| **密码本** | 3 套独立密码库、AES-256-CBC 加密存储（可切换明文模式）、主密码解锁、CryptoData.json 加密/明文导出导入 |

## 🔒 隐私与安全

- 纯前端计算（crypto-js / Web Crypto / sm-crypto），**不发送任何数据到服务器**
- 密码本密文存储：AES-256-CBC + PBKDF2（10000 次）派生密钥，主密码仅保存在内存
- 数据加密开关默认开启，防止第三方扫描工具读到明文内容
- 支持 PWA 离线安装，断网可用

## 🚀 快速开始

### 网页版（推荐体验）
1. 直接部署到任意静态托管（GitHub Pages / CloudStudio / Nginx / 本地 `python -m http.server`）
2. 用浏览器打开 `index.html` 即可使用；PWA 完整功能（离线/安装）需 HTTPS 或 localhost
3. 支持**安装到桌面/主屏**：Chrome / Edge 地址栏右侧点「安装」

### 安卓 App（APK）
- 每次推送 `main` 分支，[GitHub Actions](#-github-actions-自动构建) 会自动打包安卓 APK 并发布到本仓库的 **Releases** 页面
- 下载最新 `app-debug.apk` 安装（需允许「安装未知来源应用」）
- App 基于 WebView 壳（Capacitor）打包，核心代码与网页版完全一致，离线可用

## 📖 使用说明

- **详细使用教程（中文）** → [使用教程.md](使用教程.md)
- **English README** → [README.md](README.md)

## 🖥 平台支持

| 平台 | 状态 |
|---|---|
| 桌面浏览器（Windows / macOS / Linux） | ✅ 可用（PWA 可安装） |
| 移动浏览器（Android / iOS） | ✅ 可用（PWA 可安装到主屏） |
| **安卓 App** | 🚧 **规划中/开发中**：以 WebView 壳（Capacitor）方式打包，安装后离线可用，并支持外部应用调用与回调（URL Scheme / Intent / JS Bridge） |

> 说明：本项目未来将以「安卓 App」为主要形态之一出现。纯网页版受浏览器限制无法直接把数据写回其它 App，打包为原生壳后将支持完整的「外部调用 → 处理 → 回调」插件式工作流。

## 🔄 GitHub Actions 自动构建

工作流文件：`.github/workflows/build-apk.yml`

- **触发**：推送 `main` 分支（也可在 Actions 页面手动运行 `Build Android APK`）
- **流程**：检出代码 → 安装 Node/Java → Capacitor 生成安卓工程 → Gradle 打包 debug APK → 创建 tag → 发布到 Releases
- 构建完成即可在仓库 **Releases** 页面下载最新 APK

## 📂 项目结构

```
├── index.html            # 单页应用入口
├── css/style.css         # 全部样式（明暗主题）
├── js/
│   ├── app.js            # 各工具逻辑
│   ├── i18n.js           # 中英文案 + GITHUB_REPO 常量
│   ├── settings.js       # 设置 / 密码本 / 备份同步
│   └── vendor/           # 离线依赖库（crypto-js、jsQR、JsBarcode 等）
├── manifest*.webmanifest # PWA 清单（中/英）
├── sw.js                 # Service Worker（离线缓存）
├── android/              # Capacitor 安卓工程（用于打包 APK）
└── .github/workflows/    # 自动构建 APK
```

## 📝 许可证与声明

- 🤖 **AI 生成代码声明** —— 详见 [AI_DISCLOSURE.md](AI_DISCLOSURE.md)
- 本项目为个人兴趣作品，代码仅供学习交流。欢迎 **Star ⭐ / Fork / 提交 Issue**。

---

*CryptPwa = Crypt（加密）+ PWA（渐进式网页应用）：把加密工具装进口袋。*
