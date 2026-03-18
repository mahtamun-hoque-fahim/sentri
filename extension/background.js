/**
 * Sentri Background Service Worker
 * Handles badge updates and session keepalive.
 */

"use strict";

// Show green badge when a login form is detected on the page
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "SENTRI_LOGIN_FORM_DETECTED") {
    chrome.action.setBadgeText({ text: "✓" });
    chrome.action.setBadgeBackgroundColor({ color: "#006341" });
  }
});

// Clear badge when navigating to a new page
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    chrome.action.setBadgeText({ text: "" });
  }
});

// On install: open onboarding page
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({ url: "https://sentri.app" });
  }
});
