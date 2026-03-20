"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSignIn, useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";

export default function SigninForm() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn }  = useAuth();
  const router  = useRouter();
  const params  = useSearchParams();

  const [email,   setEmail]   = useState("");
  const [password,setPassword]= useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [welcome, setWelcome] = useState(false);

  // Already signed in → go straight to unlock
  useEffect(() => {
    if (isSignedIn) router.replace("/unlock");
  }, [isSignedIn, router]);

  useEffect(() => { if (params.get("welcome") === "1") setWelcome(true); }, [params]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;
    setError(""); setLoading(true);
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status !== "complete") throw new Error("Sign-in incomplete.");
      await setActive({ session: result.createdSessionId });
      // Redirect to unlock page to enter Secret Key
      router.push("/unlock");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid email or password.");
    } finally { setLoading(false); }
  }

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
              🎉 Vault created! Sign in to continue.
            </div>
          )}

          <h1 className="text-2xl font-normal mb-1"
            style={{ fontFamily: "'DM Serif Display', serif" }}>Sign in</h1>
          <p className="text-sm text-sentri-sub mb-6">You&apos;ll enter your Secret Key on the next step.</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl border text-sm"
              style={{ background: "#FFF1F0", borderColor: "#FECAC7", color: "#D93025" }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-sentri-sub mb-1.5">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" className={input} style={iStyle} onFocus={focus} onBlur={blur} />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-sentri-sub mb-1.5">Master Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Your master password" className={input} style={iStyle} onFocus={focus} onBlur={blur} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-60 mt-2"
              style={{ background: "linear-gradient(135deg, #006341, #004D32)" }}>
              {loading ? "Signing in…" : "Continue →"}
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
