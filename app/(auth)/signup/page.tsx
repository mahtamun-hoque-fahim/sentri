"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSignUp, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { generateSecretKey, generateSalt, deriveKey, encryptData, uint8ToBase64 } from "@/lib/crypto";
import { api } from "@/lib/api";

type Step = "form" | "verify" | "key-reveal" | "done";

export default function SignupPage() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { isSignedIn } = useAuth();
  const router  = useRouter();

  // Already signed in → go to unlock
  useEffect(() => {
    if (isSignedIn) router.replace("/unlock");
  }, [isSignedIn, router]);

  const [step,      setStep]      = useState<Step>("form");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [code,      setCode]      = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [agreed,    setAgreed]    = useState(false);
  const [copied,    setCopied]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  // Step 1 — register with Clerk
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 10) { setError("Master password must be at least 10 characters."); return; }
    setError(""); setLoading(true);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Signup failed.");
    } finally { setLoading(false); }
  }

  // Step 2 — verify email OTP
  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;
    setError(""); setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status !== "complete") throw new Error("Verification incomplete.");
      // Generate Secret Key now
      const sk = generateSecretKey();
      setSecretKey(sk);
      setStep("key-reveal");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid code.");
    } finally { setLoading(false); }
  }

  // Step 3 — save vault key + activate session
  async function handleConfirm() {
    if (!agreed) { setError("Please confirm you have saved your Secret Key."); return; }
    if (!isLoaded) return;
    setError(""); setLoading(true);
    try {
      // Derive vault key and encrypt canary
      const salt     = generateSalt();
      const vaultKey = await deriveKey(password, secretKey, salt);
      const { ciphertext, iv } = await encryptData(vaultKey, { canary: "sentri-ok" });

      // Activate Clerk session
      await setActive({ session: signUp.createdSessionId });

      // Force a fresh token with skipCache: true — this is the official Clerk
      // pattern to ensure the session token is fully minted and available
      // immediately, before the session cookie propagates in the browser.
      // window.Clerk.session is updated synchronously after setActive resolves.
      const clerkSession = (window as unknown as { Clerk?: { session?: { getToken: (opts?: { skipCache?: boolean }) => Promise<string | null> } } }).Clerk?.session;
      const token = clerkSession ? await clerkSession.getToken({ skipCache: true }) : null;

      if (!token) throw new Error("Could not get session token. Please try again.");

      // Save profile using Bearer token — bypasses session cookie timing issue
      const profileRes = await fetch("/api/auth/complete-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          secretKeyHint:     secretKey.slice(-4),
          encryptedVaultKey: ciphertext,
          vaultKeySalt:      uint8ToBase64(salt),
          vaultKeyIv:        iv,
        }),
      });

      if (!profileRes.ok) {
        const errData = await profileRes.json().catch(() => ({ error: "Profile creation failed" }));
        throw new Error(errData.error ?? "Profile creation failed");
      }

      router.push("/unlock?welcome=1");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setLoading(false); }
  }

  function copyKey() {
    navigator.clipboard.writeText(secretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const input = "w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-shadow bg-sentri-bg";
  const iStyle = { borderColor: "#E8EDEB" };
  const focus  = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.boxShadow = "0 0 0 3px rgba(0,99,65,0.18)");
  const blur   = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.boxShadow = "none");

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

          {/* ── Step 1: Register ── */}
          {step === "form" && (
            <>
              <h1 className="text-2xl font-normal mb-1"
                style={{ fontFamily: "'DM Serif Display', serif" }}>Create your vault</h1>
              <p className="text-sm text-sentri-sub mb-6">One master password. Everything encrypted.</p>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl border text-sm"
                  style={{ background: "#FFF1F0", borderColor: "#FECAC7", color: "#D93025" }}>{error}</div>
              )}

              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-widest text-sentri-sub mb-1.5">Email</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" className={input} style={iStyle} onFocus={focus} onBlur={blur} />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-widest text-sentri-sub mb-1.5">Master Password</label>
                  <input type="password" required minLength={10} value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 10 characters" className={input} style={iStyle} onFocus={focus} onBlur={blur} />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-widest text-sentri-sub mb-1.5">Confirm Password</label>
                  <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat master password" className={input} style={iStyle} onFocus={focus} onBlur={blur} />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 disabled:opacity-60 mt-2"
                  style={{ background: "linear-gradient(135deg, #006341, #004D32)" }}>
                  {loading ? "Creating account…" : "Continue"}
                </button>
              </form>
              <p className="text-center text-sm text-sentri-sub mt-6">
                Already have a vault?{" "}
                <Link href="/signin" className="font-medium" style={{ color: "#006341" }}>Sign in</Link>
              </p>
            </>
          )}

          {/* ── Step 2: Verify Email ── */}
          {step === "verify" && (
            <>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-xl"
                style={{ background: "rgba(0,99,65,0.08)" }}>📧</div>
              <h1 className="text-2xl font-normal mb-2"
                style={{ fontFamily: "'DM Serif Display', serif" }}>Check your email</h1>
              <p className="text-sm text-sentri-sub mb-6">
                We sent a 6-digit code to <strong>{email}</strong>
              </p>
              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl border text-sm"
                  style={{ background: "#FFF1F0", borderColor: "#FECAC7", color: "#D93025" }}>{error}</div>
              )}
              <form onSubmit={handleVerify} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-widest text-sentri-sub mb-1.5">Verification Code</label>
                  <input type="text" required value={code} onChange={(e) => setCode(e.target.value)}
                    placeholder="123456" maxLength={6}
                    className={input} style={{ ...iStyle, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.2em", textAlign: "center", fontSize: "1.2rem" }}
                    onFocus={focus} onBlur={blur} />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #006341, #004D32)" }}>
                  {loading ? "Verifying…" : "Verify Email"}
                </button>
              </form>
            </>
          )}

          {/* ── Step 3: Secret Key Reveal ── */}
          {step === "key-reveal" && (
            <>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-xl"
                style={{ background: "rgba(0,99,65,0.08)" }}>🔑</div>
              <h1 className="text-2xl font-normal mb-2"
                style={{ fontFamily: "'DM Serif Display', serif" }}>Your Secret Key</h1>
              <p className="text-sm text-sentri-sub mb-6 leading-relaxed">
                Shown <strong>only once</strong>. Store it safely — without it, your vault cannot be recovered.
              </p>
              <div className="rounded-xl p-4 mb-5 border" style={{ background: "#F7F9F8", borderColor: "#E8EDEB" }}>
                <p className="text-center text-base font-medium tracking-widest select-all"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: "#006341", letterSpacing: "0.1em" }}>
                  {secretKey}
                </p>
              </div>
              <button onClick={copyKey}
                className="w-full py-2.5 rounded-xl text-sm font-medium border mb-5 transition-colors"
                style={{
                  borderColor: copied ? "#006341" : "#E8EDEB",
                  color:       copied ? "#006341" : "#1A1F1E",
                  background:  copied ? "rgba(0,99,65,0.06)" : "transparent",
                }}>
                {copied ? "✓ Copied!" : "Copy Secret Key"}
              </button>
              <label className="flex items-start gap-3 cursor-pointer mb-6">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-sentri-primary" />
                <span className="text-sm text-sentri-sub leading-relaxed">
                  I have saved my Secret Key. I understand it cannot be recovered if lost.
                </span>
              </label>
              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl border text-sm"
                  style={{ background: "#FFF1F0", borderColor: "#FECAC7", color: "#D93025" }}>{error}</div>
              )}
              <button onClick={handleConfirm} disabled={loading || !agreed}
                className="w-full py-3 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #006341, #004D32)" }}>
                {loading ? "Setting up vault…" : "I've saved it — Create my vault"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
