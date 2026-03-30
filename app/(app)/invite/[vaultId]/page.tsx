"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import Header from "@/components/layout/Header";

interface MemberRow {
  id:         string;
  user_id:    string;
  role:       string;
  created_at: string;
  profile:    { email: string } | null;
}

interface InviteRow {
  id:         string;
  email:      string;
  status:     string;
  created_at: string;
}

interface VaultInfo {
  id:   string;
  name: string;
}

export default function InvitePage() {
  const { vaultId }  = useParams<{ vaultId: string }>();
  const [vault,      setVault]     = useState<VaultInfo | null>(null);
  const [members,    setMembers]   = useState<MemberRow[]>([]);
  const [invites,    setInvites]   = useState<InviteRow[]>([]);
  const [email,      setEmail]     = useState("");
  const [loading,    setLoading]   = useState(true);
  const [inviting,   setInviting]  = useState(false);
  const [error,      setError]     = useState("");
  const [success,    setSuccess]   = useState("");

  useEffect(() => { load(); }, [vaultId]); // eslint-disable-line

  async function load() {
    setLoading(true);
    const [allVaults, allInvites] = await Promise.all([
      api.vaults.list() as Promise<VaultInfo[]>,
      api.invites.list() as Promise<InviteRow[]>,
    ]);
    setVault(allVaults.find((v) => v.id === vaultId) ?? null);
    setInvites((allInvites ?? []).filter((i: InviteRow) => (i as unknown as {vault_id: string}).vault_id === vaultId));
    setMembers([]);
    setLoading(false);
  }

  async function sendInvite() {
    if (!email.trim() || !email.includes("@")) { setError("Enter a valid email address."); return; }
    setInviting(true); setError(""); setSuccess("");
    try {
      await api.invites.create({ vaultId, email: email.trim().toLowerCase() });
      setEmail("");
      setSuccess(`Invite sent to ${email.trim()}`);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send invite.");
    } finally {
      setInviting(false);
    }
  }

  async function revokeInvite(id: string) {
    await api.invites.delete(id);
    setInvites((i) => i.filter((inv) => inv.id !== id));
  }

  async function removeMember(id: string) {
    if (!confirm("Remove this member? They will lose access to this vault.")) return;
    // Member removal coming in future update
    setMembers((m) => m.filter((mem) => mem.id !== id));
  }

  const statusBadge = (status: string) => ({
    pending:  { color: "#EA8C35", bg: "rgba(234,140,53,0.08)",  label: "Pending"  },
    accepted: { color: "#00FF94", bg: "rgba(0,255,148,0.08)",     label: "Accepted" },
    declined: { color: "#D93025", bg: "rgba(255,77,106,0.08)",   label: "Declined" },
  }[status] ?? { color: "#8892A4", bg: "#080B12", label: status });

  return (
    <>
      <Header title={vault?.name ?? "Shared Vault"} showSearch={false} />
      <div className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full flex flex-col gap-5">

        <div className="flex items-center gap-3 mb-1">
          <Link href="/shared" className="text-sm  hover: transition-colors">
            ← Shared Vaults
          </Link>
        </div>

        {/* Send invite */}
        <div className=" rounded-2xl border p-5" style={{ borderColor: "#2A3244" }}>
          <p className="text-xs font-medium uppercase tracking-widest  mb-3">
            Invite to &ldquo;{vault?.name}&rdquo;
          </p>
          <div className="flex gap-2">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none bg-sentri-bg"
              style={{ borderColor: "#2A3244" }}
              onFocus={(e) => (e.target.style.boxShadow = "0 0 0 3px rgba(0,255,148,0.18)")}
              onBlur={(e)  => (e.target.style.boxShadow = "none")}
              onKeyDown={(e) => e.key === "Enter" && sendInvite()} />
            <button onClick={sendInvite} disabled={inviting}
              className="px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #00FF94, #00CC77)" }}>
              {inviting ? "Sending…" : "Invite"}
            </button>
          </div>
          {error   && <p className="text-xs mt-2" style={{ color: "#D93025"  }}>{error}</p>}
          {success && <p className="text-xs mt-2" style={{ color: "#00FF94" }}>{success}</p>}
          <p className="text-xs  mt-2 leading-relaxed">
            They will see a pending invite the next time they sign into Sentri.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[1,2,3].map((i) => <div key={i} className="shimmer h-16 rounded-xl" />)}
          </div>
        ) : (
          <>
            {/* Members */}
            {members.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-widest  mb-3">
                  Members ({members.length})
                </p>
                <div className="flex flex-col gap-2">
                  {members.map((member) => (
                    <div key={member.id}
                      className="flex items-center gap-4 px-5 py-3.5  rounded-xl border"
                      style={{ borderColor: "#2A3244" }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                        style={{ background: "rgba(0,255,148,0.07)" }}>👤</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium  truncate">
                          {member.profile?.email ?? "Unknown"}
                        </p>
                        <p className="text-xs  capitalize mt-0.5">{member.role}</p>
                      </div>
                      <button onClick={() => removeMember(member.id)}
                        className="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-sentri-bg"
                        style={{ borderColor: "#2A3244", color: "#8892A4" }}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Invites */}
            {invites.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-widest  mb-3">
                  Invites ({invites.length})
                </p>
                <div className="flex flex-col gap-2">
                  {invites.map((invite) => {
                    const badge = statusBadge(invite.status);
                    return (
                      <div key={invite.id}
                        className="flex items-center gap-4 px-5 py-3.5  rounded-xl border"
                        style={{ borderColor: "#2A3244" }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                          style={{ background: "#080B12" }}>📧</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium  truncate">{invite.email}</p>
                          <p className="text-xs  mt-0.5">
                            Sent {new Date(invite.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium shrink-0"
                          style={{ background: badge.bg, color: badge.color }}>
                          {badge.label}
                        </span>
                        {invite.status === "pending" && (
                          <button onClick={() => revokeInvite(invite.id)}
                            className="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-sentri-bg"
                            style={{ borderColor: "#2A3244", color: "#D93025" }}>
                            Cancel
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {members.length === 0 && invites.length === 0 && (
              <div className="text-center py-10  text-sm">
                <p className="text-3xl mb-3">👥</p>
                <p>No members yet. Send an invite above.</p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
