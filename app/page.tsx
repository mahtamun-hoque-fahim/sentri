"use client";

import Link from "next/link";
import { Shield, Zap, Eye, Lock, Key, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen vault-pattern flex flex-col" style={{ fontFamily: "Space Grotesk, sans-serif" }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b sticky top-0 z-50 backdrop-blur-md"
        style={{ background: "rgba(8,11,18,0.9)", borderColor: "#1E2535" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
            style={{ background: "linear-gradient(135deg, #00FF94, #00CC77)", color: "#080B12" }}>S</div>
          <span className="text-lg font-bold tracking-tight" style={{ color: "#00FF94" }}>Sentri</span>
          <span className="text-xs px-1.5 py-0.5 rounded font-mono ml-1"
            style={{ background: "rgba(0,255,148,0.1)", color: "#00FF94", border: "1px solid rgba(0,255,148,0.2)" }}>
            v1.0
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/signin"
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ color: "#8892A4" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#E8EDF5")}
            onMouseLeave={e => (e.currentTarget.style.color = "#8892A4")}>
            Sign in
          </Link>
          <Link href="/signup"
            className="text-sm font-bold px-4 py-2 rounded-lg transition-all hover:shadow-neon active:scale-95 btn-neon">
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center relative overflow-hidden">

        {/* Background glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(0,255,148,0.04) 0%, transparent 70%)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(123,97,255,0.04) 0%, transparent 70%)" }} />

        <div className="animate-fade-up max-w-3xl relative z-10">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold mb-8 border"
            style={{ background: "rgba(0,255,148,0.06)", borderColor: "rgba(0,255,148,0.2)", color: "#00FF94" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse-glow" style={{ background: "#00FF94" }} />
            ZERO-KNOWLEDGE ENCRYPTION — WE NEVER SEE YOUR DATA
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6"
            style={{ letterSpacing: "-0.03em", color: "#E8EDF5" }}>
            One vault for{" "}
            <span className="text-glow" style={{ color: "#00FF94" }}>everything</span>
            <br />
            you need to protect.
          </h1>

          <p className="text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed" style={{ color: "#8892A4" }}>
            Sentri is a private, encrypted password manager built for your trusted circle.
            Passwords, cards, keys — all secured with AES-256-GCM.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:shadow-neon active:scale-95 btn-neon">
              Create your vault
              <ArrowRight size={15} strokeWidth={2.5} />
            </Link>
            <Link href="/signin"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border transition-all"
              style={{ borderColor: "#2A3244", color: "#E8EDF5", background: "#161B27" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(0,255,148,0.3)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "#2A3244")}>
              Sign in to vault
            </Link>
          </div>
        </div>

        {/* Feature grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full animate-fade-up delay-3 relative z-10">
          {[
            { icon: Lock,   color: "#00FF94", title: "Zero-Knowledge",  desc: "Your master password never leaves your device. AES-256-GCM encryption." },
            { icon: Zap,    color: "#00D4FF", title: "Instant Autofill", desc: "Fill logins in one click across all your sites with the browser extension." },
            { icon: Shield, color: "#7B61FF", title: "Watchtower",       desc: "Get alerted on breached or weak passwords using HIBP database." },
          ].map((f) => (
            <div key={f.title}
              className="flex flex-col items-start gap-4 p-6 rounded-2xl border text-left web3-card"
              style={{ background: "#0F1117", borderColor: "#1E2535" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${f.color}12`, border: `1px solid ${f.color}22` }}>
                <f.icon size={18} style={{ color: f.color }} />
              </div>
              <div>
                <p className="font-bold text-sm mb-1" style={{ color: "#E8EDF5" }}>{f.title}</p>
                <p className="text-sm leading-relaxed" style={{ color: "#8892A4" }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Security stats */}
        <div className="mt-16 flex items-center gap-8 flex-wrap justify-center animate-fade-up delay-4">
          {[
            { label: "AES-256-GCM", sub: "Encryption" },
            { label: "600K", sub: "PBKDF2 Iterations" },
            { label: "0 bytes", sub: "Sent to server" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-bold font-mono text-glow" style={{ color: "#00FF94" }}>{s.label}</p>
              <p className="text-xs mt-1 font-mono uppercase tracking-widest" style={{ color: "#8892A4" }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t px-8 py-5 flex items-center justify-between text-xs font-mono"
        style={{ borderColor: "#1E2535", color: "#2A3244" }}>
        <span>© 2026 Sentri. All rights reserved.</span>
        <div className="flex items-center gap-1.5">
          <Eye size={11} />
          <span>Built with zero-knowledge encryption.</span>
        </div>
      </footer>
    </div>
  );
}
