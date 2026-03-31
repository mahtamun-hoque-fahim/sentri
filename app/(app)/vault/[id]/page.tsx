"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useVaultStore } from "@/store/vault";
import { api } from "@/lib/api";
import { decryptData, encryptData } from "@/lib/crypto";
import { VaultItemRow, DecryptedVaultItem, VaultItemData } from "@/types/vault";
import Header from "@/components/layout/Header";
import PasswordField from "@/components/vault/PasswordField";
import TOTPDisplay from "@/components/vault/TOTPDisplay";
import ItemHistory from "@/components/vault/ItemHistory";
import ShareItemModal from "@/components/sharing/ShareItemModal";

type CopyState = Record<string, boolean>;

export default function VaultItemPage() {
  const { id }     = useParams<{ id: string }>();
  const router     = useRouter();
  const vaultKey   = useVaultStore((s) => s.vaultKey);
  const storeItems = useVaultStore((s) => s.items);
  const updateItem = useVaultStore((s) => s.updateItem);
  const removeItem = useVaultStore((s) => s.removeItem);

  const [item,     setItem]     = useState<DecryptedVaultItem | null>(null);
  const [editing,  setEditing]  = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState("");
  const [copied,   setCopied]   = useState<CopyState>({});
  const [editData, setEditData] = useState<VaultItemData | null>(null);
  const [editTitle,setEditTitle]= useState("");

  const [showShare, setShowShare] = useState(false);

  useEffect(() => { loadItem(); }, [id, vaultKey]); // eslint-disable-line

  async function loadItem() {
    if (!vaultKey) return;
    setLoading(true);
    const cached = storeItems.find((i) => i.id === id);
    if (cached) {
      setItem(cached); setEditData(cached.data); setEditTitle(cached.title);
      setLoading(false); return;
    }
    try {
      const r = await api.items.get(id) as VaultItemRow;
      if (!r) throw new Error("Item not found.");
      const data  = await decryptData<VaultItemData>(vaultKey, r.encryptedData, r.iv);
      const title = await decryptData<string>(vaultKey, r.titleEncrypted, r.titleIv);
      const decrypted: DecryptedVaultItem = {
        id: r.id, title: title as unknown as string, itemType: r.itemType,
        faviconUrl: r.faviconUrl, createdAt: r.createdAt, updatedAt: r.updatedAt, data,
      };
      setItem(decrypted); setEditData(data); setEditTitle(title as unknown as string);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not load item.");
    } finally { setLoading(false); }
  }

  async function handleSave() {
    if (!vaultKey || !item || !editData) return;
    setSaving(true); setError("");
    try {
      // Save history first
      const hist1 = await encryptData(vaultKey, item.data);
      await api.history.create({ itemId: item.id, encryptedData: hist1.ciphertext, iv: hist1.iv }).catch(() => {});

      const { ciphertext: encData,  iv: dataIV  } = await encryptData(vaultKey, editData);
      const { ciphertext: encTitle, iv: titleIV } = await encryptData(vaultKey, editTitle);
      await api.items.update(id, { encryptedData: encData, iv: dataIV, titleEncrypted: encTitle, titleIv: titleIV });

      const updated: DecryptedVaultItem = {
        ...item, title: editTitle, data: editData, updatedAt: new Date().toISOString(),
      };
      setItem(updated); updateItem(id, updated); setEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!confirm("Delete this item permanently? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await api.items.delete(id);
      removeItem(id); router.push("/dashboard");
    } catch { setError("Failed to delete."); setDeleting(false); }
  }

  function copyField(label: string, value: string) {
    navigator.clipboard.writeText(value);
    setCopied((c) => ({ ...c, [label]: true }));
    setTimeout(() => setCopied((c) => ({ ...c, [label]: false })), 2000);
  }

  const CopyBtn = ({ label, value }: { label: string; value: string }) => (
    <button type="button" onClick={() => copyField(label, value)}
      className="text-xs px-2.5 py-1 rounded-lg border transition-all"
      style={{
        borderColor: copied[label] ? "var(--accent)" : "var(--border)",
        color:       copied[label] ? "var(--accent)" : "var(--sub)",
        background:  copied[label] ? "var(--accent-dim)" : "transparent",
      }}>
      {copied[label] ? "✓ Copied" : "Copy"}
    </button>
  );

  function Field({ label, value, secret = false }: { label: string; value: string; secret?: boolean }) {
    const [show, setShow] = useState(!secret);
    return (
      <div>
        <p className="text-xs font-medium uppercase tracking-widest  mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <p className="flex-1 text-sm  break-all"
            style={secret && !show ? { filter: "blur(5px)", userSelect: "none" } : {}}>
            {value || <span className=" italic">—</span>}
          </p>
          {secret && (
            <button type="button" onClick={() => setShow((s) => !s)}
              className="text-xs  hover: shrink-0">
              {show ? "Hide" : "Show"}
            </button>
          )}
          {value && <CopyBtn label={label} value={value} />}
        </div>
      </div>
    );
  }

  const input   = "w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-shadow ";
  const iStyle  = { borderColor: "var(--border)" };
  const iFocus  = { onFocus: (e: React.FocusEvent<HTMLInputElement|HTMLTextAreaElement>) => (e.target.style.boxShadow = "0 0 0 3px rgba(79,110,247,0.15)"),
                    onBlur:  (e: React.FocusEvent<HTMLInputElement|HTMLTextAreaElement>) => (e.target.style.boxShadow = "none") };

  if (loading) return (
    <>
      <Header title="Item" showSearch={false} />
      <div className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full">
        <div className=" rounded-2xl border p-6 flex flex-col gap-5" style={{ borderColor: "var(--border)" }}>
          {[1,2,3,4].map((i) => <div key={i} className="shimmer h-10 rounded-xl" />)}
        </div>
      </div>
    </>
  );

  if (error || !item) return (
    <>
      <Header title="Error" showSearch={false} />
      <div className="flex-1 px-6 py-12 text-center  text-sm">{error || "Item not found."}</div>
    </>
  );

  const isLogin = item.data.type === "login";

  return (
    <>
      <Header title={item.title} showSearch={false} />
      <div className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full">

        {/* Action bar */}
        <div className="flex items-center gap-2 mb-5">
          <Link href="/dashboard" className="text-sm  hover: transition-colors">← Back</Link>
          <div className="flex-1" />
          {!editing ? (
            <>
              <button onClick={() => setShowShare(true)}
                className="px-4 py-1.5 rounded-lg border text-sm font-medium hover:bg-sentri-muted transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--sub)" }}>
                Share
              </button>
              <button onClick={() => setEditing(true)}
                className="px-4 py-1.5 rounded-lg border text-sm font-medium hover:bg-sentri-muted transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}>Edit</button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-4 py-1.5 rounded-lg border text-sm font-medium"
                style={{ borderColor: "rgba(240,81,106,0.25)", color: "var(--danger)", background: "rgba(240,81,106,0.08)" }}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </>
          ) : (
            <>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #4F6EF7, #3A56D4)" }}>
                {saving ? "Saving…" : "Save"}
              </button>
              <button onClick={() => { setEditing(false); setEditData(item.data); setEditTitle(item.title); }}
                className="px-4 py-2 rounded-lg border text-sm font-medium  hover:bg-sentri-muted"
                style={{ borderColor: "var(--border)" }}>Cancel</button>
            </>
          )}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm border"
            style={{ background: "rgba(240,81,106,0.08)", borderColor: "rgba(240,81,106,0.25)", color: "var(--danger)" }}>{error}</div>
        )}

        <div className=" rounded-2xl border p-6 flex flex-col gap-5" style={{ borderColor: "var(--border)" }}>
          {/* Header row */}
          <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: "var(--accent-dim)" }}>
              {item.faviconUrl
                ? /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={item.faviconUrl} alt="" className="w-6 h-6 rounded"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                : { login: "🔑", card: "💳", note: "📄", ssh_key: "🖥", api_credential: "⚡" }[item.itemType]}
            </div>
            {editing ? (
              <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                className={input + " flex-1"} style={iStyle} {...iFocus} />
            ) : (
              <div>
                <p className="font-semibold ">{item.title}</p>
                <p className="text-xs  capitalize mt-0.5">{item.itemType.replace("_", " ")}</p>
              </div>
            )}
          </div>

          {/* TOTP display (view mode, login with totp_secret) */}
          {!editing && isLogin && (item.data as { totp_secret?: string }).totp_secret && (
            <TOTPDisplay secret={(item.data as { totp_secret: string }).totp_secret} />
          )}

          {/* View mode */}
          {!editing && (
            <>
              {item.data.type === "login" && (
                <>
                  <Field label="Username" value={item.data.username} />
                  <Field label="Password" value={item.data.password} secret />
                  {item.data.urls?.[0] && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-widest  mb-1">URL</p>
                      <div className="flex items-center gap-2">
                        <a href={item.data.urls[0]} target="_blank" rel="noopener noreferrer"
                          className="flex-1 text-sm truncate hover:underline" style={{ color: "var(--accent)" }}>
                          {item.data.urls[0]}
                        </a>
                        <CopyBtn label="URL" value={item.data.urls[0]} />
                      </div>
                    </div>
                  )}
                  {item.data.notes && <Field label="Notes" value={item.data.notes} />}
                </>
              )}
              {item.data.type === "card" && (
                <>
                  <Field label="Cardholder" value={item.data.cardholder_name} />
                  <Field label="Card Number" value={item.data.number} secret />
                  <Field label="Expiry" value={item.data.expiry} />
                  <Field label="CVV" value={item.data.cvv} secret />
                </>
              )}
              {item.data.type === "note" && <Field label="Content" value={item.data.content} />}
              {item.data.type === "ssh_key" && (
                <>
                  <Field label="Private Key" value={item.data.private_key} secret />
                  <Field label="Public Key" value={item.data.public_key} />
                </>
              )}
              {item.data.type === "api_credential" && (
                <>
                  <Field label="Type" value={item.data.credential_type} />
                  <Field label="Key / Token" value={item.data.key} secret />
                  {item.data.hostname && <Field label="Hostname" value={item.data.hostname} />}
                </>
              )}
            </>
          )}

          {/* Edit mode */}
          {editing && editData && (
            <>
              {editData.type === "login" && (
                <>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-widest  mb-1.5">Username</label>
                    <input type="text" value={editData.username}
                      onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                      className={input} style={iStyle} {...iFocus} />
                  </div>
                  <PasswordField value={editData.password}
                    onChange={(v) => setEditData({ ...editData, password: v })} />
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-widest  mb-1.5">URL</label>
                    <input type="url" value={editData.urls?.[0] ?? ""}
                      onChange={(e) => setEditData({ ...editData, urls: [e.target.value] })}
                      className={input} style={iStyle} {...iFocus} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-widest  mb-1.5">2FA Secret (TOTP)</label>
                    <input type="text" value={editData.totp_secret ?? ""}
                      onChange={(e) => setEditData({ ...editData, totp_secret: e.target.value })}
                      placeholder="otpauth://totp/... or base32 secret"
                      className={input} style={{ ...iStyle, fontFamily: "'Geist Mono',monospace", letterSpacing: "0.05em" }}
                      {...iFocus} />
                    <p className="text-xs  mt-1">Paste your TOTP secret to generate live 2FA codes.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-widest  mb-1.5">Notes</label>
                    <textarea value={editData.notes ?? ""}
                      onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                      rows={3} className={input + " resize-none"} style={iStyle} {...iFocus} />
                  </div>
                </>
              )}
              {editData.type === "card" && (
                <>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-widest  mb-1.5">Cardholder</label>
                    <input type="text" value={editData.cardholder_name}
                      onChange={(e) => setEditData({ ...editData, cardholder_name: e.target.value })}
                      className={input} style={iStyle} {...iFocus} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-widest  mb-1.5">Card Number</label>
                    <input type="text" value={editData.number}
                      onChange={(e) => setEditData({ ...editData, number: e.target.value })}
                      className={input} style={{ ...iStyle, fontFamily: "'Geist Mono',monospace" }} {...iFocus} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-widest  mb-1.5">Expiry</label>
                      <input type="text" value={editData.expiry}
                        onChange={(e) => setEditData({ ...editData, expiry: e.target.value })}
                        className={input} style={iStyle} {...iFocus} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-widest  mb-1.5">CVV</label>
                      <input type="password" value={editData.cvv}
                        onChange={(e) => setEditData({ ...editData, cvv: e.target.value })}
                        className={input} style={iStyle} {...iFocus} />
                    </div>
                  </div>
                </>
              )}
              {editData.type === "note" && (
                <div>
                  <label className="block text-xs font-medium uppercase tracking-widest  mb-1.5">Content</label>
                  <textarea value={editData.content}
                    onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                    rows={10} className={input + " resize-none"} style={iStyle} {...iFocus} />
                </div>
              )}
              {editData.type === "api_credential" && (
                <>
                  <PasswordField value={editData.key}
                    onChange={(v) => setEditData({ ...editData, key: v })} label="Key / Token" />
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-widest  mb-1.5">Hostname</label>
                    <input type="text" value={editData.hostname ?? ""}
                      onChange={(e) => setEditData({ ...editData, hostname: e.target.value })}
                      className={input} style={iStyle} {...iFocus} />
                  </div>
                </>
              )}
            </>
          )}

          {/* Item history — always visible at bottom */}
          {!editing && <ItemHistory itemId={item.id} />}
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs  px-1">
          <span>Created {new Date(item.createdAt).toLocaleDateString()}</span>
          <span>·</span>
          <span>Updated {new Date(item.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>

      {showShare && item && (
        <ShareItemModal item={item} onClose={() => setShowShare(false)} />
      )}
    </>
  );
}
