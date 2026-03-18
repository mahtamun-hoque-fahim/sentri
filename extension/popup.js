/**
 * Sentri Browser Extension — Popup Script
 * Handles unlock, vault listing, autofill dispatch, and item detail view.
 * All crypto happens via the Web Crypto API (same primitives as the web app).
 */

"use strict";

// ─── Config ──────────────────────────────────────────────────────────────────
// Replace with your actual Supabase project URL and anon key
const SUPABASE_URL  = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_ANON = "YOUR_ANON_KEY";

// ─── Crypto (mirrors lib/crypto.ts) ──────────────────────────────────────────

const PBKDF2_ITERATIONS = 600_000;

async function deriveKey(masterPassword, secretKey, salt) {
  const enc      = new TextEncoder();
  const combined = masterPassword + ":" + secretKey.replace(/-/g, "").toUpperCase();
  const baseKey  = await crypto.subtle.importKey("raw", enc.encode(combined), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt.buffer, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function b64ToUint8(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

async function decryptData(key, ciphertext, iv) {
  const ivBytes  = b64ToUint8(iv);
  const data     = b64ToUint8(ciphertext);
  const dec      = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes.buffer },
    key,
    data.buffer
  );
  const text = new TextDecoder().decode(dec);
  try { return JSON.parse(text); } catch { return text; }
}

// ─── Supabase fetch helper ────────────────────────────────────────────────────

async function supabaseFetch(path, options = {}) {
  const session = await getSession();
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      "apikey":        SUPABASE_ANON,
      "Authorization": session ? `Bearer ${session.access_token}` : `Bearer ${SUPABASE_ANON}`,
      "Content-Type":  "application/json",
      "Prefer":        "return=representation",
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? res.statusText);
  }
  return res.json().catch(() => null);
}

// ─── Session helpers (chrome.storage.session) ────────────────────────────────

async function getSession() {
  return new Promise(resolve => chrome.storage.session.get(["session"], r => resolve(r.session ?? null)));
}

async function setSession(session) {
  return new Promise(resolve => chrome.storage.session.set({ session }, resolve));
}

async function getVaultKey() {
  // CryptoKey can't be stored in chrome.storage — we re-derive each popup open from stored creds
  const creds = await new Promise(resolve => chrome.storage.session.get(["creds"], r => resolve(r.creds ?? null)));
  if (!creds) return null;
  const { masterPassword, secretKey, salt } = creds;
  return deriveKey(masterPassword, secretKey, b64ToUint8(salt));
}

// ─── State ───────────────────────────────────────────────────────────────────

let allItems      = [];
let currentSite   = "";
let selectedItem  = null;

// ─── Screen management ───────────────────────────────────────────────────────

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// ─── Init ────────────────────────────────────────────────────────────────────

async function init() {
  // Get current tab URL
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const url = new URL(tab.url);
      currentSite = url.hostname;
      document.getElementById("current-site").textContent = currentSite;
    }
  } catch { /* ignore */ }

  const session = await getSession();
  if (session) {
    await loadVault();
  } else {
    showScreen("screen-unlock");
  }
}

// ─── Unlock ──────────────────────────────────────────────────────────────────

async function handleUnlock() {
  const email    = document.getElementById("u-email").value.trim();
  const password = document.getElementById("u-password").value;
  const secretKey= document.getElementById("u-secret").value.trim();
  const errEl    = document.getElementById("unlock-error");
  const btn      = document.getElementById("unlock-btn");

  errEl.style.display = "none";

  if (!email || !password || !secretKey) {
    showError("Please fill in all fields.");
    return;
  }

  btn.disabled    = true;
  btn.textContent = "Unlocking…";

  try {
    // 1. Sign in via Supabase Auth REST
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method:  "POST",
      headers: { "apikey": SUPABASE_ANON, "Content-Type": "application/json" },
      body:    JSON.stringify({ email, password }),
    });
    const authData = await authRes.json();
    if (!authRes.ok) throw new Error(authData.error_description ?? "Invalid credentials");

    await setSession(authData);

    // 2. Fetch profile
    const profiles = await supabaseFetch(
      `/profiles?id=eq.${authData.user.id}&select=encrypted_vault_key,vault_key_salt,vault_key_iv`
    );
    const profile = profiles?.[0];
    if (!profile) throw new Error("Profile not found.");

    // 3. Derive key and verify canary
    const salt       = b64ToUint8(profile.vault_key_salt);
    const derivedKey = await deriveKey(password, secretKey, salt);

    try {
      await decryptData(derivedKey, profile.encrypted_vault_key, profile.vault_key_iv);
    } catch {
      throw new Error("Incorrect Secret Key.");
    }

    // 4. Store creds in session storage for re-derivation
    await new Promise(resolve => chrome.storage.session.set({
      creds: { masterPassword: password, secretKey, salt: profile.vault_key_salt }
    }, resolve));

    await loadVault();
  } catch (err) {
    showError(err.message ?? "Login failed.");
    btn.disabled    = false;
    btn.textContent = "Unlock Vault";
  }

  function showError(msg) {
    errEl.textContent    = msg;
    errEl.style.display  = "block";
  }
}

