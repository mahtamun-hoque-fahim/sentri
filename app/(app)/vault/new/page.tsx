"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useVaultStore } from "@/store/vault";
import { api } from "@/lib/api";
import { encryptData } from "@/lib/crypto";
import { ItemType, VaultItemData } from "@/types/vault";
import Header from "@/components/layout/Header";
import PasswordField from "@/components/vault/PasswordField";

const TYPES: { value: ItemType; icon: string; label: string; desc: string }[] = [
  { value: "login",          icon: "🔑", label: "Login",       desc: "Website or app password" },
  { value: "card",           icon: "💳", label: "Card",        desc: "Credit or debit card"     },
  { value: "note",           icon: "📄", label: "Secure Note", desc: "Encrypted private note"   },
  { value: "ssh_key",        icon: "🖥",  label: "SSH Key",    desc: "SSH key pair"              },
  { value: "api_credential", icon: "⚡", label: "API Key",     desc: "Token or API credential"  },
];

export default function NewItemPage() {
  const router    = useRouter();
  const vaultKey  = useVaultStore((s) => s.vaultKey);
  const addItem   = useVaultStore((s) => s.addItem);

  const [type, setType]       = useState<ItemType>("login");
  const [title, setTitle]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  // Login fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [url, setUrl]           = useState("");
  const [notes, setNotes]       = useState("");

  // Card fields
  const [cardName, setCardName]     = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVV, setCardCVV]       = useState("");

  // Note
  const [noteContent, setNoteContent] = useState("");

  // SSH
  const [sshPrivate, setSshPrivate] = useState("");
  const [sshPublic, setSshPublic]   = useState("");

  // API
  const [apiKey, setApiKey]         = useState("");
  const [apiHost, setApiHost]       = useState("");
  const [apiType, setApiType]       = useState<"api_key"|"token"|"secret">("api_key");

  function buildItemData(): VaultItemData {
    switch (type) {
      case "login":          return { type, username, password, urls: url ? [url] : [], notes };
      case "card":           return { type, cardholder_name: cardName, number: cardNumber, expiry: cardExpiry, cvv: cardCVV };
      case "note":           return { type, content: noteContent };
      case "ssh_key":        return { type, private_key: sshPrivate, public_key: sshPublic };
      case "api_credential": return { type, credential_type: apiType, key: apiKey, hostname: apiHost };
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vaultKey) return;
    if (!title.trim()) { setError("Please enter a title."); return; }
    setError("");
    setLoading(true);

    try {
      const data = buildItemData();
      const { ciphertext: encData,  iv: dataIV  } = await encryptData(vaultKey, data);
      const { ciphertext: encTitle, iv: titleIV } = await encryptData(vaultKey, title);

      let favicon_url: string | null = null;
      if (type === "login" && url) {
        try { favicon_url = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`; } catch { /* ignore */ }
      }

      const row = await api.items.create({
        itemType:       type,
        encryptedData:  encData,
        iv:             dataIV,
        titleEncrypted: encTitle,
        titleIv:        titleIV,
        faviconUrl:     favicon_url,
      }) as { id: string; createdAt: string; updatedAt: string };

      // Add decrypted item to in-memory store
      addItem({
        id:        row.id,
        title,
        itemType:  type,
        faviconUrl: favicon_url,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        data,
      });

      router.push(`/vault/${row.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save item.");
    } finally {
      setLoading(false);
    }
  }

  const input = "w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-shadow ";
  const inputStyle = { borderColor: "var(--border)" };
  const focusStyle = { boxShadow: "0 0 0 3px rgba(79,110,247,0.15)" };

  return (
    <>
      <Header title="New Item" showSearch={false} />
      <div className="flex-1 px-6 py-6 max-w-2xl w-full mx-auto">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Type selector */}
          <div>
            <p className="text-xs font-medium uppercase tracking-widest  mb-3">Item Type</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all"
                  style={{
                    borderColor: type === t.value ? "var(--accent)" : "var(--border)",
                    background:  type === t.value ? "var(--accent-dim)" : "#fff",
                    color:       type === t.value ? "var(--accent)" : "var(--sub)",
                  }}
                >
                  <span className="text-xl">{t.icon}</span>
                  <span className="text-xs font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div
            className=" rounded-2xl border p-5 flex flex-col gap-4"
            style={{ borderColor: "var(--border)" }}
          >
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest  mb-1.5">Title</label>
              <input
                type="text" required
                value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Gmail, Netflix, AWS…"
                className={input} style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                onBlur={(e)  => (e.target.style.boxShadow = "none")}
              />
            </div>

            {/* Login fields */}
            {type === "login" && (
              <>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-widest  mb-1.5">Username / Email</label>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                    placeholder="you@example.com" className={input} style={inputStyle}
                    onFocus={(e) => Object.assign(e.target.style, focusStyle)} onBlur={(e) => (e.target.style.boxShadow = "none")} />
                </div>
                <PasswordField value={password} onChange={setPassword} label="Password" />
                <div>
                  <label className="block text-xs font-medium uppercase tracking-widest  mb-1.5">Website URL</label>
                  <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com" className={input} style={inputStyle}
                    onFocus={(e) => Object.assign(e.target.style, focusStyle)} onBlur={(e) => (e.target.style.boxShadow = "none")} />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-widest  mb-1.5">Notes</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes…" rows={3}
                    className={input + " resize-none"} style={inputStyle}
                    onFocus={(e) => Object.assign(e.target.style, focusStyle)} onBlur={(e) => (e.target.style.boxShadow = "none")} />
                </div>
              </>
            )}

            {/* Card fields */}
            {type === "card" && (
              <>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-widest  mb-1.5">Cardholder Name</label>
                  <input type="text" value={cardName} onChange={(e) => setCardName(e.target.value)}
                    placeholder="John Doe" className={input} style={inputStyle}
                    onFocus={(e) => Object.assign(e.target.style, focusStyle)} onBlur={(e) => (e.target.style.boxShadow = "none")} />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-widest  mb-1.5">Card Number</label>
                  <input type="text" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="•••• •••• •••• ••••" maxLength={19} className={input}
                    style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
                    onFocus={(e) => Object.assign(e.target.style, focusStyle)} onBlur={(e) => (e.target.style.boxShadow = "none")} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-widest  mb-1.5">Expiry</label>
                    <input type="text" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY" maxLength={5} className={input} style={inputStyle}
                      onFocus={(e) => Object.assign(e.target.style, focusStyle)} onBlur={(e) => (e.target.style.boxShadow = "none")} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-widest  mb-1.5">CVV</label>
                    <input type="password" value={cardCVV} onChange={(e) => setCardCVV(e.target.value)}
                      placeholder="•••" maxLength={4} className={input} style={inputStyle}
                      onFocus={(e) => Object.assign(e.target.style, focusStyle)} onBlur={(e) => (e.target.style.boxShadow = "none")} />
                  </div>
                </div>
              </>
            )}

            {/* Note */}
            {type === "note" && (
              <div>
                <label className="block text-xs font-medium uppercase tracking-widest  mb-1.5">Content</label>
                <textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Write your private note here…" rows={8}
                  className={input + " resize-none"} style={inputStyle}
                  onFocus={(e) => Object.assign(e.target.style, focusStyle)} onBlur={(e) => (e.target.style.boxShadow = "none")} />
              </div>
            )}

            {/* SSH Key */}
            {type === "ssh_key" && (
              <>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-widest  mb-1.5">Private Key</label>
                  <textarea value={sshPrivate} onChange={(e) => setSshPrivate(e.target.value)}
                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----" rows={6}
                    className={input + " resize-none font-mono text-xs"} style={inputStyle}
                    onFocus={(e) => Object.assign(e.target.style, focusStyle)} onBlur={(e) => (e.target.style.boxShadow = "none")} />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-widest  mb-1.5">Public Key</label>
                  <textarea value={sshPublic} onChange={(e) => setSshPublic(e.target.value)}
                    placeholder="ssh-ed25519 AAAA…" rows={3}
                    className={input + " resize-none font-mono text-xs"} style={inputStyle}
                    onFocus={(e) => Object.assign(e.target.style, focusStyle)} onBlur={(e) => (e.target.style.boxShadow = "none")} />
                </div>
              </>
            )}

            {/* API Credential */}
            {type === "api_credential" && (
              <>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-widest  mb-1.5">Credential Type</label>
                  <select value={apiType} onChange={(e) => setApiType(e.target.value as "api_key"|"token"|"secret")}
                    className={input} style={inputStyle}
                    onFocus={(e) => Object.assign(e.target.style, focusStyle)} onBlur={(e) => (e.target.style.boxShadow = "none")}>
                    <option value="api_key">API Key</option>
                    <option value="token">Token</option>
                    <option value="secret">Secret</option>
                  </select>
                </div>
                <PasswordField value={apiKey} onChange={setApiKey} label="Key / Token Value" />
                <div>
                  <label className="block text-xs font-medium uppercase tracking-widest  mb-1.5">Hostname / Service</label>
                  <input type="text" value={apiHost} onChange={(e) => setApiHost(e.target.value)}
                    placeholder="api.example.com" className={input} style={inputStyle}
                    onFocus={(e) => Object.assign(e.target.style, focusStyle)} onBlur={(e) => (e.target.style.boxShadow = "none")} />
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm border"
              style={{ background: "rgba(240,81,106,0.08)", borderColor: "rgba(240,81,106,0.25)", color: "var(--danger)" }}>
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #4F6EF7, #3A56D4)" }}>
              {loading ? "Encrypting & saving…" : "Save to Vault"}
            </button>
            <Link href="/dashboard"
              className="px-5 py-3 rounded-xl border text-sm font-medium  hover:bg-sentri-muted transition-colors"
              style={{ borderColor: "var(--border)" }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
