"use client";

import Link from "next/link";
import { Shield, Lock, Eye, Zap, ArrowRight, CheckCircle, Users, Key } from "lucide-react";
import { SentriLogo } from "@/components/ui/SentriLogo";
import { SentriLogoDuotone } from "@/components/ui/SentriLogoDuotone";
import { SentriIcon } from "@/components/ui/SentriIcon";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)", fontFamily: "var(--font-body)", color: "var(--text)" }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b sticky top-0 z-50 backdrop-blur-md"
        style={{ background: "var(--surface-nav)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <SentriLogo height={24} color="#ffffff" />
        </div>
        <div className="flex items-center gap-2">
          <Link href="/signin" className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ color: "var(--text2)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text2)")}>
            Sign in
          </Link>
          <Link href="/signup"
            className="text-sm font-semibold px-4 py-2 rounded-lg transition-all btn-accent"
            style={{ borderRadius: "8px" }}>
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-glow flex-1 flex flex-col items-center justify-center px-6 py-28 text-center relative overflow-hidden">

        {/* Subtle accent orb */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center, rgba(79,110,247,0.08) 0%, transparent 70%)" }} />

        <div className="animate-fade-up max-w-3xl relative z-10">

          {/* Logo */}
          <div className="flex justify-center mb-10">
            <SentriLogoDuotone height={44} />
          </div>

          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-10 border"
            style={{ background: "var(--accent-dim)", borderColor: "rgba(0,255,148,0.0.25)", color: "var(--accent)" }}>
            <Lock size={11} strokeWidth={2.5} />
            Zero-knowledge — your data never reaches our servers
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold leading-tight mb-6"
            style={{ fontFamily: "var(--font-display)", color: "var(--text)", letterSpacing: "-0.01em" }}>
            Built to Protect what&apos;s at stake.
          </h1>

          <p className="text-lg max-w-xl mx-auto mb-10 leading-relaxed" style={{ color: "var(--text2)" }}>
            Sentri encrypts everything locally before it ever leaves your device.
            AES-256-GCM. 600,000 PBKDF2 iterations. No exceptions.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm btn-accent"
              style={{ borderRadius: "10px" }}>
              Create your vault
              <ArrowRight size={15} strokeWidth={2.5} />
            </Link>
            <Link href="/signin"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium border transition-all"
              style={{ borderColor: "var(--border2)", color: "var(--text2)", background: "var(--surface)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border2)"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--text2)"; }}>
              Sign in to vault
            </Link>
          </div>
        </div>

        {/* Security metrics strip */}
        <div className="mt-20 flex items-center gap-12 flex-wrap justify-center animate-fade-up delay-2 relative z-10">
          {[
            { val: "AES-256-GCM", label: "Encryption standard" },
            { val: "600,000",     label: "PBKDF2 iterations"   },
            { val: "0 bytes",     label: "Plaintext to server"  },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-semibold font-mono" style={{ color: "var(--text)", letterSpacing: "-0.02em" }}>{s.val}</p>
              <p className="text-xs mt-1 uppercase tracking-widest font-medium" style={{ color: "var(--sub)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-8 py-24 max-w-5xl mx-auto w-full">
        <div className="text-center mb-16 animate-fade-up">
          <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: "var(--accent)" }}>Why Sentri</p>
          <h2 className="text-3xl font-normal" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>
            Engineered for trust. Designed for people.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-fade-up delay-1">
          {[
            {
              icon: Lock,
              color: "#ffffff",
              title: "Zero-Knowledge Architecture",
              desc: "Your master password and secret key never leave your device. We mathematically cannot access your vault — even if compelled.",
            },
            {
              icon: Shield,
              color: "var(--success)",
              title: "Watchtower Monitoring",
              desc: "Continuous breach detection via HaveIBeenPwned with k-anonymity — your passwords are checked without ever being exposed.",
            },
            {
              icon: Users,
              color: "var(--gold)",
              title: "Built for your circle",
              desc: "Share encrypted items with trusted people via secure one-time links. The decryption key travels in the URL fragment — never our servers.",
            },
          ].map((f) => (
            <div key={f.title} className="vault-card p-6 flex flex-col gap-4">
              <f.icon size={22} style={{ color: f.color }} strokeWidth={1.6} />
              <div>
                <p className="font-semibold mb-2 text-sm" style={{ color: "var(--text)" }}>{f.title}</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--sub)" }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What you can store */}
      <section className="px-8 py-20 border-y" style={{ borderColor: "var(--border)", background: "var(--bg2)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 animate-fade-up">
            <h2 className="text-3xl font-normal" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>
              Everything worth protecting, in one place.
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 animate-fade-up delay-1">
            {[
              { icon: Key,    label: "Logins",         color: "var(--accent)"  },
              { icon: Zap,    label: "API Keys",        color: "var(--warning)" },
              { icon: Lock,   label: "Secure Notes",   color: "var(--success)" },
              { icon: Shield, label: "SSH Keys",        color: "#A78BFA"        },
              { icon: Eye,    label: "Card Details",   color: "var(--gold)"    },
            ].map((t) => (
              <div key={t.label}
                className="vault-card flex flex-col items-center gap-3 py-5 px-3 rounded-xl cursor-default select-none">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: `${t.color}12`, border: `1px solid ${t.color}22` }}>
                  <t.icon size={16} style={{ color: t.color }} strokeWidth={1.8} />
                </div>
                <span className="text-xs font-medium text-center" style={{ color: "var(--text2)" }}>{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-24 text-center animate-fade-up">
        <div className="max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "var(--accent)", boxShadow: "0 4px 24px rgba(0,230,118,0.3)" }}>
            <SentriIcon size={24} color="#000" />
          </div>
          <h2 className="text-3xl font-normal mb-4" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>
            Ready to secure your digital life?
          </h2>
          <p className="text-sm mb-8 leading-relaxed" style={{ color: "var(--text2)" }}>
            Create your vault in under 2 minutes. No credit card required.
          </p>
          <Link href="/signup"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm btn-accent">
            Create your vault — it&apos;s free
            <ArrowRight size={15} strokeWidth={2.5} />
          </Link>
          <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
            {["End-to-end encrypted", "Open source", "No tracking"].map((t) => (
              <span key={t} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--sub)" }}>
                <CheckCircle size={12} style={{ color: "var(--success)" }} /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-8 py-6 flex items-center justify-between text-xs"
        style={{ borderColor: "var(--border)", color: "var(--sub)" }}>
        <div className="flex items-center gap-2">
          <SentriIcon size={18} />
          <span>© 2026 Sentri</span>
        </div>
        <span>Zero-knowledge. Always.</span>
      </footer>
    </div>
  );
}
