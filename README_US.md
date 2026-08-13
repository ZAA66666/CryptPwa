# CryptPwa — Android Crypto Toolbox 🔐

> An **offline Android app** for crypto/encoding/QR/JSON tooling: all computation runs locally, no network, no uploads, works offline.

![Android](https://img.shields.io/badge/Android-9%2B-00a862) ![Offline](https://img.shields.io/badge/offline-ready-00a862) ![Lang](https://img.shields.io/badge/language-zh%2Fen-4e6ef2)

> 🤖 **AI Disclosure:** This project's code was generated with AI assistance. Use at your own risk after review. See [AI_DISCLOSURE.md](AI_DISCLOSURE.md) ｜ [中文](README.md)

---

## 📦 Install

1. Open the **[Releases](https://github.com/ZAA66666/CryptPwa/releases)** page and download the latest `CryptPwa_<version>_release.apk`
2. Transfer the APK to your phone (USB / WeChat / cloud drive) and tap to install
3. Allow "install unknown apps" when prompted (self-signed, not a virus)
4. The "哈机码" icon appears on your home screen — open and use, **fully offline**

> Every push auto-builds a new APK; re-download to update.

## ✨ Features

| Module | Description |
|---|---|
| **Hashing** | MD5 / SHA1 / SHA256 / SHA512 / HMAC, etc. |
| **Encode / Decode** | Base64 / Hex / URL / Base32 / Base58 / Unicode / JWT, image → Base64 |
| **Encrypt / Decrypt** | Symmetric: AES(128/192/256) / DES / 3DES / Blowfish / RC4 / Rabbit (ECB/CBC/CTR/CFB/OFB); Asymmetric: RSA, SM2 |
| **QR / Barcode** | Generate + camera scan + barcode |
| **JSON Tools** | Format / minify / validate / extract by path / key-value editor |
| **Crontab** | Parse cron expressions and preview the next 5 run times |
| **Random** | Random passwords / numbers / strings / fake data (name/email/ID, etc.) |
| **Password Book** | 3 independent vaults, AES-256-CBC encrypted, master password, CryptoData.json export/import |

## 🔒 Privacy & Security

- Pure local computation (crypto-js / Web Crypto / sm-crypto). **Nothing is sent to any server.**
- Password book encrypted with AES-256-CBC + PBKDF2 (10,000 iterations); master password lives only in memory
- Data encryption on by default
- Native Android experience: back button, immersive status bar, predictive back gesture

## 🖥 Platform Support

| Platform | Status |
|---|---|
| **Android App (primary form)** | ✅ Android 9+ (API 28+); adapted for Xiaomi/OPPO/vivo/Huawei/Samsung |
| Web / PWA | ✅ Available (same codebase; open `index.html` in a browser; full PWA needs HTTPS or localhost) |

> The **Android app** is the primary form of this project. The web/PWA version is an additional form of the same codebase for temporary desktop use; features are identical.

## 🔄 Auto Build

Every push to `main` triggers [GitHub Actions](https://github.com/ZAA66666/CryptPwa/actions) to build an APK and publish to Releases:
- Builds **release** by default (self-signed, installable)
- Artifact naming: `CryptPwa_<version>_release.apk`
- Manual run with release/debug choice available in the Actions tab

## 📂 Project Structure

```
├── index.html / css / js    # App core code (shared by Android and web)
├── manifest*.webmanifest    # PWA manifests (for web)
├── sw.js                    # Service Worker (web offline cache)
├── capacitor.config.json    # Android packaging config
├── android/                 # Capacitor Android project (generates APK)
├── scripts/sync-web.mjs     # Web-asset sync script
└── .github/workflows/       # Auto-build APK
```

## 📝 License & Disclosure

- 🤖 **AI-generated code** — see [AI_DISCLOSURE.md](AI_DISCLOSURE.md) ｜ [中文](README.md)
- Personal learning project. **Star ⭐ / Fork / Issues** welcome.

---

*CryptPwa = Crypt + PWA: an encryption toolbox that fits in your pocket.*
