/**
 * Sentri Content Script
 * Runs on every page, detects login forms, and handles
 * autofill messages from the popup.
 */

"use strict";

// ─── Autofill message handler ─────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== "SENTRI_AUTOFILL") return false;

  const result = autofillForm(msg.username, msg.password);
  sendResponse({ success: result });
  return true;
});

function autofillForm(username, password) {
  // Priority selectors for username/email fields
  const usernameSelectors = [
    'input[autocomplete="username"]',
    'input[autocomplete="email"]',
    'input[type="email"]',
    'input[name*="email" i]',
    'input[name*="user" i]',
    'input[id*="email" i]',
    'input[id*="user" i]',
    'input[name="login"]',
    'input[id="login"]',
  ];

  const passwordSelectors = [
    'input[autocomplete="current-password"]',
    'input[autocomplete="new-password"]',
    'input[type="password"]',
  ];

  const fill = (selectors, value) => {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) { // visible
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, "value"
        )?.set;
        nativeInputValueSetter?.call(el, value);
        el.dispatchEvent(new Event("input",  { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
    }
    return false;
  };

  const filledUser = fill(usernameSelectors, username);
  const filledPass = fill(passwordSelectors, password);

  if (filledUser || filledPass) {
    showAutofillToast(filledUser && filledPass ? "✓ Username & password filled" : "✓ Password filled");
    return true;
  }
  return false;
}

// ─── Toast notification ────────────────────────────────────────────────────────

function showAutofillToast(message) {
  const existing = document.getElementById("sentri-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id    = "sentri-toast";
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 2147483647;
    background: linear-gradient(135deg, #006341, #004D32);
    color: #fff;
    padding: 10px 16px;
    border-radius: 10px;
    font-size: 13px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-weight: 500;
    box-shadow: 0 4px 20px rgba(0,99,65,0.35);
    display: flex;
    align-items: center;
    gap: 8px;
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 0.2s ease, transform 0.2s ease;
    pointer-events: none;
  `;

  const icon = document.createElement("span");
  icon.textContent = "S";
  icon.style.cssText = `
    width: 18px; height: 18px; border-radius: 5px;
    background: rgba(255,255,255,0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700; flex-shrink: 0;
  `;

  toast.appendChild(icon);
  toast.appendChild(document.createTextNode(message));
  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.opacity   = "1";
      toast.style.transform = "translateY(0)";
    });
  });

  // Fade out after 2.5s
  setTimeout(() => {
    toast.style.opacity   = "0";
    toast.style.transform = "translateY(8px)";
    setTimeout(() => toast.remove(), 250);
  }, 2500);
}

// ─── Badge for detected login forms ──────────────────────────────────────────

function hasLoginForm() {
  return !!(document.querySelector('input[type="password"]'));
}

// Notify background to show badge if we detect a login form
if (hasLoginForm()) {
  chrome.runtime.sendMessage({ type: "SENTRI_LOGIN_FORM_DETECTED" }).catch(() => {});
}
