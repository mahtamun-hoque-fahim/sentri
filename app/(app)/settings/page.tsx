"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useVaultStore } from "@/store/vault";
import Header from "@/components/layout/Header";

const LOCK_OPTIONS = [
  { value: 0,   label: "Never"     },
  { value: 5,   label: "5 minutes" },
  { value: 10,  label: "10 minutes"},
  { value: 15,  label: "15 minutes"},
  { value: 30,  label: "30 minutes"},
  { value: 60,  label: "1 hour"    },
];

export default function SettingsPage() {
  const autoLockMinutes = useVaultStore((s) => s.autoLockMinutes);
  const setAutoLock     = useVaultStore((s) => s.setAutoLock);
  const [saved,  setSaved]  = useState(false);
  const { user } = useUser();
  const email  = user?.primaryEmailAddress?.emailAddress ?? "";
  const loaded = !!user;

  function handleLockChange(v: number) {
    setAutoLock(v);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className=" rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
      <h2 className="text-sm font-semibold  mb-4 uppercase tracking-widest"
        style={{ fontSize: "11px", color: "var(--sub)" }}>{title}</h2>
      {children}
    </div>
  );

  const Row = ({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between py-3 border-b last:border-0"
      style={{ borderColor: "var(--bg)" }}>
      <div>
        <p className="text-sm font-medium ">{label}</p>
        {sub && <p className="text-xs  mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  );

  return (
    <>
      <Header title="Settings" showSearch={false} />
      <div className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full flex flex-col gap-4">

        {/* Account */}
        <Section title="Account">
          <Row label="Email" sub="Your Sentri account email">
            <span className="text-sm  font-mono">
              {loaded ? email : "Loading…"}
            </span>
          </Row>
          <Row label="Sessions" sub="View and revoke active sessions">
            <Link href="/settings/sessions"
              className="text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors hover:"
              style={{ borderColor: "var(--border)", color: "var(--sub)" }}>
              Manage →
            </Link>
          </Row>
        </Section>

        {/* Security */}
        <Section title="Security">
          <Row
            label="Auto-lock"
            sub="Lock the vault after inactivity. The vault key is cleared from memory.">
            <div className="flex items-center gap-2">
              {saved && (
                <span className="text-xs font-medium" style={{ color: "#4F6EF7" }}>✓ Saved</span>
              )}
              <select
                value={autoLockMinutes}
                onChange={(e) => handleLockChange(Number(e.target.value))}
                className="text-sm px-3 py-1.5 rounded-lg border outline-none transition-shadow"
                style={{ borderColor: "var(--border)", background: "var(--bg)" }}
                onFocus={(e) => (e.target.style.boxShadow = "0 0 0 3px rgba(79,110,247,0.15)")}
                onBlur={(e)  => (e.target.style.boxShadow = "none")}
              >
                {LOCK_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </Row>

          <Row label="Watchtower" sub="Scan vault for breached and weak passwords">
            <Link href="/watchtower"
              className="text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors hover:"
              style={{ borderColor: "var(--border)", color: "var(--sub)" }}>
              Open →
            </Link>
          </Row>

          <Row label="Encryption" sub="AES-256-GCM · PBKDF2 SHA-256 · 600,000 iterations">
            <span className="text-xs px-2 py-1 rounded-full font-medium"
              style={{ background: "rgba(79,110,247,0.1)", color: "#4F6EF7" }}>
              Active
            </span>
          </Row>
        </Section>

        {/* About */}
        <Section title="About">
          <Row label="Version" sub="Sentri Phase 2">
            <span className="text-xs  font-mono">v2.0.0</span>
          </Row>
          <Row label="Architecture" sub="Zero-knowledge · client-side encryption · open source">
            <span className="text-xs ">Next.js + Supabase</span>
          </Row>
        </Section>

        {/* Danger */}
        <Section title="Danger Zone">
          <Row label="Export vault" sub="Download an encrypted backup of your vault data">
            <button
              disabled
              className="text-xs px-3 py-1.5 rounded-lg border font-medium opacity-40 cursor-not-allowed"
              style={{ borderColor: "var(--border)", color: "var(--sub)" }}>
              Coming soon
            </button>
          </Row>
        </Section>

      </div>
    </>
  );
}
