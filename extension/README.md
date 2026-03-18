# Sentri Browser Extension

Zero-knowledge autofill for Chrome, Arc, Brave, and Edge.

## Setup

### 1. Configure your Supabase project

Edit `popup.js` and replace the two constants at the top:

```js
const SUPABASE_URL  = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_ANON = "YOUR_ANON_KEY";
```

### 2. Add icons

Place PNG icons in the `icons/` directory:
- `icon-16.png`
- `icon-32.png`
- `icon-48.png`
- `icon-128.png`

A simple "S" on a green background works great.
You can generate them at: https://favicon.io/favicon-generator/

### 3. Install in Chrome (Developer Mode)

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `extension/` folder

The Sentri icon will appear in your toolbar.

## How it works

1. Click the Sentri icon on any page
2. Enter email + master password + secret key to unlock
3. The extension derives your AES-256-GCM vault key locally (never sent to server)
4. Your vault items are fetched (encrypted) and decrypted in the extension popup
5. On login pages, click **Autofill** to fill username + password instantly

## Security

- Credentials are stored in `chrome.storage.session` (cleared on browser close)
- The vault key is re-derived from stored credentials each popup open — the `CryptoKey` object is never stored
- All crypto uses the native Web Crypto API (same as the web app)
- The extension never sends plaintext to any server

## Files

```
extension/
├── manifest.json   Chrome Manifest V3
├── popup.html      Extension popup UI
├── popup.js        Vault UI + crypto + autofill dispatch
├── content.js      Form detection + autofill injection
├── background.js   Badge updates + install hook
└── icons/          Extension icons (add your own)
```
