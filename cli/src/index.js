#!/usr/bin/env node
/**
 * Sentri CLI
 * Access your encrypted vault from the terminal.
 * Uses Node.js 18+ built-in Web Crypto API — no crypto libraries needed.
 *
 * Usage:
 *   sentri login               Sign in and unlock vault
 *   sentri list                List all vault items
 *   sentri get <title>         Show a specific item (blurred)
 *   sentri copy <title>        Copy password to clipboard
 *   sentri search <query>      Search vault items
 *   sentri generate [length]   Generate a secure password
 *   sentri lock                Clear session and lock vault
 *   sentri status              Show vault status
 */

import { createInterface } from "readline";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { homedir }        from "os";
import { join }           from "path";
import { execSync }       from "child_process";

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL  = process.env.SENTRI_SUPABASE_URL  ?? "https://YOUR_PROJECT.supabase.co";
const SUPABASE_ANON = process.env.SENTRI_SUPABASE_ANON ?? "YOUR_ANON_KEY";
const SESSION_DIR   = join(homedir(), ".sentri");
const SESSION_FILE  = join(SESSION_DIR, "session.json");
const LOCK_FILE     = join(SESSION_DIR, "lock");  // presence = locked

// ─── Colors ──────────────────────────────────────────────────────────────────

const c = {
  green:  (s) => `\x1b[32m${s}\x1b[0m`,
  bold:   (s) => `\x1b[1m${s}\x1b[0m`,
  dim:    (s) => `\x1b[2m${s}\x1b[0m`,
  red:    (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan:   (s) => `\x1b[36m${s}\x1b[0m`,
  reset:  (s) => `\x1b[0m${s}\x1b[0m`,
};

const logo = `
  ${c.green("█")} ${c.bold(c.green("Sentri"))} ${c.dim("— Zero-knowledge vault")}
`;

// ─── Session helpers ──────────────────────────────────────────────────────────

function saveSession(data) {
  if (!existsSync(SESSION_DIR)) mkdirSync(SESSION_DIR, { mode: 0o700 });
  writeFileSync(SESSION_FILE, JSON.stringify(data), { mode: 0o600 });
}

function loadSession() {
  try {
    return JSON.parse(readFileSync(SESSION_FILE, "utf8"));
  } catch { return null; }
}

function clearSession() {
  try { writeFileSync(SESSION_FILE, "{}", { mode: 0o600 }); } catch { /* ignore */ }
}

// ─── Crypto (Node 18+ WebCrypto) ─────────────────────────────────────────────

const { subtle } = globalThis.crypto;

const PBKDF2_ITER = 600_000;

function b64ToUint8(b64) {
  return Buffer.from(b64, "base64");
}

function uint8ToB64(arr) {
  return Buffer.from(arr).toString("base64");
}

async function deriveKey(masterPassword, secretKey, saltB64) {
  const salt     = b64ToUint8(saltB64);
  const combined = `${masterPassword}:${secretKey.replace(/-/g, "").toUpperCase()}`;
  const enc      = new TextEncoder();
  const baseKey  = await subtle.importKey("raw", enc.encode(combined), "PBKDF2", false, ["deriveKey"]);
  return subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITER, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function decryptItem(key, ciphertext, iv) {
  const ivBytes = b64ToUint8(iv);
  const data    = b64ToUint8(ciphertext);
  const dec     = await subtle.decrypt({ name: "AES-GCM", iv: ivBytes }, key, data);
  const text    = new TextDecoder().decode(dec);
  try { return JSON.parse(text); } catch { return text; }
}

// ─── Supabase REST helper ─────────────────────────────────────────────────────

async function sbFetch(path, opts = {}) {
  const session = loadSession();
  const headers = {
    "apikey":       SUPABASE_ANON,
    "Content-Type": "application/json",
    ...(session?.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {}),
    ...(opts.headers ?? {}),
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, { ...opts, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? res.statusText);
  }
  return res.json().catch(() => null);
}

async function sbAuth(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method:  "POST",
    headers: { "apikey": SUPABASE_ANON, "Content-Type": "application/json" },
    body:    JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description ?? "Auth failed");
  return data;
}

// ─── Prompt helpers ───────────────────────────────────────────────────────────

function prompt(question, muted = false) {
  return new Promise(resolve => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    if (muted) {
      process.stdout.write(question);
      process.stdin.setRawMode?.(true);
      let input = "";
      process.stdin.resume();
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", ch => {
        if (ch === "\n" || ch === "\r" || ch === "\u0004") {
          process.stdin.setRawMode?.(false);
          process.stdin.pause();
          process.stdout.write("\n");
          rl.close();
          resolve(input);
        } else if (ch === "\u0008" || ch === "\u007f") {
          if (input.length > 0) { input = input.slice(0, -1); process.stdout.write("\b \b"); }
        } else {
          input += ch;
          process.stdout.write("*");
        }
      });
    } else {
      rl.question(question, ans => { rl.close(); resolve(ans.trim()); });
    }
  });
}

// ─── Load vault items ─────────────────────────────────────────────────────────

