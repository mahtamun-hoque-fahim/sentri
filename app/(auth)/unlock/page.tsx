"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { api } from "@/lib/api";
import { deriveKey, decryptData, base64ToUint8 } from "@/lib/crypto";
import { useVaultStore } from "@/store/vault";
import { Suspense } from "react";
import { Lock, Eye, EyeOff, CheckCircle, ArrowRight } from "lucide-react";

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
    <div className="min-h-screen vault-pattern flex items-center justify-center">
      <div className="text-sm font-mono animate-pulse" style={{ color: "var(--sub)" }}>Initializing…</div>
    </div>
  );

  const inputBase = "w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all";
  const inputStyle = { background: "var(--surface2)", borderColor: "var(--border)", color: "var(--text)" };
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "rgba(79,110,247,0.5)";
    e.target.style.boxShadow = "0 0 0 3px rgba(79,110,247,0.1)";
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "var(--border)";
    e.target.style.boxShadow = "none";
  };

  return (
    <div className="min-h-screen vault-pattern flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">

        <div className="flex items-center gap-2.5 mb-8 justify-center animate-fade-up">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
            style={{ background: "linear-gradient(135deg, #4F6EF7, #3A56D4)", color: "var(--bg)" }}>S</div>
          <span className="text-2xl font-bold" style={{ color: "#4F6EF7", fontFamily: "Geist" }}>Sentri</span>
        </div>

        <div className="rounded-2xl border p-8 animate-fade-up delay-1"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>

          {welcome && (
            <div className="mb-5 px-4 py-3 rounded-xl border text-sm flex items-center gap-2"
              style={{ background: "rgba(79,110,247,0.07)", borderColor: "rgba(79,110,247,0.25)", color: "#4F6EF7" }}>
              <CheckCircle size={15} />
              Account created! Unlock your vault to get started.
            </div>
          )}

          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(79,110,247,0.1)", border: "1px solid rgba(79,110,247,0.15)" }}>
            <Lock size={22} style={{ color: "#4F6EF7" }} />
          </div>

          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>Unlock vault</h1>
          <p className="text-sm mb-1" style={{ color: "var(--sub)" }}>
            Signed in as <span className="font-mono" style={{ color: "var(--text)" }}>{user?.primaryEmailAddress?.emailAddress}</span>
          </p>
          <p className="text-xs mb-6" style={{ color: "var(--sub)" }}>Enter your credentials to decrypt your vault locally.</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl border text-sm"
              style={{ background: "rgba(240,81,106,0.08)", borderColor: "rgba(240,81,106,0.25)", color: "var(--danger)" }}>
              {error}
              {error.includes("Vault setup incomplete") && (
                <button onClick={() => signOut({ redirectUrl: "/signup" })}
                  className="block mt-2 underline font-bold" style={{ color: "var(--danger)" }}>
                  Sign out and create a new account →
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleUnlock} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5 font-mono" style={{ color: "var(--sub)" }}>Master Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your master password" className={inputBase + " pr-10"} style={inputStyle}
                  onFocus={onFocus} onBlur={onBlur} />
                <button type="button" onClick={() => setShowPw(s => !s)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--sub)" }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5 font-mono" style={{ color: "var(--sub)" }}>Secret Key</label>
              <input type="text" required value={secretKey} onChange={(e) => setSecretKey(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                className={inputBase + " font-mono"} style={{ ...inputStyle, fontSize: "11px", letterSpacing: "0.05em" }}
                onFocus={onFocus} onBlur={onBlur} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold mt-2 flex items-center justify-center gap-2 transition-all  disabled:opacity-40 btn-accent">
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
      <div className="min-h-screen vault-pattern flex items-center justify-center">
        <div className="text-sm font-mono animate-pulse" style={{ color: "var(--sub)" }}>Loading…</div>
      </div>
    }>
      <UnlockForm />
    </Suspense>
  );
}
