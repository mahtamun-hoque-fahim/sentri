"use client";

import { useEffect, useState, useCallback } from "react";
import { generateTOTP } from "@/lib/totp";

interface TOTPDisplayProps {
  secret: string;
}

export default function TOTPDisplay({ secret }: TOTPDisplayProps) {
  const [code,      setCode]      = useState("------");
  const [remaining, setRemaining] = useState(30);
  const [progress,  setProgress]  = useState(0);
  const [copied,    setCopied]    = useState(false);
  const [error,     setError]     = useState(false);

  const refresh = useCallback(async () => {
    try {
      const result = await generateTOTP(secret);
      setCode(result.code);
      setRemaining(result.remaining);
      setProgress(result.progress);
      setError(false);
    } catch {
      setError(true);
    }
  }, [secret]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // SVG ring
  const SIZE   = 36;
  const RADIUS = 14;
  const CIRC   = 2 * Math.PI * RADIUS;
  const dash   = CIRC * (1 - progress);
  const urgent = remaining <= 5;

  if (error) {
    return (
      <div className="text-xs text-sentri-danger px-3 py-2 rounded-lg"
        style={{ background: "rgba(217,48,37,0.06)" }}>
        Invalid TOTP secret
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-xl border"
      style={{ background: "#F7F9F8", borderColor: "#E8EDEB" }}
    >
      {/* Countdown ring */}
      <svg width={SIZE} height={SIZE} className="shrink-0 -rotate-90">
        <circle cx={SIZE/2} cy={SIZE/2} r={RADIUS} fill="none"
          stroke="#E8EDEB" strokeWidth={3} />
        <circle cx={SIZE/2} cy={SIZE/2} r={RADIUS} fill="none"
          stroke={urgent ? "#D93025" : "#006341"} strokeWidth={3}
          strokeDasharray={CIRC} strokeDashoffset={dash}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.3s" }}
        />
        <text x={SIZE/2} y={SIZE/2 + 1} textAnchor="middle" dominantBaseline="middle"
          className="rotate-90" fill={urgent ? "#D93025" : "#667085"}
          fontSize="9" fontWeight="600"
          style={{ transform: `rotate(90deg)`, transformOrigin: `${SIZE/2}px ${SIZE/2}px`, fontFamily: "monospace" }}>
          {remaining}
        </text>
      </svg>

      {/* Code */}
      <div className="flex-1">
        <p className="text-xs font-medium uppercase tracking-widest text-sentri-sub mb-0.5">2FA Code</p>
        <p
          className="text-2xl font-bold tracking-[0.18em] leading-none"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: urgent ? "#D93025" : "#006341",
          }}
        >
          {code.slice(0, 3)}&thinsp;{code.slice(3)}
        </p>
      </div>

      {/* Copy */}
      <button
        onClick={copy}
        className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-all shrink-0"
        style={{
          borderColor: copied ? "#006341" : "#E8EDEB",
          color:       copied ? "#006341" : "#667085",
          background:  copied ? "rgba(0,99,65,0.06)" : "transparent",
        }}
      >
        {copied ? "✓" : "Copy"}
      </button>
    </div>
  );
}
