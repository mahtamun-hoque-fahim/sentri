"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSignIn, useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";

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

  const inputBase = "w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all font-mono";
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

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8 justify-center animate-fade-up">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
            style={{ background: "linear-gradient(135deg, #4F6EF7, #3A56D4)", color: "var(--bg)" }}>S</div>
          <span className="text-2xl font-bold" style={{ color: "var(--accent)", fontFamily: "Geist" }}>Sentri</span>
        </div>

        <div className="rounded-2xl border p-8 animate-fade-up delay-1"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>

          {welcome && (
            <div className="mb-5 px-4 py-3 rounded-xl border text-sm flex items-center gap-2"
              style={{ background: "var(--accent-dim)", borderColor: "rgba(0,255,148,0.0.25)", color: "var(--accent)" }}>
              <CheckCircle size={15} />
              Vault created! Sign in to continue.
            </div>
          )}

          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>Sign in</h1>
          <p className="text-sm mb-6" style={{ color: "var(--sub)" }}>You&apos;ll enter your Secret Key on the next step.</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl border text-sm"
              style={{ background: "rgba(240,81,106,0.08)", borderColor: "rgba(240,81,106,0.25)", color: "var(--danger)" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5 font-mono" style={{ color: "var(--sub)" }}>Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" className={inputBase} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
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
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold mt-2 flex items-center justify-center gap-2 transition-all  disabled:opacity-40 btn-accent">
              {loading ? "Signing in…" : (<>Continue <ArrowRight size={14} /></>)}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: "var(--sub)" }}>
            No vault yet?{" "}
            <Link href="/signup" className="font-bold" style={{ color: "var(--accent)" }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
