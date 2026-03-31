"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSignUp, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { generateSecretKey, generateSalt, deriveKey, encryptData, uint8ToBase64 } from "@/lib/crypto";
import { Eye, EyeOff, ArrowRight, Copy, Check, Mail, Key } from "lucide-react";

type Step = "form" | "verify" | "key-reveal" | "done";

export default function SignupPage() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => { if (isSignedIn) router.replace("/unlock"); }, [isSignedIn, router]);

  const [step,      setStep]      = useState<Step>("form");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [code,      setCode]      = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [agreed,    setAgreed]    = useState(false);
  const [copied,    setCopied]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

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

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;
    setError(""); setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status !== "complete") throw new Error("Verification incomplete.");
      setSessionId(result.createdSessionId);
      const sk = generateSecretKey();
      setSecretKey(sk);
      setStep("key-reveal");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid code.");
    } finally { setLoading(false); }
  }

  async function handleConfirm() {
    if (!agreed) { setError("Please confirm you have saved your Secret Key."); return; }
    if (!isLoaded) return;
    if (!sessionId) throw new Error("Missing sessionId. Please try signing up again.");
    setError(""); setLoading(true);
    try {
      const salt     = generateSalt();
      const vaultKey = await deriveKey(password, secretKey.replace(/-/g, "").toUpperCase(), salt);
      const { ciphertext, iv } = await encryptData(vaultKey, { canary: "sentri-ok" });

      const profileRes = await fetch("/api/auth/complete-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
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

      await setActive({ session: sessionId });
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
          <span className="text-2xl font-bold" style={{ color: "var(--accent)", fontFamily: "Geist" }}>Sentri</span>
        </div>

        <div className="rounded-2xl border p-8 animate-fade-up delay-1"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>

          {/* Step 1: Register */}
          {step === "form" && (
            <>
              <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>Create your vault</h1>
              <p className="text-sm mb-6" style={{ color: "var(--sub)" }}>One master password. Everything encrypted.</p>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl border text-sm"
                  style={{ background: "rgba(240,81,106,0.08)", borderColor: "rgba(240,81,106,0.25)", color: "var(--danger)" }}>{error}</div>
              )}

              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1.5 font-mono" style={{ color: "var(--sub)" }}>Email</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" className={inputBase} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1.5 font-mono" style={{ color: "var(--sub)" }}>Master Password</label>
                  <div className="relative">
                    <input type={showPw ? "text" : "password"} required minLength={10} value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 10 characters" className={inputBase + " pr-10"} style={inputStyle}
                      onFocus={onFocus} onBlur={onBlur} />
                    <button type="button" onClick={() => setShowPw(s => !s)} tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--sub)" }}>
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1.5 font-mono" style={{ color: "var(--sub)" }}>Confirm Password</label>
                  <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat master password" className={inputBase} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-bold mt-2 flex items-center justify-center gap-2 transition-all  disabled:opacity-40 btn-accent">
                  {loading ? "Creating account…" : (<>Continue <ArrowRight size={14} /></>)}
                </button>
              </form>
              <p className="text-center text-sm mt-6" style={{ color: "var(--sub)" }}>
                Already have a vault?{" "}
                <Link href="/signin" className="font-bold" style={{ color: "var(--accent)" }}>Sign in</Link>
              </p>
            </>
          )}

          {/* Step 2: Verify Email */}
          {step === "verify" && (
            <>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.15)" }}>
                <Mail size={22} style={{ color: "var(--accent)" }} />
              </div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>Check your email</h1>
              <p className="text-sm mb-6" style={{ color: "var(--sub)" }}>
                We sent a 6-digit code to <span className="font-mono" style={{ color: "var(--text)" }}>{email}</span>
              </p>
              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl border text-sm"
                  style={{ background: "rgba(240,81,106,0.08)", borderColor: "rgba(240,81,106,0.25)", color: "var(--danger)" }}>{error}</div>
              )}
              <form onSubmit={handleVerify} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1.5 font-mono" style={{ color: "var(--sub)" }}>Verification Code</label>
                  <input type="text" required value={code} onChange={(e) => setCode(e.target.value)}
                    placeholder="123456" maxLength={6}
                    className={inputBase + " font-mono text-center text-2xl tracking-widest"}
                    style={{ ...inputStyle, letterSpacing: "0.3em" }}
                    onFocus={onFocus} onBlur={onBlur} />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all  disabled:opacity-40 btn-accent">
                  {loading ? "Verifying…" : (<>Verify Email <ArrowRight size={14} /></>)}
                </button>
              </form>
            </>
          )}

          {/* Step 3: Secret Key Reveal */}
          {step === "key-reveal" && (
            <>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "var(--accent-dim)", border: "1px solid rgba(79,110,247,0.15)" }}>
                <Key size={22} style={{ color: "var(--accent)" }} />
              </div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>Your Secret Key</h1>
              <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--sub)" }}>
                Shown <strong style={{ color: "var(--text)" }}>only once</strong>. Store it safely — without it, your vault cannot be recovered.
              </p>

              <div className="rounded-xl p-4 mb-5 border"
                style={{ background: "var(--accent-dim)", borderColor: "rgba(0,255,148,0.0.25)" }}>
                <p className="text-center text-sm font-bold select-all font-mono "
                  style={{ color: "var(--accent)", letterSpacing: "0.08em", wordBreak: "break-all" }}>
                  {secretKey}
                </p>
              </div>

              <button onClick={copyKey}
                className="w-full py-2.5 rounded-xl text-sm font-bold border mb-5 transition-all flex items-center justify-center gap-2"
                style={{
                  borderColor: copied ? "rgba(79,110,247,0.5)" : "var(--border)",
                  color:       copied ? "var(--accent)" : "var(--text)",
                  background:  copied ? "var(--accent-dim)" : "var(--surface2)",
                }}>
                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Secret Key</>}
              </button>

              <label className="flex items-start gap-3 cursor-pointer mb-6">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded" style={{ accentColor: "var(--accent)" }} />
                <span className="text-sm leading-relaxed" style={{ color: "var(--sub)" }}>
                  I have saved my Secret Key. I understand it cannot be recovered if lost.
                </span>
              </label>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl border text-sm"
                  style={{ background: "rgba(240,81,106,0.08)", borderColor: "rgba(240,81,106,0.25)", color: "var(--danger)" }}>{error}</div>
              )}

              <button onClick={handleConfirm} disabled={loading || !agreed}
                className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all  disabled:opacity-40 btn-accent">
                {loading ? "Setting up vault…" : (<>Create my vault <ArrowRight size={14} /></>)}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
