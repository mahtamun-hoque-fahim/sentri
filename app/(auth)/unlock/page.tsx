"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { api } from "@/lib/api";
import { deriveKey, decryptData, base64ToUint8 } from "@/lib/crypto";
import { useVaultStore } from "@/store/vault";
import { Suspense } from "react";
import { Lock, Eye, EyeOff, CheckCircle, ArrowRight } from "lucide-react";
import { SentriLogo } from "@/components/ui/SentriLogo";

function UnlockForm() {
  const router      = useRouter();
  const params      = useSearchParams();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const setVaultKey = useVaultStore((s) => s.setVaultKey);

  const [secretKey, setSecretKey] = useState("");
  const [password,  setPassword]  = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [welcome,   setWelcome]   = useState(false);

  useEffect(() => { if (params.get("welcome") === "1") setWelcome(true); }, [params]);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded || !user) return;
    setError(""); setLoading(true);
    try {
      let profile: { encryptedVaultKey: string; vaultKeySalt: string; vaultKeyIv: string };
      try {
        profile = await api.profile.get() as typeof profile;
      } catch {
        throw new Error("Vault setup incomplete. Please sign out and create a new account.");
      }

      const salt = base64ToUint8(profile.vaultKeySalt);
      const sk   = secretKey.replace(/-/g, "").toUpperCase();
      const derivedKey = await deriveKey(password, sk, salt);

      try {
        await decryptData<{ canary: string }>(derivedKey, profile.encryptedVaultKey, profile.vaultKeyIv);
      } catch {
        throw new Error("Incorrect Master Password or Secret Key.");
      }

      setVaultKey(derivedKey);

      await api.sessions.create({
        deviceName: navigator.userAgent.includes("Mobile") ? "Mobile" : "Desktop",
        userAgent:  navigator.userAgent,
      }).catch(() => {});

      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unlock failed.");
    } finally { setLoading(false); }
  }

  if (!isLoaded) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--sub)" }} className="animate-pulse">Initializing…</div>
    </div>
  );

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "var(--accent)";
    e.target.style.boxShadow = "0 0 0 3px var(--accent-dim)";
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "var(--border)";
    e.target.style.boxShadow = "none";
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1px solid var(--border)", background: "var(--surface2)",
    color: "var(--text)", fontSize: 13, fontFamily: "var(--font-mono)",
    outline: "none", transition: "border-color 0.15s, box-shadow 0.15s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 600,
    textTransform: "uppercase", letterSpacing: "0.1em",
    color: "var(--sub)", marginBottom: 6, fontFamily: "var(--font-mono)",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: 400 }} className="animate-fade-up">
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "36px 32px" }}>

          {/* Logo inside card */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
            <SentriLogo height={28} />
          </div>

          {welcome && (
            <div style={{ marginBottom: 20, padding: "10px 14px", borderRadius: 10, background: "var(--accent-dim)", border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)", color: "var(--accent)", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle size={14} /> Account created! Unlock your vault to get started.
            </div>
          )}

          <div style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, background: "var(--accent-dim)", border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)" }}>
            <Lock size={20} style={{ color: "var(--accent)" }} />
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Unlock vault</h1>
          <p style={{ fontSize: 13, color: "var(--sub)", marginBottom: 4 }}>
            Signed in as <span style={{ fontFamily: "var(--font-mono)", color: "var(--text2)" }}>{user?.primaryEmailAddress?.emailAddress}</span>
          </p>
          <p style={{ fontSize: 12, color: "var(--sub)", marginBottom: 24 }}>Enter your credentials to decrypt your vault locally.</p>

          {error && (
            <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: "rgba(240,81,106,0.08)", border: "1px solid rgba(240,81,106,0.25)", color: "var(--danger)", fontSize: 13 }}>
              {error}
              {error.includes("Vault setup incomplete") && (
                <button onClick={() => signOut({ redirectUrl: "/signup" })}
                  style={{ display: "block", marginTop: 8, textDecoration: "underline", fontWeight: 700, color: "var(--danger)", background: "none", border: "none", cursor: "pointer", fontSize: 13, padding: 0 }}>
                  Sign out and create a new account →
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleUnlock} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>Master Password</label>
              <div style={{ position: "relative" }}>
                <input type={showPw ? "text" : "password"} required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your master password"
                  style={{ ...inputStyle, paddingRight: 40 }} onFocus={onFocus} onBlur={onBlur} />
                <button type="button" onClick={() => setShowPw(s => !s)} tabIndex={-1}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--sub)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Secret Key</label>
              <input type="text" required value={secretKey} onChange={(e) => setSecretKey(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                style={{ ...inputStyle, fontSize: 11, letterSpacing: "0.05em" }}
                onFocus={onFocus} onBlur={onBlur} />
            </div>
            <button type="submit" disabled={loading} className="btn-accent"
              style={{ width: "100%", padding: "11px 0", borderRadius: 10, fontSize: 13, fontWeight: 700, marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1, border: "none", transition: "opacity 0.15s" }}>
              {loading ? "Decrypting vault…" : (<>Unlock Vault <ArrowRight size={14} /></>)}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function UnlockPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--sub)" }}>Loading…</div>
      </div>
    }>
      <UnlockForm />
    </Suspense>
  );
}
