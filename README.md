# 哈机码 · CryptPwa 🔐

> 一款**安卓端离线加解密工具箱 App**：所有计算在本地完成，不联网、不上传数据，断网可用。

![Android](https://img.shields.io/badge/Android-9%2B-00a862) ![Offline](https://img.shields.io/badge/offline-ready-00a862) ![Lang](https://img.shields.io/badge/language-zh%2Fen-4e6ef2)

> 🤖 **AI 生成声明**：本项目代码由 AI 辅助生成，供学习交流使用，使用前请自行审查。详见 [AI_DISCLOSURE.md](AI_DISCLOSURE.md) ｜ [English](README_US.md)

---

## 📦 安装

1. 打开仓库 **[Releases](https://github.com/ZAA66666/CryptPwa/releases)** 页面，下载最新 `CryptPwa_<版本>_release.apk`
2. 把 APK 传到手机（USB / 微信 / 网盘均可）→ 点击安装
3. 首次安装提示「允许安装未知来源应用」→ 允许即可（自签名，非病毒）
4. 桌面出现「哈机码」图标，打开即用，**完全离线**

> 每次推送代码会自动构建新版 APK，重新下载安装即完成更新。

## ✨ 功能特性

| 模块 | 说明 |
|---|---|
| **哈希** | MD5 / SHA1 / SHA256 / SHA512 / HMAC 等 |
| **编解码** | Base64 / Hex / URL / Base32 / Base58 / Unicode / JWT，图片转 Base64 |
| **加/解密** | 对称：AES(128/192/256) / DES / 3DES / Blowfish / RC4 / Rabbit（ECB/CBC/CTR/CFB/OFB）；非对称：RSA、SM2（国密） |
| **二维码/条形码** | 生成 + 摄像头扫码 + 条形码 |
| **JSON 工具** | 格式化 / 压缩 / 校验 / 路径提取代码 / 键值编辑 |
| **Crontab** | 定时表达式解析 + 最近 5 次执行时间预览 |
| **随机文本** | 随机密码 / 随机数 / 字符串 / 虚假数据（姓名/邮箱/身份证等） |
| **密码本** | 3 套独立密码库、AES-256-CBC 加密存储、主密码解锁、CryptoData.json 导出导入 |

## 🔒 隐私与安全

- 纯本地计算（crypto-js / Web Crypto / sm-crypto），**不发送任何数据到服务器**
- 密码本密文存储：AES-256-CBC + PBKDF2（10000 次），主密码仅存内存
- 数据加密默认开启，防止第三方扫描读到明文
- 安卓返回键、沉浸式状态栏、预测性返回手势等原生体验

## 🖥 平台支持

| 平台 | 状态 |
|---|---|
| **安卓 App（主力形态）** | ✅ Android 9+（API 28+），已适配小米/OPPO/vivo/华为/三星 |
| 网页版 / PWA | ✅ 可用（同源代码，浏览器打开 `index.html` 即可；完整 PWA 需 HTTPS 或 localhost） |

> 本项目以**安卓 App**为主要形态。网页版/PWA 是同一套代码的附加形态，方便在电脑上临时使用；功能与 App 版完全一致。

## 🔄 自动构建

每次推送 `main` 分支，[GitHub Actions](https://github.com/ZAA66666/CryptPwa/actions) 自动构建 APK 并发布到 Releases：
- 默认构建 **release** 版（自签名，可直接安装）
- 产物命名：`CryptPwa_<版本>_release.apk`
- 也可在 Actions 页手动运行并选 release/debug

## 📂 项目结构

```
├── index.html / css / js    # 应用核心代码（安卓与网页版共用）
├── manifest*.webmanifest    # PWA 清单（网页版用）
├── sw.js                    # Service Worker（网页版离线缓存）
├── capacitor.config.json    # 安卓打包配置
├── android/                 # Capacitor 安卓工程（生成 APK）
├── scripts/sync-web.mjs     # 网页资源同步脚本
└── .github/workflows/       # 自动构建 APK
```

## 📝 许可证与声明

- 🤖 **AI 生成代码声明** —— 详见 [AI_DISCLOSURE.md](AI_DISCLOSURE.md) ｜ [English](README_US.md)
- 个人兴趣作品，代码仅供学习交流。欢迎 **Star ⭐ / Fork / 提交 Issue**。

---

*哈机码 = 哈希 + 机器 + 码：把加密工具装进口袋。*
