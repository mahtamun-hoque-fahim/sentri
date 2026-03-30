"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import Header from "@/components/layout/Header";
import { Lock, Users } from "lucide-react";

interface VaultRow {
  id:         string;
  name:       string;
  vault_type: string;
  owner_id:   string;
  created_at: string;
  member_count?: number;
}

interface InviteRow {
  id:         string;
  vault_id:   string;
  email:      string;
  status:     string;
  created_at: string;
  vault:      { name: string };
}

export default function SharedVaultsPage() {
  const [vaults,   setVaults]   = useState<VaultRow[]>([]);
  const [invites,  setInvites]  = useState<InviteRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [userId,   setUserId]   = useState("");
  const [creating, setCreating] = useState(false);
  const [newName,  setNewName]  = useState("");
  const [error,    setError]    = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [vaultData, inviteData] = await Promise.all([
      api.vaults.list() as Promise<VaultRow[]>,
      api.invites.list() as Promise<InviteRow[]>,
    ]);
    setVaults(vaultData ?? []);
    setInvites((inviteData ?? []).filter((i: InviteRow) => i.status === "pending"));
    setLoading(false);
  }

  async function createSharedVault() {
    if (!newName.trim()) return;
    setCreating(true);
    setError("");
    try {
      await api.vaults.create({ name: newName.trim(), vaultType: "shared" });
      setNewName("");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create vault.");
    } finally {
      setCreating(false);
    }
  }

  async function acceptInvite(inviteId: string) {
    await api.invites.update(inviteId, { status: "accepted" });
    await load();
  }

  async function declineInvite(inviteId: string) {
    await api.invites.update(inviteId, { status: "declined" });
    setInvites((i) => i.filter((inv) => inv.id !== inviteId));
  }

  const sharedVaults   = vaults.filter((v) => v.vault_type === "shared");
  const personalVaults = vaults.filter((v) => v.vault_type === "personal");

  return (
    <>
      <Header title="Shared Vaults" showSearch={false} />
      <div className="flex-1 px-6 py-6 max-w-3xl mx-auto w-full flex flex-col gap-6">

        {/* Pending invites */}
        {invites.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-widest  mb-3">
              Pending Invites
            </p>
            <div className="flex flex-col gap-2">
              {invites.map((invite) => (
                <div key={invite.id}
                  className="flex items-center gap-4 px-5 py-4  rounded-xl border animate-fade-up"
                  style={{ borderColor: "rgba(249,215,76,0.5)", background: "#FFFBEC" }}>
                  <span className="text-2xl">📬</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold ">
                      Invite to &ldquo;{invite.vault?.name ?? "Shared Vault"}&rdquo;
                    </p>
                    <p className="text-xs  mt-0.5">
                      Received {new Date(invite.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => acceptInvite(invite.id)}
                      className="px-3 py-1.5 rounded-lg text-white text-xs font-medium"
                      style={{ background: "linear-gradient(135deg, #4F6EF7, #3A56D4)" }}>
                      Accept
                    </button>
                    <button onClick={() => declineInvite(invite.id)}
                      className="px-3 py-1.5 rounded-lg border text-xs font-medium  hover:bg-sentri-muted"
                      style={{ borderColor: "var(--border)" }}>
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create shared vault */}
        <div className=" rounded-2xl border p-5" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs font-medium uppercase tracking-widest  mb-3">
            Create Shared Vault
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder='e.g. "Family", "Work Team", "Dev Secrets"'
              className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none "
              style={{ borderColor: "var(--border)" }}
              onFocus={(e) => (e.target.style.boxShadow = "0 0 0 3px rgba(79,110,247,0.15)")}
              onBlur={(e)  => (e.target.style.boxShadow = "none")}
              onKeyDown={(e) => e.key === "Enter" && createSharedVault()}
            />
            <button onClick={createSharedVault} disabled={creating || !newName.trim()}
              className="px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #4F6EF7, #3A56D4)" }}>
              {creating ? "…" : "Create"}
            </button>
          </div>
          {error && (
            <p className="text-xs mt-2" style={{ color: "var(--danger)" }}>{error}</p>
          )}
        </div>

        {/* Shared vaults */}
        {loading ? (
          <div className="flex flex-col gap-2">
            {[1,2].map((i) => <div key={i} className="shimmer h-20 rounded-xl" />)}
          </div>
        ) : (
          <>
            {sharedVaults.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-widest  mb-3">
                  Shared Vaults ({sharedVaults.length})
                </p>
                <div className="flex flex-col gap-2">
                  {sharedVaults.map((vault, i) => (
                    <div key={vault.id}
                      className="flex items-center gap-4 px-5 py-4  rounded-xl border animate-fade-up"
                      style={{ borderColor: "var(--border)", animationDelay: `${i * 0.05}s` }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                        style={{ background: "rgba(79,110,247,0.08)" }}>
                        👥
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold ">{vault.name}</p>
                        <p className="text-xs  mt-0.5">
                          Created {new Date(vault.created_at).toLocaleDateString()}
                          {vault.owner_id === userId && " · You own this"}
                        </p>
                      </div>
                      <Link href={`/invite/${vault.id}`}
                        className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors hover:"
                        style={{ borderColor: "var(--border)", color: "var(--sub)" }}>
                        Manage →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sharedVaults.length === 0 && (
              <div className="text-center py-10">
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-4"
                  style={{ background: "rgba(79,110,247,0.08)" }}><Users size={16} style={{ color: "var(--sub)" }} /></div>
                <h3 className="text-base font-semibold  mb-1"
                  style={{ fontFamily: "'Geist', serif" }}>No shared vaults yet</h3>
                <p className="text-sm ">Create one above and invite your trusted circle.</p>
              </div>
            )}

            {/* Personal vaults info */}
            {personalVaults.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-widest  mb-3">
                  Personal Vaults ({personalVaults.length})
                </p>
                {personalVaults.map((vault) => (
                  <div key={vault.id}
                    className="flex items-center gap-4 px-5 py-4  rounded-xl border"
                    style={{ borderColor: "var(--border)" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: "rgba(79,110,247,0.08)" }}><Lock size={20} style={{ color: "#4F6EF7" }} /></div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold ">{vault.name}</p>
                      <p className="text-xs  mt-0.5">Your private vault</p>
                    </div>
                    <Link href="/dashboard"
                      className="text-xs px-3 py-1.5 rounded-lg border font-medium hover: transition-colors"
                      style={{ borderColor: "var(--border)", color: "var(--sub)" }}>
                      Open →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
