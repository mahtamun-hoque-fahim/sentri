"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { api } from "@/lib/api";
import { deriveKey, decryptData, base64ToUint8 } from "@/lib/crypto";
import { useVaultStore } from "@/store/vault";
import { Suspense } from "react";

function UnlockForm() {
  const router      = useRouter();
  const params      = useSearchParams();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const setVaultKey = useVaultStore((s) => s.setVaultKey);

  const [secretKey, setSecretKey] = useState("");
  const [password,  setPassword]  = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [welcome,   setWelcome]   = useState(false);

  useEffect(() => { if (params.get("welcome") === "1") setWelcome(true); }, [params]);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded || !user) return;
    setError(""); setLoading(true);

    try {
      // Fetch encrypted vault key from Neon
      let profile: { encryptedVaultKey: string; vaultKeySalt: string; vaultKeyIv: string };
      try {
        profile = await api.profile.get() as typeof profile;
      } catch {
        throw new Error("Vault setup incomplete. Please sign out and create a new account.");
      }

      // Derive key from master password + secret key
      const salt = base64ToUint8(profile.vaultKeySalt);
      const sk   = secretKey.replace(/-/g, "").toUpperCase();
      const derivedKey = await deriveKey(password, sk, salt);

      // Verify canary
      try {
        await decryptData<{ canary: string }>(derivedKey, profile.encryptedVaultKey, profile.vaultKeyIv);
      } catch {
        throw new Error("Incorrect Master Password or Secret Key.");
      }

      setVaultKey(derivedKey);

      // Log this session
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
      <div className="text-sentri-sub text-sm">Loading…</div>
    </div>
  );

  const input  = "w-full px-4 py-2.5 rounded-xl border text-sm outline-none bg-sentri-bg";
  const iStyle = { borderColor: "#E8EDEB" };
  const focus  = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.boxShadow = "0 0 0 3px rgba(0,99,65,0.18)");
  const blur   = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.boxShadow = "none");

  return (
    <div className="min-h-screen vault-pattern flex items-center justify-center px-4 py-16"
      style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="w-full max-w-md">

        <div className="flex items-center gap-2 mb-8 justify-center animate-fade-up">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
            style={{ background: "linear-gradient(135deg, #006341, #004D32)" }}>S</div>
          <span className="text-2xl font-semibold"
            style={{ fontFamily: "'DM Serif Display', serif", color: "#006341" }}>Sentri</span>
        </div>

        <div className="bg-sentri-surface rounded-2xl border p-8 shadow-card animate-fade-up delay-1"
          style={{ borderColor: "#E8EDEB" }}>

          {welcome && (
            <div className="mb-5 px-4 py-3 rounded-xl border text-sm"
              style={{ background: "rgba(0,99,65,0.06)", borderColor: "rgba(0,99,65,0.2)", color: "#006341" }}>
              🎉 Account created! Unlock your vault to get started.
            </div>
          )}

          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-xl"
            style={{ background: "rgba(0,99,65,0.08)" }}>🔐</div>

          <h1 className="text-2xl font-normal mb-1"
            style={{ fontFamily: "'DM Serif Display', serif" }}>Unlock vault</h1>
          <p className="text-sm text-sentri-sub mb-1">
            Signed in as <span className="font-medium text-sentri-text">{user?.primaryEmailAddress?.emailAddress}</span>
          </p>
          <p className="text-xs text-sentri-sub mb-6">Enter your credentials to decrypt your vault locally.</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl border text-sm"
              style={{ background: "#FFF1F0", borderColor: "#FECAC7", color: "#D93025" }}>
              {error}
              {error.includes("Vault setup incomplete") && (
                <button
                  onClick={() => signOut({ redirectUrl: "/signup" })}
                  className="block mt-2 underline font-medium"
                  style={{ color: "#D93025" }}>
                  Sign out and create a new account →
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleUnlock} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-sentri-sub mb-1.5">Master Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Your master password" className={input} style={iStyle} onFocus={focus} onBlur={blur} />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-sentri-sub mb-1.5">Secret Key</label>
              <input type="text" required value={secretKey} onChange={(e) => setSecretKey(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                className={input}
                style={{ ...iStyle, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.05em" }}
                onFocus={focus} onBlur={blur} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-60 mt-2"
              style={{ background: "linear-gradient(135deg, #006341, #004D32)" }}>
              {loading ? "Decrypting vault…" : "Unlock Vault"}
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
        <div className="text-sentri-sub text-sm">Loading…</div>
      </div>
    }>
      <UnlockForm />
    </Suspense>
  );
}
