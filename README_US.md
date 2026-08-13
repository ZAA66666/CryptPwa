# CryptPwa — Encryption Toolkit (PWA) 🔐

> A local-first PWA toolkit: **every calculation runs on your own device**. No data is uploaded, and it works offline.

![PWA](https://img.shields.io/badge/PWA-installable-brightgreen) ![Offline](https://img.shields.io/badge/offline-ready-blue) ![Lang](https://img.shields.io/badge/language-zh%2Fen-orange)

> 🤖 **AI Disclosure:** This project's code was generated with AI assistance. Use at your own risk after review. See [AI_DISCLOSURE.md](AI_DISCLOSURE.md) ｜ [中文](README.md)

---

## Table of Contents

1. [Features](#features)
2. [Privacy & Security](#privacy--security)
3. [Quick Start](#quick-start)
4. [User Guide](#user-guide)
5. [Platform Support](#platform-support)
6. [GitHub Actions Auto Build](#github-actions-auto-build)
7. [Project Structure](#project-structure)

---

## ✨ Features

| Module | Description |
|---|---|
| **Hashing** | MD5 / SHA1 / SHA256 / SHA512 / HMAC, etc. |
| **Encode / Decode** | Base64 / Hex / URL / Base32 / Base58 / Unicode / JWT, image → Base64 |
| **Encrypt / Decrypt** | Symmetric: AES(128/192/256) / DES / 3DES / Blowfish / RC4 / Rabbit with ECB/CBC/CTR/CFB/OFB; Asymmetric: RSA, SM2 (Chinese national standard) |
| **QR / Barcode** | Generate (error-correction levels), camera scan, barcode generation |
| **JSON Tools** | Format / minify / validate / extract by path / key-value editor |
| **Crontab** | Parse cron expressions and preview the next 5 run times |
| **Random** | Random passwords / numbers / strings |
| **Password Book** | 3 independent vaults, AES-256-CBC encrypted storage (optional plain mode), master password, CryptoData.json export/import (encrypted or plain) |

## 🔒 Privacy & Security

- Pure client-side computation (crypto-js / Web Crypto / sm-crypto). **Nothing is sent to any server.**
- Password book stored encrypted: AES-256-CBC with PBKDF2 (10,000 iterations); the master password lives only in memory.
- Data encryption is **on by default** so third-party scanners cannot read plaintext.
- PWA offline support.

## 🚀 Quick Start

### Web (recommended)
1. **Download source (zip)**: repo page → green `Code` button → `Download ZIP` → unzip.
2. Open `index.html` directly for most features; **full PWA features (offline / install)** need HTTPS or localhost:
   - With Python: run `python -m http.server 8000` inside the folder, open `http://localhost:8000`
   - Or deploy to any static hosting (GitHub Pages / CloudStudio / Nginx)
3. Install to desktop / home screen from the browser's install button.

### Android App (APK)
1. Open the **Releases** page and download the latest `CryptPwa_<version>_release.apk` (release = self-signed build; debug is for testing).
2. Transfer the APK to your phone (USB / WeChat / cloud drive) and tap to install.
3. Allow "install unknown apps" when prompted.
4. The "哈机码" icon appears on your home screen; works offline.
5. Every push to `main` triggers [GitHub Actions](#github-actions-auto-build) to build and publish a new version — re-download to update.

---

## 📖 User Guide

Every tool follows the same pattern: **input → set options → run → view/copy result**.

### 1. Hashing
Turn any text into a fixed-length "fingerprint" (one-way, cannot be reversed) — for integrity checks and password verification.

- Enter text → pick an algorithm (MD5 / SHA1 / SHA256 / SHA512…) → **Calculate**.
- **HMAC** (keyed hash): pick an HMAC algorithm, enter the key, and you may "Save to password book" afterwards (only HMAC prompts this).

### 2. Encode / Decode
Format conversion (Base64 / Hex / URL / Base32 / Base58 / Unicode / JWT). Encoding is not encryption — reversible and not secret.

- Pick **Encode / Decode** → pick a method → enter text → run.
- **Switching method auto-recomputes** with the last operation; success/failure is toasted.
- Image → Base64: pick an image → "Image → Base64".

### 3. Encrypt / Decrypt
Enter via the "Encrypt/Decrypt" card; switch **Symmetric / Asymmetric** at the top.

**Symmetric (AES / DES / 3DES / Blowfish / RC4 / Rabbit)**
- AES supports 128/192/256-bit key lengths; others follow the hints.
- Modes: ECB / CBC / CTR / CFB / OFB (ECB needs no IV; others need an **IV**, usually 16 bytes).
- Random buttons next to key / IV.
- After encrypting, "Save to password book" stores **key + mode + key size + IV**; refilling restores everything automatically.
- ⚠️ CBC-mode ciphertext **embeds the IV** (`v1:...` format) and decrypt extracts it automatically; old ciphertext without a saved IV cannot be decrypted.

**Asymmetric (RSA / SM2)**
- RSA auto-generates a 2048-bit key pair; "View/Edit key pair" lets you view, copy, **paste-import** (PEM format validated), regenerate, and save to the password book.
- SM2 auto-generates a key pair too; encrypt with the public key, decrypt with the private key; sign/verify supported.
- After picking from the password book, the status shows "Selected from book: xxx"; keep your private key safe.

### 4. QR / Barcode
- Generate: enter content → pick error-correction level → generate; barcode on the same page.
- Scan: "Scan QR" authorizes the camera, or pick an image; results can be copied or "filled" into other tools.

### 5. JSON Tools
- **Format**: paste JSON → format / minify / validate.
- **Extract**: extract by path and generate a code snippet.
- **Key-Value editor**: add key/value/type rows → "Generate JSON"; "＋ Template" fills a random example or a JSON template; import from the format pane.

### 6. Crontab
Enter a cron expression (5- or 6-field; `*`, lists, ranges, steps) → preview the next 5 run times.

### 7. Random
Generate random passwords / numbers / strings: configurable length, charset, count; one-click copy.

### 8. Password Book (Settings → Password Book)
Set a **master password** (AES-256-CBC encrypted; if forgotten it cannot be recovered). After unlock, **you only enter the master password once per app session**.

- **3 vaults**: Vault 1/2/3 are independent; switch at the top to view that vault; saves go to the current vault; long-press "Back" shows a hint.
- Saves from tools auto-carry algorithm/key/IV; the "Password Book" button refills everything.
- **Export/Import CryptoData.json**: choose 🔒 encrypted (import asks for the master password) or 📄 plain; legacy backups are compatible.

### 9. Settings
- **General**: language (zh/en/imported packs), theme, accent color, font size, immersive mode, external invocation & sharing, experimental (data callback / import methods), save path.
- **Data & privacy**: **data-encryption toggle** (on by default; turning off stores plaintext without a master password), password book, WebDAV backup/sync (with "Test connection": green = OK, red = fail).
- **Privacy & terms**: About (version / check update / source), privacy policy, terms, security notes.

### 10. External Invocation & Sharing
- With "Auto popup" on, data passed via `crypto-pwa://?text=...` or system share (text/JSON/image) opens a chooser automatically.
- Import methods (URL Scheme / Android Intent / system share / clipboard) and data callback are described under Settings → Experimental.

### FAQ

**Q: Can I encrypt on the web and have someone else decrypt it?**
Yes. For symmetric crypto, share the algorithm + key + IV + ciphertext (CBC ciphertext already contains the IV); for asymmetric, encrypt with the recipient's public key and they decrypt with their private key.

**Q: What if I forget the master password?**
It cannot be recovered (nothing is stored in plaintext). Keep it safe, and export encrypted backups regularly.

**Q: Where do I download the Android APK?**
The Releases page — rebuilt automatically on every push. Allow "unknown sources" when installing (debug-signed, personal use).

---

## 🖥 Platform Support

| Platform | Status |
|---|---|
| Desktop browsers (Windows / macOS / Linux) | ✅ Available (installable PWA) |
| Mobile browsers (Android / iOS) | ✅ Available (add to home screen) |
| **Android App** | 🚧 **In development**: WebView shell (Capacitor), offline-capable, with external invocation & callback (URL Scheme / Intent / JS Bridge) |

> The app is expected to appear as an **Android app** as one of its main forms. A pure web page cannot write data back into another app due to browser restrictions; a native shell enables the full "invoke → process → callback" plugin workflow.

## 🔄 GitHub Actions Auto Build

Workflow: `.github/workflows/build-apk.yml`

- **Trigger:** push to `main` → builds **release** automatically; or run manually in the Actions tab and choose `release` / `debug`.
- **Artifact naming:** `CryptPwa_<version>_<type>.apk` (e.g. `CryptPwa_1.0.0_release.apk`), published to Releases.
- **Flow:** checkout → Node 22 / Java 21 → `npm run sync` → Gradle build → tag → publish to Releases.
- Release is **self-signed** (fine for personal distribution); configure a real certificate when publishing to a store.

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
├── capacitor.config.json # Android packaging config (Capacitor)
├── android/              # Capacitor Android project
├── scripts/sync-web.mjs  # Web-asset sync script
└── .github/workflows/    # Auto-build APK
```

## 📝 License & Disclosure

- 🤖 **AI-generated code** — see [AI_DISCLOSURE.md](AI_DISCLOSURE.md) ｜ [中文](README.md)
- Personal learning project. **Star ⭐ / Fork / Issues** are welcome.

---

*CryptPwa = Crypt + PWA: an encryption toolbox that fits in your pocket.*
