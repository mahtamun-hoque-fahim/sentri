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
      <div className="text-sm font-mono animate-pulse" style={{ color: "#8892A4" }}>Initializing…</div>
    </div>
  );

  const inputBase = "w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all";
  const inputStyle = { background: "#161B27", borderColor: "#2A3244", color: "#E8EDF5" };
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "rgba(0,255,148,0.4)";
    e.target.style.boxShadow = "0 0 0 3px rgba(0,255,148,0.08)";
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#2A3244";
    e.target.style.boxShadow = "none";
  };

  return (
    <div className="min-h-screen vault-pattern flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">

        <div className="flex items-center gap-2.5 mb-8 justify-center animate-fade-up">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
            style={{ background: "linear-gradient(135deg, #00FF94, #00CC77)", color: "#080B12" }}>S</div>
          <span className="text-2xl font-bold" style={{ color: "#00FF94", fontFamily: "Space Grotesk" }}>Sentri</span>
        </div>

        <div className="rounded-2xl border p-8 animate-fade-up delay-1"
          style={{ background: "#0F1117", borderColor: "#2A3244" }}>

          {welcome && (
            <div className="mb-5 px-4 py-3 rounded-xl border text-sm flex items-center gap-2"
              style={{ background: "rgba(0,255,148,0.06)", borderColor: "rgba(0,255,148,0.2)", color: "#00FF94" }}>
              <CheckCircle size={15} />
              Account created! Unlock your vault to get started.
            </div>
          )}

          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(0,255,148,0.08)", border: "1px solid rgba(0,255,148,0.15)" }}>
            <Lock size={22} style={{ color: "#00FF94" }} />
          </div>

          <h1 className="text-2xl font-bold mb-1" style={{ color: "#E8EDF5" }}>Unlock vault</h1>
          <p className="text-sm mb-1" style={{ color: "#8892A4" }}>
            Signed in as <span className="font-mono" style={{ color: "#E8EDF5" }}>{user?.primaryEmailAddress?.emailAddress}</span>
          </p>
          <p className="text-xs mb-6" style={{ color: "#8892A4" }}>Enter your credentials to decrypt your vault locally.</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl border text-sm"
              style={{ background: "rgba(255,77,106,0.08)", borderColor: "rgba(255,77,106,0.25)", color: "#FF4D6A" }}>
              {error}
              {error.includes("Vault setup incomplete") && (
                <button onClick={() => signOut({ redirectUrl: "/signup" })}
                  className="block mt-2 underline font-bold" style={{ color: "#FF4D6A" }}>
                  Sign out and create a new account →
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleUnlock} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5 font-mono" style={{ color: "#8892A4" }}>Master Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your master password" className={inputBase + " pr-10"} style={inputStyle}
                  onFocus={onFocus} onBlur={onBlur} />
                <button type="button" onClick={() => setShowPw(s => !s)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#8892A4" }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5 font-mono" style={{ color: "#8892A4" }}>Secret Key</label>
              <input type="text" required value={secretKey} onChange={(e) => setSecretKey(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                className={inputBase + " font-mono"} style={{ ...inputStyle, fontSize: "11px", letterSpacing: "0.05em" }}
                onFocus={onFocus} onBlur={onBlur} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold mt-2 flex items-center justify-center gap-2 transition-all hover:shadow-neon disabled:opacity-40 btn-neon">
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
        <div className="text-sm font-mono animate-pulse" style={{ color: "#8892A4" }}>Loading…</div>
      </div>
    }>
      <UnlockForm />
    </Suspense>
  );
}
