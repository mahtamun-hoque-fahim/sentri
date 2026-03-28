"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { encryptData } from "@/lib/crypto";
import {
  generateShareKey,
  exportShareKeyToFragment,
} from "@/lib/sharing";
import { DecryptedVaultItem } from "@/types/vault";
import { useVaultStore } from "@/store/vault";

interface ShareItemModalProps {
  item:    DecryptedVaultItem;
  onClose: () => void;
}

const EXPIRY_OPTIONS = [
  { label: "1 hour",   hours: 1   },
  { label: "24 hours", hours: 24  },
  { label: "7 days",   hours: 168 },
];

export default function ShareItemModal({ item, onClose }: ShareItemModalProps) {
  const vaultKey  = useVaultStore((s) => s.vaultKey);
  const [expiry,  setExpiry]  = useState(24);
  const [maxViews,setMaxViews]= useState(1);
  const [loading, setLoading] = useState(false);
  const [shareURL,setShareURL]= useState("");
  const [copied,  setCopied]  = useState(false);
  const [error,   setError]   = useState("");

  async function createShare() {
    if (!vaultKey) return;
    setLoading(true);
    setError("");
    try {
      // 1. Generate random share key (will go in URL fragment)
      const shareKey    = await generateShareKey();
      const keyFragment = await exportShareKeyToFragment(shareKey);

      // 2. Re-encrypt item data with the share key
      const sharePayload = {
        title:    item.title,
        itemType: item.itemType,
        data:     item.data,
      };
      const { ciphertext, iv } = await encryptData(shareKey, sharePayload);

      // 3. Store encrypted payload + metadata in DB
      const expiresAt = new Date(Date.now() + expiry * 3_600_000).toISOString();
      const row = await api.shares.create({
        itemId:             item.id,
        encryptedShareData: ciphertext,
        shareIv:            iv,
        expiresAt,
        maxViews:           maxViews,
      }) as { id: string };

      // 4. Build share URL — key in fragment, never hits server
      const base = window.location.origin;
      setShareURL(`${base}/share/${row.id}#k=${keyFragment}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create share link.");
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(shareURL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(26,31,30,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-2xl border shadow-vault w-full max-w-md animate-fade-up"
        style={{ borderColor: "#E8EDEB" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#E8EDEB" }}>
          <div className="flex items-center gap-3">
            <span className="text-xl">🔗</span>
            <div>
              <p className="text-sm font-semibold text-sentri-text">Share Item</p>
              <p className="text-xs text-sentri-sub">{item.title}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sentri-sub hover:bg-sentri-muted transition-colors">
            ✕
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {!shareURL ? (
            <>
              {/* Security notice */}
              <div className="rounded-xl border px-4 py-3 text-sm flex items-start gap-2"
                style={{ background: "rgba(0,99,65,0.05)", borderColor: "rgba(0,99,65,0.15)" }}>
                <span>🔐</span>
                <p className="text-xs text-sentri-sub leading-relaxed">
                  The encryption key is embedded in the URL fragment and never sent to our servers.
                  Only someone with the full link can decrypt this item.
                </p>
              </div>

              {/* Expiry */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-widest text-sentri-sub mb-2">
                  Link expires after
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {EXPIRY_OPTIONS.map((o) => (
                    <button key={o.hours} type="button"
                      onClick={() => setExpiry(o.hours)}
                      className="py-2 rounded-xl border text-sm font-medium transition-all"
                      style={{
                        borderColor: expiry === o.hours ? "#006341" : "#E8EDEB",
                        background:  expiry === o.hours ? "rgba(0,99,65,0.08)" : "#fff",
                        color:       expiry === o.hours ? "#006341" : "#667085",
                      }}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max views */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-widest text-sentri-sub mb-2">
                  Max views
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 3, 10].map((v) => (
                    <button key={v} type="button"
                      onClick={() => setMaxViews(v)}
                      className="py-2 rounded-xl border text-sm font-medium transition-all"
                      style={{
                        borderColor: maxViews === v ? "#006341" : "#E8EDEB",
                        background:  maxViews === v ? "rgba(0,99,65,0.08)" : "#fff",
                        color:       maxViews === v ? "#006341" : "#667085",
                      }}>
                      {v === 1 ? "1 — One-time" : v}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl border text-sm"
                  style={{ background: "#FFF1F0", borderColor: "#FECAC7", color: "#D93025" }}>
                  {error}
                </div>
              )}

              <button onClick={createShare} disabled={loading}
                className="w-full py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #006341, #004D32)" }}>
                {loading ? "Encrypting…" : "Create Share Link"}
              </button>
            </>
          ) : (
            <>
              {/* Share link ready */}
              <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "#006341" }}>
                <span className="text-base">✅</span>
                Share link created
              </div>

              <div className="rounded-xl border p-3" style={{ background: "#F7F9F8", borderColor: "#E8EDEB" }}>
                <p className="text-xs font-mono break-all text-sentri-sub leading-relaxed"
                  style={{ wordBreak: "break-all" }}>
                  {shareURL}
                </p>
              </div>

              <div className="flex flex-col gap-2 text-xs text-sentri-sub">
                <p>⏱ Expires in {expiry < 24 ? `${expiry}h` : expiry < 168 ? "24h" : "7 days"}</p>
                <p>👁 Max {maxViews} view{maxViews !== 1 ? "s" : ""}</p>
                <p>🔐 Decryption key is in the URL fragment — only the link holder can decrypt</p>
              </div>

              <button onClick={copy}
                className="w-full py-2.5 rounded-xl border text-sm font-medium transition-all"
                style={{
                  borderColor: copied ? "#006341" : "#E8EDEB",
                  background:  copied ? "rgba(0,99,65,0.08)" : "#fff",
                  color:       copied ? "#006341" : "#1A1F1E",
                }}>
                {copied ? "✓ Copied to clipboard!" : "Copy Link"}
              </button>

              <button onClick={() => { setShareURL(""); setCopied(false); }}
                className="text-xs text-sentri-sub hover:text-sentri-text transition-colors text-center">
                Create another link
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
