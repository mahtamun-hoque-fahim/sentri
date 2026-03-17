"use client";

import { useState } from "react";
import Link from "next/link";
import { getPasswordStrength } from "@/lib/crypto";

interface PasswordFieldProps {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  showGenerator?: boolean;
}

export default function PasswordField({
  value,
  onChange,
  label = "Password",
  showGenerator = true,
}: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  const strength = getPasswordStrength(value);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-medium uppercase tracking-widest text-sentri-sub">
          {label}
        </label>
        {showGenerator && (
          <Link
            href="/generator"
            className="text-xs font-medium"
            style={{ color: "#006341" }}
            target="_blank"
          >
            Generate ↗
          </Link>
        )}
      </div>

      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter password…"
          className="w-full px-4 py-2.5 pr-10 rounded-xl border text-sm outline-none transition-shadow bg-sentri-bg"
          style={{
            borderColor:  "#E8EDEB",
            fontFamily:   show ? "'JetBrains Mono', monospace" : undefined,
            letterSpacing: show ? "0.05em" : undefined,
          }}
          onFocus={(e) => (e.target.style.boxShadow = "0 0 0 3px rgba(0,99,65,0.18)")}
          onBlur={(e)  => (e.target.style.boxShadow = "none")}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-sentri-sub hover:text-sentri-text text-sm transition-colors"
          tabIndex={-1}
        >
          {show ? "🙈" : "👁"}
        </button>
      </div>

      {/* Strength bar */}
      {value && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full transition-all"
                style={{
                  background:
                    strength.score > i * 1.5
                      ? strength.color
                      : "#E8EDEB",
                }}
              />
            ))}
          </div>
          <span className="text-xs font-medium" style={{ color: strength.color }}>
            {strength.label}
          </span>
        </div>
      )}
    </div>
  );
}