// ─── Load Vault ──────────────────────────────────────────────────────────────

async function loadVault() {
  showScreen("screen-vault");

  try {
    const vaultKey = await getVaultKey();
    if (!vaultKey) { handleLock(); return; }

    const rows = await supabaseFetch("/vault_items?select=*&order=updated_at.desc");
    if (!rows) { allItems = []; renderItems([]); return; }

    // Decrypt all items
    allItems = (await Promise.all(
      rows.map(async row => {
        try {
          const data  = await decryptData(vaultKey, row.encrypted_data, row.iv);
          const title = await decryptData(vaultKey, row.title_encrypted, row.title_iv);
          return { id: row.id, title, item_type: row.item_type, favicon_url: row.favicon_url, data };
        } catch { return null; }
      })
    )).filter(Boolean);

    // Show items matching current site first
    renderItems(scoreItems(allItems, currentSite));
  } catch (err) {
    console.error("Load vault failed:", err);
  }
}

function scoreItems(items, site) {
  if (!site) return items;
  return [...items].sort((a, b) => {
    const aMatch = matchesSite(a, site) ? -1 : 0;
    const bMatch = matchesSite(b, site) ? -1 : 0;
    return aMatch - bMatch;
  });
}

function matchesSite(item, site) {
  if (item.data?.type !== "login") return false;
  return item.data.urls?.some(u => {
    try { return new URL(u).hostname.includes(site) || site.includes(new URL(u).hostname.replace("www.", "")); }
    catch { return false; }
  }) ?? false;
}

// ─── Render Items ─────────────────────────────────────────────────────────────

const TYPE_ICON = { login: "🔑", card: "💳", note: "📄", ssh_key: "🖥", api_credential: "⚡" };

function renderItems(items) {
  const list = document.getElementById("items-list");
  list.innerHTML = "";

  if (items.length === 0) {
    list.innerHTML = `
      <div class="empty">
        <div class="empty-icon">🔐</div>
        <p class="empty-title">No items found</p>
        <p class="empty-sub">Your vault is empty, or no items match this search.</p>
      </div>`;
    return;
  }

  items.forEach(item => {
    const row = document.createElement("div");
    row.className = "item-row fade-up";

    const icon = document.createElement("div");
    icon.className = "item-icon";
    if (item.favicon_url) {
      const img = document.createElement("img");
      img.src = item.favicon_url;
      img.onerror = () => { icon.textContent = TYPE_ICON[item.item_type] ?? "🔑"; };
      icon.appendChild(img);
    } else {
      icon.textContent = TYPE_ICON[item.item_type] ?? "🔑";
    }

    const info  = document.createElement("div");
    info.className = "item-info";
    const sub  = item.data?.type === "login"
      ? item.data.username || item.data.urls?.[0] || ""
      : item.item_type.replace("_", " ");
    info.innerHTML = `<div class="item-title">${escHtml(item.title)}</div>
                      <div class="item-sub">${escHtml(sub)}</div>`;

    const fillBtn = document.createElement("button");
    fillBtn.className = "fill-btn";
    fillBtn.textContent = matchesSite(item, currentSite) ? "Autofill" : "View";
    fillBtn.addEventListener("click", e => {
      e.stopPropagation();
      if (matchesSite(item, currentSite)) autofill(item);
      else showDetail(item);
    });

    row.appendChild(icon);
    row.appendChild(info);
    row.appendChild(fillBtn);
    row.addEventListener("click", () => showDetail(item));
    list.appendChild(row);
  });
}

// ─── Search ──────────────────────────────────────────────────────────────────

function handleSearch(q) {
  if (!q.trim()) { renderItems(scoreItems(allItems, currentSite)); return; }
  const lq = q.toLowerCase();
  const filtered = allItems.filter(i =>
    i.title.toLowerCase().includes(lq) ||
    (i.data?.username ?? "").toLowerCase().includes(lq) ||
    (i.data?.urls ?? []).some(u => u.toLowerCase().includes(lq))
  );
  renderItems(filtered);
}

// ─── Autofill ─────────────────────────────────────────────────────────────────

async function autofill(item) {
  if (item.data?.type !== "login") return;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id, {
      type:     "SENTRI_AUTOFILL",
      username: item.data.username,
      password: item.data.password,
    });
    window.close();
  } catch {
    // Content script may not be injected yet — try scripting API
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (u, p) => {
          const find = (selectors) => {
            for (const s of selectors) {
              const el = document.querySelector(s);
              if (el) return el;
            }
            return null;
          };
          const userField = find(['input[type="email"]', 'input[name*="user"]', 'input[name*="email"]', 'input[id*="user"]', 'input[id*="email"]']);
          const passField = find(['input[type="password"]']);
          if (userField) { userField.value = u; userField.dispatchEvent(new Event("input", { bubbles: true })); }
          if (passField) { passField.value = p; passField.dispatchEvent(new Event("input", { bubbles: true })); }
        },
        args: [item.data.username, item.data.password],
      });
      window.close();
    } catch (e) {
      console.error("Autofill failed:", e);
    }
  }
}

