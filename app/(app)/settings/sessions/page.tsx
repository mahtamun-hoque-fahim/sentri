"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import Header from "@/components/layout/Header";

interface SessionRow {
  id:          string;
  device_name: string | null;
  ip_address:  string | null;
  user_agent:  string | null;
  last_active: string;
  created_at:  string;
}

function parseDevice(userAgent: string | null): { icon: string; name: string } {
  if (!userAgent) return { icon: "💻", name: "Unknown device" };
  const ua = userAgent.toLowerCase();
  if (ua.includes("iphone") || ua.includes("ipad"))  return { icon: "📱", name: "iOS Device" };
  if (ua.includes("android"))                         return { icon: "📱", name: "Android Device" };
  if (ua.includes("mac"))                             return { icon: "💻", name: "Mac" };
  if (ua.includes("windows"))                         return { icon: "🖥", name: "Windows PC" };
  if (ua.includes("linux"))                           return { icon: "🐧", name: "Linux" };
  return { icon: "💻", name: "Desktop" };
}

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)    return "Just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error,    setError]    = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const data = await api.sessions.list() as SessionRow[];
    setSessions(data ?? []);
    setLoading(false);
  }

  async function revoke(id: string) {
    setRevoking(id);
    await api.sessions.delete(id);
    setSessions((s) => s.filter((row) => row.id !== id));
    setRevoking(null);
  }

  async function revokeAll() {
    if (!confirm("Revoke all other sessions? You will remain signed in here.")) return;
    // Revoke all other sessions
    const others = sessions.slice(1);
    await Promise.all(others.map((s) => api.sessions.delete(s.id)));
    setSessions((s) => s.slice(0, 1));
  }

  return (
    <>
      <Header title="Active Sessions" showSearch={false} />
      <div className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full">

        <div className="flex items-center gap-3 mb-5">
          <Link href="/settings" className="text-sm text-sentri-sub hover:text-sentri-text transition-colors">← Settings</Link>
          <div className="flex-1" />
          {sessions.length > 1 && (
            <button onClick={revokeAll}
              className="text-sm px-4 py-1.5 rounded-lg border font-medium transition-colors"
              style={{ borderColor: "#FECAC7", color: "#D93025", background: "#FFF1F0" }}>
              Revoke all others
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl border text-sm"
            style={{ background: "#FFF1F0", borderColor: "#FECAC7", color: "#D93025" }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-2">
            {[1,2,3].map((i) => <div key={i} className="shimmer h-20 rounded-xl" />)}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 text-sentri-sub text-sm">
            <p className="text-3xl mb-3">🔒</p>
            <p>No sessions found. Sessions are logged when you sign in.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sessions.map((session, idx) => {
              const device = parseDevice(session.user_agent);
              const isCurrent = idx === 0;
              return (
                <div key={session.id}
                  className="flex items-center gap-4 px-5 py-4 bg-white rounded-xl border animate-fade-up"
                  style={{
                    borderColor: isCurrent ? "#006341" : "#E8EDEB",
                    borderWidth: isCurrent ? "1.5px" : "1px",
                    animationDelay: `${idx * 0.04}s`,
                  }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: isCurrent ? "rgba(0,99,65,0.08)" : "#F7F9F8" }}>
                    {device.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-sentri-text">
                        {session.device_name ?? device.name}
                      </p>
                      {isCurrent && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: "rgba(0,99,65,0.08)", color: "#006341" }}>
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-sentri-sub truncate">
                      {session.ip_address ?? "Unknown IP"} · Last active {timeAgo(session.last_active)}
                    </p>
                    <p className="text-xs text-sentri-sub">
                      Signed in {new Date(session.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {!isCurrent && (
                    <button
                      onClick={() => revoke(session.id)}
                      disabled={revoking === session.id}
                      className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors shrink-0"
                      style={{ borderColor: "#FECAC7", color: "#D93025", background: "#FFF1F0" }}>
                      {revoking === session.id ? "…" : "Revoke"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-5 text-xs text-sentri-sub text-center">
          Sessions are stored in your Supabase database. Revoking a session signs that device out.
        </p>
      </div>
    </>
  );
}
