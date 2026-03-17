"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { deriveKey, decryptData, base64ToUint8 } from "@/lib/crypto";
import { useVaultStore } from "@/store/vault";

export default function SigninForm() {
  const router      = useRouter();
  const params      = useSearchParams();
  const setVaultKey = useVaultStore((s) => s.setVaultKey);
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [welcome,   setWelcome]   = useState(false);

  useEffect(() => {
    if (params.get("welcome") === "1") setWelcome(true);
  }, [params]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();

      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw new Error("Invalid email or password.");
      if (!data.user) throw new Error("Login failed.");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();
      if (profileError || !profile) throw new Error("Could not load vault profile.");

      const salt = base64ToUint8(profile.vault_key_salt);
      const sk   = secretKey.replace(/-/g, "").toUpperCase();
      const derivedKey = await deriveKey(password, sk, salt);

      try {
        await decryptData<{ canary: string }>(derivedKey, profile.encrypted_vault_key, profile.vault_key_iv);
      } catch {
        throw new Error("Incorrect Secret Key. Please check and try again.");
      }

      setVaultKey(derivedKey);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  const inputBase  = "w-full px-4 py-2.5 rounded-xl border text-sm outline-none bg-sentri-bg";
  const inputStyle = { borderColor: "#E8EDEB" };
  const onFocus    = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.boxShadow = "0 0 0 3px rgba(0,99,65,0.18)");
  const onBlur     = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.boxShadow = "none");

  return (
    <div className="min-h-screen vault-pattern flex items-center justify-center px-4 py-16"
      style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 justify-center animate-fade-up">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
            style={{ background: "linear-gradient(135deg, #006341, #004D32)" }}>S</div>
          <span className="text-2xl font-semibold"
            style={{ fontFamily: "'DM Serif Display', serif", color: "#006341" }}>Sentri</span>
        </div>

        <div className="bg-sentri-surface rounded-2xl border p-8 shadow-card animate-fade-up delay-1"
          style={{ borderColor: "#E8EDEB" }}>

          {welcome && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm border"
              style={{ background: "rgba(0,99,65,0.06)", borderColor: "rgba(0,99,65,0.2)", color: "#006341" }}>
              🎉 Vault created! Sign in with your Secret Key.
            </div>
          )}

          <h1 className="text-2xl font-normal mb-1"
            style={{ fontFamily: "'DM Serif Display', serif" }}>Unlock your vault</h1>
          <p className="text-sm text-sentri-sub mb-6">Enter your credentials to decrypt.</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm border"
              style={{ background: "#FFF1F0", borderColor: "#FECAC7", color: "#D93025" }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-sentri-sub mb-1.5">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" className={inputBase} style={inputStyle}
                onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-sentri-sub mb-1.5">Master Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Your master password" className={inputBase} style={inputStyle}
                onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-sentri-sub mb-1.5">Secret Key</label>
              <input type="text" required value={secretKey} onChange={(e) => setSecretKey(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                className={inputBase} style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em" }}
                onFocus={onFocus} onBlur={onBlur} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 mt-2"
              style={{ background: "linear-gradient(135deg, #006341, #004D32)" }}>
              {loading ? "Unlocking vault…" : "Unlock Vault"}
            </button>
          </form>

          <p className="text-center text-sm text-sentri-sub mt-6">
            No vault yet?{" "}
            <Link href="/signup" className="font-medium" style={{ color: "#006341" }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
