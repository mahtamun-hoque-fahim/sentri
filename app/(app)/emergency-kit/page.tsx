"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { generateEmergencyKitPDF } from "@/lib/pdf";
import Header from "@/components/layout/Header";

export default function EmergencyKitPage() {
  const [email,      setEmail]      = useState("");
  const [secretKey,  setSecretKey]  = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated,  setGenerated]  = useState(false);
  const [error,      setError]      = useState("");

  useEffect(() => {
    createClient().auth.getUser().then(({ data }: { data: { user: { email?: string } | null } }) => {
      if (data.user?.email) setEmail(data.user.email);
    });
  }, []);

  async function handleGenerate() {
    if (!secretKey.trim()) {
      setError("Please enter your Secret Key to include it in the kit.");
      return;
    }
    setError("");
    setGenerating(true);
    try {
      await generateEmergencyKitPDF({
        email,
        secretKey: secretKey.replace(/\s/g, "").toUpperCase(),
        createdAt: new Date().toLocaleDateString(undefined, {
          year: "numeric", month: "long", day: "numeric",
        }),
      });
      setGenerated(true);
    } catch (err) {
      console.error(err);
      setError("Failed to generate PDF. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      <Header title="Emergency Kit" showSearch={false} />
      <div className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full">

        {/* Hero */}
        <div className="bg-white rounded-2xl border p-6 mb-4"
          style={{ borderColor: "#E8EDEB" }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{ background: "rgba(0,99,65,0.08)" }}>
              🆘
            </div>
            <div>
              <h2 className="text-lg font-semibold text-sentri-text mb-1"
                style={{ fontFamily: "'DM Serif Display', serif" }}>
                Emergency Kit
              </h2>
              <p className="text-sm text-sentri-sub leading-relaxed">
                Your Emergency Kit is a printable PDF containing your account email and Secret Key.
                Store it somewhere safe — if you forget your Secret Key, this is the only way to recover your vault.
              </p>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="rounded-xl border px-4 py-3 mb-5 flex items-start gap-3"
          style={{ background: "#FFFBEC", borderColor: "rgba(249,215,76,0.5)" }}>
          <span className="text-lg mt-0.5">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-sentri-text">Keep this PDF private</p>
            <p className="text-xs text-sentri-sub mt-0.5 leading-relaxed">
              Anyone with this file and your master password can access your vault.
              Store it in a fireproof safe, safety deposit box, or with a trusted person.
              Do not store it digitally alongside your passwords.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border p-6 flex flex-col gap-5"
          style={{ borderColor: "#E8EDEB" }}>

          {/* Email — prefilled */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-widest text-sentri-sub mb-1.5">
              Account Email
            </label>
            <div className="px-4 py-2.5 rounded-xl border text-sm bg-sentri-bg text-sentri-sub"
              style={{ borderColor: "#E8EDEB" }}>
              {email || "Loading…"}
            </div>
          </div>

          {/* Secret Key input */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-widest text-sentri-sub mb-1.5">
              Your Secret Key
            </label>
            <input
              type="text"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-shadow bg-sentri-bg"
              style={{
                borderColor:   "#E8EDEB",
                fontFamily:    "'JetBrains Mono', monospace",
                letterSpacing: "0.06em",
              }}
              onFocus={(e) => (e.target.style.boxShadow = "0 0 0 3px rgba(0,99,65,0.18)")}
              onBlur={(e)  => (e.target.style.boxShadow = "none")}
            />
            <p className="text-xs text-sentri-sub mt-1.5">
              Enter the Secret Key you saved when you created your vault.
              It was shown once during signup.
            </p>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl border text-sm"
              style={{ background: "#FFF1F0", borderColor: "#FECAC7", color: "#D93025" }}>
              {error}
            </div>
          )}

          {/* What will be in the PDF */}
          <div className="rounded-xl border p-4" style={{ background: "#F7F9F8", borderColor: "#E8EDEB" }}>
            <p className="text-xs font-medium uppercase tracking-widest text-sentri-sub mb-3">
              The PDF will contain
            </p>
            <div className="flex flex-col gap-2">
              {[
                { icon: "📧", text: "Your account email" },
                { icon: "🔑", text: "Your Secret Key (large, easy to read)" },
                { icon: "📱", text: "QR code of your Secret Key" },
                { icon: "📋", text: "Step-by-step sign-in instructions" },
                { icon: "🛡", text: "Security best-practice notes" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2.5 text-sm text-sentri-text">
                  <span className="text-base">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !email}
            className="w-full py-3 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #006341, #004D32)" }}
          >
            {generating ? "Generating PDF…" : "Download Emergency Kit PDF"}
          </button>

          {generated && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm"
              style={{ background: "rgba(0,99,65,0.06)", borderColor: "rgba(0,99,65,0.2)", color: "#006341" }}>
              <span className="text-base">✅</span>
              <div>
                <p className="font-medium">PDF downloaded</p>
                <p className="text-xs mt-0.5" style={{ color: "#004D32" }}>
                  Print it and store it somewhere safe. Keep it away from your digital devices.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
