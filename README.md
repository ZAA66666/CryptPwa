# CryptPwa — Encryption Toolkit (PWA) 🔐

> A local-first PWA toolkit: **every calculation runs on your own device**. No data is uploaded, and it works offline.

![PWA](https://img.shields.io/badge/PWA-installable-brightgreen) ![Offline](https://img.shields.io/badge/offline-ready-blue) ![Lang](https://img.shields.io/badge/language-zh%2Fen-orange)

> 🤖 **AI Disclosure:** This project's code was generated with AI assistance. Use at your own risk after review. See [AI_DISCLOSURE.md](AI_DISCLOSURE.md). — 中文说明见 [README.zh-CN.md](README.zh-CN.md)

---

## ✨ Features

| Module | Description |
|---|---|
| **Hashing** | MD5 / SHA1 / SHA256 / SHA512 / HMAC, etc. |
| **Encode / Decode** | Base64 / Hex / URL / Base32 / Base58 / Unicode / JWT, image → Base64 |
| **Encrypt / Decrypt** | Symmetric: AES(128/192/256) / DES / 3DES / Blowfish / RC4 / Rabbit with ECB/CBC/CTR/CFB/OFB; Asymmetric: RSA, SM2 (Chinese national standard) |
| **QR / Barcode** | Generate (with error-correction levels), scan via camera, barcode generation |
| **JSON Tools** | Format / minify / validate / extract by path / key-value editor |
| **Crontab** | Parse cron expressions and preview the next 5 run times |
| **Random** | Random passwords / numbers / strings |
| **Password Book** | 3 independent vaults, AES-256-CBC encrypted storage (optional plain mode), master password, CryptoData.json export/import (encrypted or plain) |

## 🔒 Privacy & Security

- Pure client-side computation (crypto-js / Web Crypto / sm-crypto). **Nothing is sent to any server.**
- Password book is stored encrypted: AES-256-CBC with PBKDF2 (10,000 iterations); the master password lives only in memory.
- Data encryption is **on by default** to keep third-party scanners from reading plaintext.
- PWA offline support.

## 🚀 Quick Start

### Web (recommended)
1. Deploy to any static hosting (GitHub Pages / CloudStudio / Nginx / `python -m http.server`), or open `index.html` directly.
2. Full PWA features (offline/install) require HTTPS or localhost.
3. Install to desktop / home screen from the browser's install button.

### Android App (APK)
- Every push to `main` triggers [GitHub Actions](#-github-actions-auto-build) to build an APK and publish it to **Releases**.
- Download the latest `app-debug.apk` and install (allow "install unknown apps").
- Built with a WebView shell (Capacitor); core logic is identical to the web version and works offline.

## 📖 Documentation

- **中文版自述** → [README.zh-CN.md](README.zh-CN.md)
- **详细使用教程（中文）** → [使用教程.md](使用教程.md)

## 🖥 Platform Support

| Platform | Status |
|---|---|
| Desktop browsers (Windows / macOS / Linux) | ✅ Available (installable PWA) |
| Mobile browsers (Android / iOS) | ✅ Available (add to home screen) |
| **Android App** | 🚧 **Planned / in development**: packaged via a WebView shell (Capacitor); offline-capable, with external app invocation & callback (URL Scheme / Intent / JS Bridge) |

> Note: the app is expected to appear as an **Android app** as one of its main forms. A pure web page cannot write data back into another app due to browser restrictions; a native shell will enable the full "invoke → process → callback" plugin workflow.

## 🔄 GitHub Actions Auto Build

Workflow: `.github/workflows/build-apk.yml`

- **Trigger:** push to `main` (or run `Build Android APK` manually in the Actions tab)
- **Flow:** checkout → Node/Java → Capacitor Android project → Gradle `assembleDebug` → tag → publish to Releases
- Grab the latest APK from the **Releases** page.

## 📂 Project Structure

```
├── index.html            # SPA entry
├── css/style.css         # All styles (light/dark themes)
├── js/
│   ├── app.js            # Tool logic
│   ├── i18n.js           # zh/en strings + GITHUB_REPO constant
│   ├── settings.js       # Settings / password book / backup & sync
│   └── vendor/           # Offline libraries (crypto-js, jsQR, JsBarcode, …)
├── manifest*.webmanifest # PWA manifests (zh/en)
├── sw.js                 # Service Worker (offline cache)
├── android/              # Capacitor Android project (APK build)
└── .github/workflows/    # Auto-build APK
```

## 📝 License & Disclosure

- 🤖 **AI-generated code** — see [AI_DISCLOSURE.md](AI_DISCLOSURE.md)
- Personal learning project. **Star ⭐ / Fork / Issues** are welcome.

---

*CryptPwa = Crypt + PWA: an encryption toolbox that fits in your pocket.*
