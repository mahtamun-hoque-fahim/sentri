"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSignUp, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { generateSecretKey, generateSalt, deriveKey, encryptData, uint8ToBase64 } from "@/lib/crypto";
import { Eye, EyeOff, ArrowRight, Copy, Check, Mail, Key } from "lucide-react";
import { SentriLogo } from "@/components/ui/SentriLogo";

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
          sessionId, email,
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

          {/* Step 1: Register */}
          {step === "form" && (
            <>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Create your vault</h1>
              <p style={{ fontSize: 13, color: "var(--sub)", marginBottom: 24 }}>One master password. Everything encrypted.</p>

              {error && (
                <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: "rgba(240,81,106,0.08)", border: "1px solid rgba(240,81,106,0.25)", color: "var(--danger)", fontSize: 13 }}>{error}</div>
              )}

              <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </div>
                <div>
                  <label style={labelStyle}>Master Password</label>
                  <div style={{ position: "relative" }}>
                    <input type={showPw ? "text" : "password"} required minLength={10} value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 10 characters"
                      style={{ ...inputStyle, paddingRight: 40 }} onFocus={onFocus} onBlur={onBlur} />
                    <button type="button" onClick={() => setShowPw(s => !s)} tabIndex={-1}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--sub)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Confirm Password</label>
                  <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat master password" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </div>
                <button type="submit" disabled={loading} className="btn-accent"
                  style={{ width: "100%", padding: "11px 0", borderRadius: 10, fontSize: 13, fontWeight: 700, marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1, border: "none", transition: "opacity 0.15s" }}>
                  {loading ? "Creating account…" : (<>Continue <ArrowRight size={14} /></>)}
                </button>
              </form>

              <p style={{ textAlign: "center", fontSize: 13, marginTop: 20, color: "var(--sub)" }}>
                Already have a vault?{" "}
                <Link href="/signin" style={{ color: "var(--accent)", fontWeight: 600 }}>Sign in</Link>
              </p>
            </>
          )}

          {/* Step 2: Verify Email */}
          {step === "verify" && (
            <>
              <div style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.15)" }}>
                <Mail size={20} style={{ color: "var(--accent)" }} />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Check your email</h1>
              <p style={{ fontSize: 13, color: "var(--sub)", marginBottom: 24 }}>
                We sent a 6-digit code to <span style={{ fontFamily: "var(--font-mono)", color: "var(--text2)" }}>{email}</span>
              </p>

              {error && (
                <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: "rgba(240,81,106,0.08)", border: "1px solid rgba(240,81,106,0.25)", color: "var(--danger)", fontSize: 13 }}>{error}</div>
              )}

              <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Verification Code</label>
                  <input type="text" required value={code} onChange={(e) => setCode(e.target.value)}
                    placeholder="123456" maxLength={6}
                    style={{ ...inputStyle, textAlign: "center", fontSize: 22, letterSpacing: "0.3em" }}
                    onFocus={onFocus} onBlur={onBlur} />
                </div>
                <button type="submit" disabled={loading} className="btn-accent"
                  style={{ width: "100%", padding: "11px 0", borderRadius: 10, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1, border: "none", transition: "opacity 0.15s" }}>
                  {loading ? "Verifying…" : (<>Verify Email <ArrowRight size={14} /></>)}
                </button>
              </form>
            </>
          )}

          {/* Step 3: Secret Key Reveal */}
          {step === "key-reveal" && (
            <>
              <div style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, background: "var(--accent-dim)", border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)" }}>
                <Key size={20} style={{ color: "var(--accent)" }} />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Your Secret Key</h1>
              <p style={{ fontSize: 13, color: "var(--sub)", marginBottom: 24, lineHeight: 1.6 }}>
                Shown <strong style={{ color: "var(--text)" }}>only once</strong>. Store it safely — without it, your vault cannot be recovered.
              </p>

              <div style={{ borderRadius: 10, padding: "16px", marginBottom: 16, background: "var(--accent-dim)", border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)" }}>
                <p style={{ textAlign: "center", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--accent)", letterSpacing: "0.08em", wordBreak: "break-all", userSelect: "all" }}>
                  {secretKey}
                </p>
              </div>

              <button onClick={copyKey}
                style={{ width: "100%", padding: "9px 0", borderRadius: 10, fontSize: 13, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", border: `1px solid ${copied ? "color-mix(in srgb, var(--accent) 40%, transparent)" : "var(--border)"}`, color: copied ? "var(--accent)" : "var(--text)", background: copied ? "var(--accent-dim)" : "var(--surface2)", transition: "all 0.15s" }}>
                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Secret Key</>}
              </button>

              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 20 }}>
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                  style={{ marginTop: 2, width: 14, height: 14, accentColor: "var(--accent)", flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "var(--sub)", lineHeight: 1.5 }}>
                  I have saved my Secret Key. I understand it cannot be recovered if lost.
                </span>
              </label>

              {error && (
                <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: "rgba(240,81,106,0.08)", border: "1px solid rgba(240,81,106,0.25)", color: "var(--danger)", fontSize: 13 }}>{error}</div>
              )}

              <button onClick={handleConfirm} disabled={loading || !agreed} className="btn-accent"
                style={{ width: "100%", padding: "11px 0", borderRadius: 10, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: (loading || !agreed) ? "not-allowed" : "pointer", opacity: (loading || !agreed) ? 0.5 : 1, border: "none", transition: "opacity 0.15s" }}>
                {loading ? "Setting up vault…" : (<>Create my vault <ArrowRight size={14} /></>)}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
