"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ExternalLink } from "lucide-react";
import { getPasswordStrength } from "@/lib/crypto";

interface PasswordFieldProps {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  showGenerator?: boolean;
}

export default function PasswordField({ value, onChange, label = "Password", showGenerator = true }: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  const strength = getPasswordStrength(value);

  const strengthColors: Record<string, string> = {
    "Very Weak":   "#FF4D6A",
    "Weak":        "#FFB547",
    "Fair":        "#00D4FF",
    "Strong":      "#00FF94",
    "Very Strong": "#00FF94",
  };
  const color = strengthColors[strength.label] ?? "#2A3244";

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-bold uppercase tracking-widest font-mono" style={{ color: "#8892A4" }}>
          {label}
        </label>
        {showGenerator && (
          <Link href="/generator" className="flex items-center gap-1 text-xs font-semibold transition-colors"
            style={{ color: "#00FF94" }} target="_blank">
            Generate <ExternalLink size={10} />
          </Link>
        )}
      </div>

      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter password…"
          className="w-full px-4 py-2.5 pr-10 rounded-xl border text-sm outline-none transition-all"
          style={{
            background: "#161B27",
            borderColor: "#2A3244",
            color: "#E8EDF5",
            fontFamily: show ? "Space Mono, monospace" : undefined,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "rgba(0,255,148,0.4)";
            e.target.style.boxShadow = "0 0 0 3px rgba(0,255,148,0.08)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#2A3244";
            e.target.style.boxShadow = "none";
          }}
        />
        <button type="button" onClick={() => setShow((s) => !s)} tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
          style={{ color: "#8892A4" }}>
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>

      {value && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-1 flex-1 rounded-full transition-all"
                style={{ background: strength.score > i * 1.5 ? color : "#1E2535" }} />
            ))}
          </div>
          <span className="text-xs font-mono font-bold" style={{ color }}>{strength.label}</span>
        </div>
      )}
    </div>
  );
}