// ─── Item Detail ──────────────────────────────────────────────────────────────

function showDetail(item) {
  selectedItem = item;
  document.getElementById("detail-title").textContent = item.title;
  document.getElementById("detail-type").textContent  = item.item_type.replace("_", " ");
  document.getElementById("detail-icon").textContent  = TYPE_ICON[item.item_type] ?? "🔑";

  const autofillBtn = document.getElementById("autofill-btn");
  autofillBtn.style.display = (item.data?.type === "login" && matchesSite(item, currentSite)) ? "" : "none";

  const body = document.getElementById("detail-body");
  body.innerHTML = "";

  const card = document.createElement("div");
  card.className = "detail-card";

  const d = item.data;

  const fields = [];
  if (d.type === "login") {
    if (d.username) fields.push({ label: "Username", value: d.username, secret: false });
    if (d.password) fields.push({ label: "Password", value: d.password, secret: true  });
    if (d.urls?.[0]) fields.push({ label: "URL",      value: d.urls[0],  secret: false });
    if (d.notes)    fields.push({ label: "Notes",    value: d.notes,    secret: false });
  } else if (d.type === "card") {
    fields.push({ label: "Cardholder",  value: d.cardholder_name, secret: false });
    fields.push({ label: "Number",      value: d.number,          secret: true  });
    fields.push({ label: "Expiry",      value: d.expiry,          secret: false });
    fields.push({ label: "CVV",         value: d.cvv,             secret: true  });
  } else if (d.type === "note") {
    fields.push({ label: "Content",     value: d.content,         secret: false });
  } else if (d.type === "api_credential") {
    fields.push({ label: "Type",        value: d.credential_type, secret: false });
    fields.push({ label: "Key / Token", value: d.key,             secret: true  });
    if (d.hostname) fields.push({ label: "Hostname", value: d.hostname, secret: false });
  }

  fields.forEach(f => {
    const row    = document.createElement("div");
    row.className = "detail-field";

    const label  = document.createElement("div");
    label.className = "detail-label";
    label.textContent = f.label;

    const valRow = document.createElement("div");
    valRow.className = "detail-value-row";

    const val    = document.createElement("div");
    val.className = f.secret ? "detail-value blurred" : "detail-value";
    val.textContent = f.value;

    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;gap:4px;align-items:center;flex-shrink:0;";

    if (f.secret) {
      const showBtn   = document.createElement("button");
      showBtn.className = "show-btn";
      showBtn.textContent = "Show";
      let shown = false;
      showBtn.addEventListener("click", () => {
        shown = !shown;
        val.classList.toggle("blurred", !shown);
        showBtn.textContent = shown ? "Hide" : "Show";
      });
      actions.appendChild(showBtn);
    }

    const copyBtn   = document.createElement("button");
    copyBtn.className = "copy-btn";
    copyBtn.textContent = "Copy";
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(f.value);
      copyBtn.textContent = "✓";
      copyBtn.classList.add("copied");
      setTimeout(() => { copyBtn.textContent = "Copy"; copyBtn.classList.remove("copied"); }, 1500);
    });
    actions.appendChild(copyBtn);

    valRow.appendChild(val);
    valRow.appendChild(actions);
    row.appendChild(label);
    row.appendChild(valRow);
    card.appendChild(row);
  });

  body.appendChild(card);
  showScreen("screen-detail");
}

// ─── Lock ─────────────────────────────────────────────────────────────────────

async function handleLock() {
  await chrome.storage.session.clear();
  allItems = [];
  showScreen("screen-unlock");
  document.getElementById("u-password").value = "";
  document.getElementById("u-secret").value   = "";
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function escHtml(s) {
  return String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// ─── Event Listeners ─────────────────────────────────────────────────────────

document.getElementById("unlock-btn").addEventListener("click", handleUnlock);
document.getElementById("lock-btn").addEventListener("click", handleLock);
document.getElementById("back-btn").addEventListener("click", () => showScreen("screen-vault"));
document.getElementById("search-input").addEventListener("input", e => handleSearch(e.target.value));
document.getElementById("autofill-btn").addEventListener("click", () => { if (selectedItem) autofill(selectedItem); });

document.getElementById("btn-open-vault").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://sentri.app/dashboard" });
});
document.getElementById("btn-new-item").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://sentri.app/vault/new" });
});
document.getElementById("btn-generator").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://sentri.app/generator" });
});

// Enter key on unlock form
["u-email","u-password","u-secret"].forEach(id => {
  document.getElementById(id).addEventListener("keydown", e => {
    if (e.key === "Enter") handleUnlock();
  });
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
init();