async function loadDecryptedItems(vaultKey) {
  const rows = await sbFetch("/vault_items?select=*&order=updated_at.desc");
  if (!rows) return [];
  return (await Promise.all(
    rows.map(async (row) => {
      try {
        const data  = await decryptItem(vaultKey, row.encrypted_data, row.iv);
        const title = await decryptItem(vaultKey, row.title_encrypted, row.title_iv);
        return { id: row.id, title: String(title), item_type: row.item_type, data };
      } catch { return null; }
    })
  )).filter(Boolean);
}

// ─── Commands ─────────────────────────────────────────────────────────────────

async function cmdLogin() {
  console.log(logo);
  const email     = await prompt(c.dim("Email: "));
  const password  = await prompt(c.dim("Master password: "), true);
  const secretKey = await prompt(c.dim("Secret key: "));

  console.log(c.dim("\n  Deriving vault key…"));

  try {
    const authData = await sbAuth(email, password);
    const profiles = await sbFetch(`/profiles?id=eq.${authData.user.id}&select=encrypted_vault_key,vault_key_salt,vault_key_iv`, {
      headers: { "Authorization": `Bearer ${authData.access_token}` },
    });
    const profile = profiles?.[0];
    if (!profile) throw new Error("Profile not found.");

    const vaultKey = await deriveKey(password, secretKey, profile.vault_key_salt);

    // Verify canary
    try {
      await decryptItem(vaultKey, profile.encrypted_vault_key, profile.vault_key_iv);
    } catch {
      console.error(c.red("\n  ✗ Incorrect Secret Key.\n"));
      process.exit(1);
    }

    // Export raw key bytes to store in session
    const rawKey = await subtle.exportKey("raw", vaultKey);
    saveSession({
      access_token:   authData.access_token,
      vault_key_b64:  uint8ToB64(new Uint8Array(rawKey)),
      vault_key_salt: profile.vault_key_salt,
      email,
    });

    console.log(c.green(`\n  ✓ Vault unlocked — ${email}\n`));
  } catch (err) {
    console.error(c.red(`\n  ✗ ${err.message}\n`));
    process.exit(1);
  }
}

