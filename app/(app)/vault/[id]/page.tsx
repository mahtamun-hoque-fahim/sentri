"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useVaultStore } from "@/store/vault";
import { createClient } from "@/lib/supabase";
import { decryptData, encryptData } from "@/lib/crypto";
import { VaultItemRow, DecryptedVaultItem, VaultItemData } from "@/types/vault";
import Header from "@/components/layout/Header";
import PasswordField from "@/components/vault/PasswordField";

type CopyState = Record<string, boolean>;

export default function VaultItemPage() {
  const { id }       = useParams<{ id: string }>();
  const router       = useRouter();
  const vaultKey     = useVaultStore((s) => s.vaultKey);
  const storeItems   = useVaultStore((s) => s.items);
  const updateItem   = useVaultStore((s) => s.updateItem);
  const removeItem   = useVaultStore((s) => s.removeItem);

  const [item, setItem]       = useState<DecryptedVaultItem | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError]     = useState("");
  const [copied, setCopied]   = useState<CopyState>({});

  // Editable fields mirror
  const [editData, setEditData] = useState<VaultItemData | null>(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    loadItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, vaultKey]);

  async function loadItem() {
    if (!vaultKey) return;
    setLoading(true);

    // Check store first
    const cached = storeItems.find((i) => i.id === id);
    if (cached) {
      setItem(cached);
      setEditData(cached.data);
      setEditTitle(cached.title);
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: row, error: err } = await supabase
        .from("vault_items")
        .select("*")
        .eq("id", id)
        .single();

      if (err || !row) throw new Error("Item not found.");

      const r = row as VaultItemRow;
      const data  = await decryptData<VaultItemData>(vaultKey, r.encrypted_data, r.iv);
      const title = await decryptData<string>(vaultKey, r.title_encrypted, r.title_iv);

      const decrypted: DecryptedVaultItem = {
        id:          r.id,
        title:       title as unknown as string,
        item_type:   r.item_type,
        favicon_url: r.favicon_url,
        created_at:  r.created_at,
        updated_at:  r.updated_at,
        data,
      };
      setItem(decrypted);
      setEditData(data);
      setEditTitle(title as unknown as string);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not load item.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!vaultKey || !item || !editData) return;
    setSaving(true);
    setError("");
    try {
      const supabase = createClient();
      const { ciphertext: encData,  iv: dataIV  } = await encryptData(vaultKey, editData);
      const { ciphertext: encTitle, iv: titleIV } = await encryptData(vaultKey, editTitle);

      const { error: updateError } = await supabase
        .from("vault_items")
        .update({ encrypted_data: encData, iv: dataIV, title_encrypted: encTitle, title_iv: titleIV, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (updateError) throw updateError;

      const updated: DecryptedVaultItem = { ...item, title: editTitle, data: editData, updated_at: new Date().toISOString() };
      setItem(updated);
      updateItem(id, updated);
      setEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const supabase = createClient();
      await supabase.from("vault_items").delete().eq("id", id);
      removeItem(id);
      router.push("/dashboard");
    } catch {
      setError("Failed to delete.");
      setDeleting(false);
    }
  }

  function copyToClipboard(label: string, value: string) {
    navigator.clipboard.writeText(value);
    setCopied((c) => ({ ...c, [label]: true }));
    setTimeout(() => setCopied((c) => ({ ...c, [label]: false })), 2000);
  }

  const CopyBtn = ({ label, value }: { label: string; value: string }) => (
    <button
      type="button"
      onClick={() => copyToClipboard(label, value)}
      className="text-xs px-2.5 py-1 rounded-lg border transition-all"
      style={{
        borderColor: copied[label] ? "#006341" : "#E8EDEB",
        color:       copied[label] ? "#006341" : "#667085",
        background:  copied[label] ? "rgba(0,99,65,0.06)" : "transparent",
      }}
    >
      {copied[label] ? "✓ Copied" : "Copy"}
    </button>
  );

  const Field = ({ label, value, secret = false }: { label: string; value: string; secret?: boolean }) => {
    const [show, setShow] = useState(!secret);
    return (
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-sentri-sub mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <p
            className="flex-1 text-sm text-sentri-text break-all"
            style={secret && !show ? { filter: "blur(5px)", userSelect: "none" } : {}}
          >
            {value || <span className="text-sentri-sub italic">—</span>}
          </p>
          {secret && (
            <button type="button" onClick={() => setShow((s) => !s)} className="text-xs text-sentri-sub hover:text-sentri-text">
              {show ? "Hide" : "Show"}
            </button>
          )}
          {value && <CopyBtn label={label} value={value} />}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <Header title="Item" showSearch={false} />
        <div className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full">
          <div className="bg-white rounded-2xl border p-6 flex flex-col gap-5" style={{ borderColor: "#E8EDEB" }}>
            {[1,2,3,4].map((i) => <div key={i} className="shimmer h-10 rounded-xl" />)}
          </div>
        </div>
      </>
    );
  }

  if (error || !item) {
    return (
      <>
        <Header title="Error" showSearch={false} />
        <div className="flex-1 px-6 py-12 text-center text-sentri-sub text-sm">{error || "Item not found."}</div>
      </>
    );
  }

  const input = "w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-shadow bg-sentri-bg";
  const inputStyle = { borderColor: "#E8EDEB" };
  const focusHandler = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.target.style.boxShadow = "0 0 0 3px rgba(0,99,65,0.18)"),
    onBlur:  (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.target.style.boxShadow = "none"),
  };

  return (
    <>
      <Header title={item.title} showSearch={false} />
      <div className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full">

        {/* Action bar */}
        <div className="flex items-center gap-2 mb-5">
          <Link href="/dashboard" className="text-sm text-sentri-sub hover:text-sentri-text transition-colors">← Back</Link>
          <div className="flex-1" />
          {!editing ? (
            <>
              <button onClick={() => setEditing(true)}
                className="px-4 py-1.5 rounded-lg border text-sm font-medium text-sentri-text hover:bg-sentri-muted transition-colors"
                style={{ borderColor: "#E8EDEB" }}>
                Edit
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-4 py-1.5 rounded-lg border text-sm font-medium transition-colors"
                style={{ borderColor: "#FECAC7", color: "#D93025", background: "#FFF1F0" }}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </>
          ) : (
            <>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #006341, #004D32)" }}>
                {saving ? "Saving…" : "Save"}
              </button>
              <button onClick={() => { setEditing(false); setEditData(item.data); setEditTitle(item.title); }}
                className="px-4 py-2 rounded-lg border text-sm font-medium text-sentri-sub hover:bg-sentri-muted transition-colors"
                style={{ borderColor: "#E8EDEB" }}>
                Cancel
              </button>
            </>
          )}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm border" style={{ background: "#FFF1F0", borderColor: "#FECAC7", color: "#D93025" }}>
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border p-6 flex flex-col gap-5" style={{ borderColor: "#E8EDEB" }}>
          {/* Title */}
          <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: "#E8EDEB" }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: "rgba(0,99,65,0.07)" }}>
              {item.favicon_url
                /* eslint-disable-next-line @next/next/no-img-element */
                ? <img src={item.favicon_url} alt="" className="w-6 h-6 rounded" />
                : { login: "🔑", card: "💳", note: "📄", ssh_key: "🖥", api_credential: "⚡" }[item.item_type]}
            </div>
            {editing ? (
              <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                className={input + " flex-1"} style={inputStyle} {...focusHandler} />
            ) : (
              <div>
                <p className="font-semibold text-sentri-text">{item.title}</p>
                <p className="text-xs text-sentri-sub capitalize mt-0.5">{item.item_type.replace("_", " ")}</p>
              </div>
            )}
          </div>

          {/* View mode */}
          {!editing && (
            <>
              {item.data.type === "login" && (
                <>
                  <Field label="Username" value={item.data.username} />
                  <Field label="Password" value={item.data.password} secret />
                  {item.data.urls?.[0] && <Field label="URL" value={item.data.urls[0]} />}
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

          {/* Edit mode — simplified inline editing */}
          {editing && editData && (
            <>
              {editData.type === "login" && (
                <>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-widest text-sentri-sub mb-1.5">Username</label>
                    <input type="text" value={editData.username}
                      onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                      className={input} style={inputStyle} {...focusHandler} />
                  </div>
                  <PasswordField value={editData.password}
                    onChange={(v) => setEditData({ ...editData, password: v })} />
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-widest text-sentri-sub mb-1.5">URL</label>
                    <input type="url" value={editData.urls?.[0] ?? ""}
                      onChange={(e) => setEditData({ ...editData, urls: [e.target.value] })}
                      className={input} style={inputStyle} {...focusHandler} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-widest text-sentri-sub mb-1.5">Notes</label>
                    <textarea value={editData.notes ?? ""}
                      onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                      rows={3} className={input + " resize-none"} style={inputStyle} {...focusHandler} />
                  </div>
                </>
              )}
              {editData.type === "card" && (
                <>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-widest text-sentri-sub mb-1.5">Cardholder Name</label>
                    <input type="text" value={editData.cardholder_name}
                      onChange={(e) => setEditData({ ...editData, cardholder_name: e.target.value })}
                      className={input} style={inputStyle} {...focusHandler} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-widest text-sentri-sub mb-1.5">Card Number</label>
                    <input type="text" value={editData.number}
                      onChange={(e) => setEditData({ ...editData, number: e.target.value })}
                      className={input} style={{ ...inputStyle, fontFamily: "'JetBrains Mono',monospace" }} {...focusHandler} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-widest text-sentri-sub mb-1.5">Expiry</label>
                      <input type="text" value={editData.expiry}
                        onChange={(e) => setEditData({ ...editData, expiry: e.target.value })}
                        className={input} style={inputStyle} {...focusHandler} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-widest text-sentri-sub mb-1.5">CVV</label>
                      <input type="password" value={editData.cvv}
                        onChange={(e) => setEditData({ ...editData, cvv: e.target.value })}
                        className={input} style={inputStyle} {...focusHandler} />
                    </div>
                  </div>
                </>
              )}
              {editData.type === "note" && (
                <div>
                  <label className="block text-xs font-medium uppercase tracking-widest text-sentri-sub mb-1.5">Content</label>
                  <textarea value={editData.content}
                    onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                    rows={10} className={input + " resize-none"} style={inputStyle} {...focusHandler} />
                </div>
              )}
              {editData.type === "api_credential" && (
                <>
                  <PasswordField value={editData.key} onChange={(v) => setEditData({ ...editData, key: v })} label="Key / Token" />
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-widest text-sentri-sub mb-1.5">Hostname</label>
                    <input type="text" value={editData.hostname ?? ""}
                      onChange={(e) => setEditData({ ...editData, hostname: e.target.value })}
                      className={input} style={inputStyle} {...focusHandler} />
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Meta */}
        <div className="mt-4 flex items-center gap-4 text-xs text-sentri-sub px-1">
          <span>Created {new Date(item.created_at).toLocaleDateString()}</span>
          <span>·</span>
          <span>Updated {new Date(item.updated_at).toLocaleDateString()}</span>
        </div>
      </div>
    </>
  );
}
