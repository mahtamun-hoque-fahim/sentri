"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSignIn, useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";
import { SentriLogo } from "@/components/ui/SentriLogo";

export default function SigninForm() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn } = useAuth();
  const router  = useRouter();
  const params  = useSearchParams();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [welcome,  setWelcome]  = useState(false);

  useEffect(() => { if (isSignedIn) router.replace("/unlock"); }, [isSignedIn, router]);
  useEffect(() => { if (params.get("welcome") === "1") setWelcome(true); }, [params]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;
    setError(""); setLoading(true);
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status !== "complete") throw new Error("Sign-in incomplete.");
      await setActive({ session: result.createdSessionId });
      router.push("/unlock");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid email or password.");
    } finally { setLoading(false); }
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

          {/* Logo — inside card, safe from browser overlays */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
            <SentriLogo height={28} />
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Sign in</h1>
          <p style={{ fontSize: 13, color: "var(--sub)", marginBottom: 24 }}>
            You&apos;ll enter your Secret Key on the next step.
          </p>

          {welcome && (
            <div style={{ marginBottom: 20, padding: "10px 14px", borderRadius: 10, background: "var(--accent-dim)", border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)", color: "var(--accent)", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle size={14} /> Vault created! Sign in to continue.
            </div>
          )}

          {error && (
            <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: "rgba(240,81,106,0.08)", border: "1px solid rgba(240,81,106,0.25)", color: "var(--danger)", fontSize: 13 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
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
            <button type="submit" disabled={loading} className="btn-accent"
              style={{ width: "100%", padding: "11px 0", borderRadius: 10, fontSize: 13, fontWeight: 700, marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1, border: "none", transition: "opacity 0.15s" }}>
              {loading ? "Signing in…" : (<>Continue <ArrowRight size={14} /></>)}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: 13, marginTop: 20, color: "var(--sub)" }}>
            No vault yet?{" "}
            <Link href="/signup" style={{ color: "var(--accent)", fontWeight: 600 }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