async function getVaultKey() {
  const session = loadSession();
  if (!session?.vault_key_b64) {
    console.error(c.red("  ✗ Not signed in. Run: sentri login\n"));
    process.exit(1);
  }
  const raw = b64ToUint8(session.vault_key_b64);
  return subtle.importKey("raw", raw, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

async function cmdList() {
  const vaultKey = await getVaultKey();
  const items    = await loadDecryptedItems(vaultKey);
  if (items.length === 0) { console.log(c.dim("  Vault is empty.\n")); return; }

  const typeIcon = { login: "🔑", card: "💳", note: "📄", ssh_key: "🖥 ", api_credential: "⚡" };
  console.log(`\n  ${c.bold(`${items.length} items in vault`)}\n`);
  items.forEach((item, i) => {
    const icon = typeIcon[item.item_type] ?? "🔑";
    const sub  = item.data?.type === "login" ? c.dim(` — ${item.data.username ?? ""}`) : "";
    console.log(`  ${c.dim(String(i + 1).padStart(3, " "))}  ${icon}  ${item.title}${sub}`);
  });
  console.log();
}

async function cmdGet(query) {
  const vaultKey = await getVaultKey();
  const items    = await loadDecryptedItems(vaultKey);
  const item     = findItem(items, query);
  if (!item) { console.error(c.red(`  ✗ No item found: "${query}"\n`)); process.exit(1); }

  console.log(`\n  ${c.bold(item.title)} ${c.dim(`(${item.item_type.replace("_"," ")})\n`)}`);
  const d = item.data;
  if (d.type === "login") {
    printField("Username", d.username);
    printField("Password", "•".repeat(Math.min(16, (d.password ?? "").length)) + "  " + c.dim("(use: sentri copy <title>)"));
    if (d.urls?.[0]) printField("URL", d.urls[0]);
    if (d.notes)     printField("Notes", d.notes);
  } else if (d.type === "card") {
    printField("Cardholder", d.cardholder_name);
    printField("Number",     "•••• " + (d.number ?? "").slice(-4));
    printField("Expiry",     d.expiry);
  } else if (d.type === "note") {
    console.log(c.dim("  Content:"));
    console.log(`  ${d.content}\n`);
  } else if (d.type === "api_credential") {
    printField("Type", d.credential_type);
    printField("Key",  "•".repeat(12) + "  " + c.dim("(use: sentri copy <title>)"));
    if (d.hostname) printField("Hostname", d.hostname);
  }
  console.log();
}

async function cmdCopy(query) {
  const vaultKey = await getVaultKey();
  const items    = await loadDecryptedItems(vaultKey);
  const item     = findItem(items, query);
  if (!item) { console.error(c.red(`  ✗ No item found: "${query}"\n`)); process.exit(1); }

  const d     = item.data;
  let value   = "";
  let label   = "";

  if (d.type === "login")          { value = d.password; label = "password"; }
  else if (d.type === "card")      { value = d.number;   label = "card number"; }
  else if (d.type === "api_credential") { value = d.key; label = "key"; }

  if (!value) { console.error(c.red(`  ✗ No copyable value for "${item.title}"\n`)); process.exit(1); }

  copyToClipboard(value);
  console.log(c.green(`\n  ✓ ${item.title} — ${label} copied to clipboard\n`));
}

async function cmdSearch(query) {
  const vaultKey = await getVaultKey();
  const items    = await loadDecryptedItems(vaultKey);
  const q        = query.toLowerCase();
  const results  = items.filter(i =>
    i.title.toLowerCase().includes(q) ||
    (i.data?.username ?? "").toLowerCase().includes(q) ||
    (i.data?.urls ?? []).some(u => u.toLowerCase().includes(q))
  );

  if (results.length === 0) { console.log(c.dim(`  No results for "${query}"\n`)); return; }
  console.log(`\n  ${c.bold(String(results.length))} result${results.length !== 1 ? "s" : ""} for ${c.cyan(`"${query}"`)}\n`);
  const typeIcon = { login: "🔑", card: "💳", note: "📄", ssh_key: "🖥 ", api_credential: "⚡" };
  results.forEach(item => {
    const sub = item.data?.type === "login" ? c.dim(` — ${item.data.username ?? ""}`) : "";
    console.log(`  ${typeIcon[item.item_type] ?? "🔑"}  ${item.title}${sub}`);
  });
  console.log();
}

function cmdGenerate(lengthArg = "20") {
  const length  = Math.min(128, Math.max(8, parseInt(lengthArg, 10) || 20));
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+";
  const bytes   = new Uint8Array(length * 2);
  globalThis.crypto.getRandomValues(bytes);
  let pw = "";
  for (let i = 0; i < bytes.length && pw.length < length; i++) {
    pw += charset[bytes[i] % charset.length];
  }
  copyToClipboard(pw);
  console.log(`\n  ${c.bold(c.green(pw))}\n  ${c.dim(`${length} chars — copied to clipboard\n`)}`);
}

function cmdLock() {
  clearSession();
  console.log(c.dim("\n  🔒 Vault locked. Session cleared.\n"));
}

async function cmdStatus() {
  const session = loadSession();
  if (!session?.access_token) {
    console.log(c.dim("\n  🔒 Vault is locked. Run: sentri login\n"));
  } else {
    console.log(c.green(`\n  ✓ Vault unlocked — ${session.email ?? "signed in"}\n`));
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findItem(items, query) {
  const q = query.toLowerCase();
  return items.find(i => i.title.toLowerCase() === q) ??
         items.find(i => i.title.toLowerCase().includes(q)) ??
         null;
}

function printField(label, value) {
  console.log(`  ${c.dim(label.padEnd(14))}${value ?? ""}`);
}

function copyToClipboard(text) {
  try {
    const platform = process.platform;
    if      (platform === "darwin") execSync("pbcopy", { input: text });
    else if (platform === "win32")  execSync("clip",   { input: text });
    else    execSync("xclip -selection clipboard 2>/dev/null || xsel --clipboard --input", { input: text, shell: true });
  } catch { /* clipboard not available */ }
}

// ─── Entry point ─────────────────────────────────────────────────────────────

async function main() {
  const [,, cmd, ...args] = process.argv;

  const commands = {
    login:    () => cmdLogin(),
    list:     () => cmdList(),
    ls:       () => cmdList(),
    get:      () => cmdGet(args.join(" ")),
    copy:     () => cmdCopy(args.join(" ")),
    cp:       () => cmdCopy(args.join(" ")),
    search:   () => cmdSearch(args.join(" ")),
    generate: () => cmdGenerate(args[0]),
    gen:      () => cmdGenerate(args[0]),
    lock:     () => cmdLock(),
    logout:   () => cmdLock(),
    status:   () => cmdStatus(),
  };

  if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") {
    console.log(`
${logo}
  ${c.bold("Commands:")}

  ${c.green("sentri login")}               Sign in and unlock vault
  ${c.green("sentri list")}                List all vault items
  ${c.green("sentri get")} ${c.cyan("<title>")}         Show item details
  ${c.green("sentri copy")} ${c.cyan("<title>")}        Copy password to clipboard
  ${c.green("sentri search")} ${c.cyan("<query>")}      Search vault items
  ${c.green("sentri generate")} ${c.cyan("[length]")}   Generate a secure password
  ${c.green("sentri lock")}                Lock vault and clear session
  ${c.green("sentri status")}              Show vault status

  ${c.dim("Configuration:")}
  ${c.dim("  SENTRI_SUPABASE_URL   Your Supabase project URL")}
  ${c.dim("  SENTRI_SUPABASE_ANON  Your Supabase anon key")}
`);
    return;
  }

  const handler = commands[cmd];
  if (!handler) {
    console.error(c.red(`  ✗ Unknown command: ${cmd}. Run: sentri help\n`));
    process.exit(1);
  }

  try {
    await handler();
  } catch (err) {
    console.error(c.red(`  ✗ ${err.message}\n`));
    process.exit(1);
  }
}

main();
