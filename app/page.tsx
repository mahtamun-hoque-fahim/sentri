import Link from "next/link";

export default function LandingPage() {
  return (
    <div
      className="min-h-screen vault-pattern flex flex-col"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-sentri-muted bg-sentri-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #006341, #004D32)" }}
          >
            S
          </div>
          <span
            className="text-xl font-semibold tracking-tight"
            style={{ fontFamily: "'DM Serif Display', serif", color: "#006341" }}
          >
            Sentri
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/signin"
            className="text-sm font-medium px-4 py-2 rounded-lg text-sentri-text hover:bg-sentri-muted transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium px-4 py-2 rounded-lg text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg, #006341, #004D32)" }}
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="animate-fade-up max-w-3xl">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8 border"
            style={{
              background: "rgba(0,99,65,0.07)",
              borderColor: "rgba(0,99,65,0.2)",
              color: "#006341",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#006341" }}
            />
            Zero-knowledge encryption — we never see your data
          </div>

          <h1
            className="text-5xl md:text-7xl font-normal leading-tight mb-6"
            style={{
              fontFamily: "'DM Serif Display', serif",
              color: "#1A1F1E",
              letterSpacing: "-0.02em",
            }}
          >
            One vault for{" "}
            <span
              className="italic"
              style={{ color: "#006341" }}
            >
              everything
            </span>
            <br />
            you need to protect.
          </h1>

          <p
            className="text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed"
            style={{ color: "#667085" }}
          >
            Sentri is a private, encrypted password manager built for you and
            your trusted circle. Passwords, cards, keys — all secured with
            AES-256-GCM.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium text-sm transition-all hover:shadow-vault active:scale-95"
              style={{ background: "linear-gradient(135deg, #006341, #004D32)" }}
            >
              Create your vault
              <span>→</span>
            </Link>
            <Link
              href="/signin"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium border transition-colors hover:bg-sentri-muted"
              style={{ borderColor: "#E8EDEB", color: "#1A1F1E" }}
            >
              Sign in to vault
            </Link>
          </div>
        </div>

        {/* Feature pills */}
        <div
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full animate-fade-up delay-3"
        >
          {[
            {
              icon: "🔐",
              title: "Zero-Knowledge",
              desc: "Your master password never leaves your device.",
            },
            {
              icon: "⚡",
              title: "Instant Autofill",
              desc: "Fill logins in one click across all your sites.",
            },
            {
              icon: "🛡️",
              title: "Watchtower",
              desc: "Get alerted on breached or weak passwords.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="flex flex-col items-start gap-3 p-5 rounded-2xl border bg-sentri-surface text-left"
              style={{ borderColor: "#E8EDEB" }}
            >
              <span className="text-2xl">{f.icon}</span>
              <p className="font-semibold text-sentri-text text-sm">{f.title}</p>
              <p className="text-sentri-sub text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer
        className="border-t px-8 py-5 flex items-center justify-between text-xs"
        style={{ borderColor: "#E8EDEB", color: "#667085" }}
      >
        <span>© 2025 Sentri. All rights reserved.</span>
        <span>Built with zero-knowledge encryption.</span>
      </footer>
    </div>
  );
}
