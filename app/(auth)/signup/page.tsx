"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { generateSecretKey, generateSalt, deriveKey, encryptData, uint8ToBase64 } from "@/lib/crypto";

type Step = "form" | "key-reveal" | "confirming";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 10) { setError("Master password must be at least 10 characters."); return; }

    setLoading(true);
    try {
      const sk = generateSecretKey();
      setSecretKey(sk);
      setStep("key-reveal");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!agreed) { setError("Please confirm you have saved your Secret Key."); return; }
    setLoading(true);
    setStep("confirming");
    setError("");

    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create account.");

      // Derive encryption key from master password + secret key
      const salt = generateSalt();
      const vaultKey = await deriveKey(password, secretKey, salt);

      // Encrypt a "canary" to verify key on future logins
      const { ciphertext, iv } = await encryptData(vaultKey, { canary: "sentri-ok" });

      // Store profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        email,
        secret_key_hint: secretKey.slice(-4),
        encrypted_vault_key: ciphertext,
        vault_key_salt: uint8ToBase64(salt),
        vault_key_iv: iv,
      });

      if (profileError) throw profileError;

      // Create default personal vault
      await supabase.from("vaults").insert({
        owner_id: authData.user.id,
        name: "Personal",
        vault_type: "personal",
      });

      router.push("/signin?welcome=1");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      setStep("key-reveal");
    } finally {
      setLoading(false);
    }
  }

  function copyKey() {
    navigator.clipboard.writeText(secretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="min-h-screen vault-pattern flex items-center justify-center px-4 py-16"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 justify-center animate-fade-up">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
            style={{ background: "linear-gradient(135deg, #006341, #004D32)" }}
          >
            S
          </div>
          <span
            className="text-2xl font-semibold"
            style={{ fontFamily: "'DM Serif Display', serif", color: "#006341" }}
          >
            Sentri
          </span>
        </div>

        <div
          className="bg-sentri-surface rounded-2xl border p-8 shadow-card animate-fade-up delay-1"
          style={{ borderColor: "#E8EDEB" }}
        >
          {step === "form" && (
            <>
              <h1
                className="text-2xl font-normal mb-1"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                Create your vault
              </h1>
              <p className="text-sm text-sentri-sub mb-6">
                One master password. Everything encrypted.
              </p>

              {error && (
                <div
                  className="mb-4 px-4 py-3 rounded-xl text-sm border"
                  style={{ background: "#FFF1F0", borderColor: "#FECAC7", color: "#D93025" }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium text-sentri-sub mb-1.5 uppercase tracking-wide">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-shadow"
                    style={{ borderColor: "#E8EDEB", background: "#F7F9F8" }}
                    onFocus={(e) => (e.target.style.boxShadow = "0 0 0 3px rgba(0,99,65,0.18)")}
                    onBlur={(e) => (e.target.style.boxShadow = "none")}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-sentri-sub mb-1.5 uppercase tracking-wide">Master Password</label>
                  <input
                    type="password"
                    required
                    minLength={10}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 10 characters"
                    className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-shadow"
                    style={{ borderColor: "#E8EDEB", background: "#F7F9F8" }}
                    onFocus={(e) => (e.target.style.boxShadow = "0 0 0 3px rgba(0,99,65,0.18)")}
                    onBlur={(e) => (e.target.style.boxShadow = "none")}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-sentri-sub mb-1.5 uppercase tracking-wide">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat master password"
                    className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-shadow"
                    style={{ borderColor: "#E8EDEB", background: "#F7F9F8" }}
                    onFocus={(e) => (e.target.style.boxShadow = "0 0 0 3px rgba(0,99,65,0.18)")}
                    onBlur={(e) => (e.target.style.boxShadow = "none")}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 mt-2"
                  style={{ background: "linear-gradient(135deg, #006341, #004D32)" }}
                >
                  {loading ? "Preparing vault..." : "Continue"}
                </button>
              </form>

              <p className="text-center text-sm text-sentri-sub mt-6">
                Already have a vault?{" "}
                <Link href="/signin" className="font-medium" style={{ color: "#006341" }}>
                  Sign in
                </Link>
              </p>
            </>
          )}

          {(step === "key-reveal" || step === "confirming") && (
            <>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-xl"
                style={{ background: "rgba(0,99,65,0.08)" }}
              >
                🔑
              </div>
              <h1
                className="text-2xl font-normal mb-2"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                Your Secret Key
              </h1>
              <p className="text-sm text-sentri-sub mb-6 leading-relaxed">
                This key is shown <strong>only once</strong>. Store it somewhere safe — without it,
                you cannot recover your vault. Not even us.
              </p>

              {/* Secret Key display */}
              <div
                className="rounded-xl p-4 mb-5 border"
                style={{ background: "#F7F9F8", borderColor: "#E8EDEB" }}
              >
                <p
                  className="text-center text-base font-medium tracking-widest select-all"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: "#006341", letterSpacing: "0.1em" }}
                >
                  {secretKey}
                </p>
              </div>

              <button
                onClick={copyKey}
                className="w-full py-2.5 rounded-xl text-sm font-medium border mb-5 transition-colors"
                style={{
                  borderColor: copied ? "#006341" : "#E8EDEB",
                  color: copied ? "#006341" : "#1A1F1E",
                  background: copied ? "rgba(0,99,65,0.06)" : "transparent",
                }}
              >
                {copied ? "✓ Copied!" : "Copy Secret Key"}
              </button>

              <label className="flex items-start gap-3 cursor-pointer mb-6">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-sentri-primary"
                />
                <span className="text-sm text-sentri-sub leading-relaxed">
                  I have saved my Secret Key in a safe place. I understand it cannot be recovered if lost.
                </span>
              </label>

              {error && (
                <div
                  className="mb-4 px-4 py-3 rounded-xl text-sm border"
                  style={{ background: "#FFF1F0", borderColor: "#FECAC7", color: "#D93025" }}
                >
                  {error}
                </div>
              )}

              <button
                onClick={handleConfirm}
                disabled={loading || !agreed}
                className="w-full py-3 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #006341, #004D32)" }}
              >
                {loading ? "Creating vault…" : "I've saved it — Create my vault"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
