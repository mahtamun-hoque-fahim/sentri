"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import { generatePassword, getPasswordStrength } from "@/lib/crypto";

export default function GeneratorPage() {
  const [password, setPassword]   = useState("");
  const [length, setLength]       = useState(20);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers]     = useState(true);
  const [symbols, setSymbols]     = useState(true);
  const [copied, setCopied]       = useState(false);
  const [history, setHistory]     = useState<string[]>([]);

  const generate = useCallback(() => {
    const pw = generatePassword({ length, uppercase, lowercase, numbers, symbols });
    setPassword(pw);
    if (pw) setHistory((h) => [pw, ...h].slice(0, 10));
  }, [length, uppercase, lowercase, numbers, symbols]);

  useEffect(() => { generate(); }, [generate]);

  function copy(value: string) {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const strength = getPasswordStrength(password);

  const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center justify-between px-4 py-3 rounded-xl border transition-all"
      style={{
        borderColor: value ? "#00FF94" : "#2A3244",
        background:  value ? "rgba(0,255,148,0.06)" : "#fff",
      }}
    >
      <span className="text-sm font-medium" style={{ color: value ? "#00FF94" : "#8892A4" }}>
        {label}
      </span>
      <div
        className="w-8 h-4 rounded-full transition-all relative"
        style={{ background: value ? "#00FF94" : "#2A3244" }}
      >
        <div
          className="absolute top-0.5 w-3 h-3 rounded-full  transition-all shadow-sm"
          style={{ left: value ? "calc(100% - 14px)" : "2px" }}
        />
      </div>
    </button>
  );

  return (
    <>
      <Header title="Password Generator" showSearch={false} />
      <div className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full">
        <div className="flex flex-col gap-4">

          {/* Generated password display */}
          <div
            className=" rounded-2xl border p-6"
            style={{ borderColor: "#2A3244" }}
          >
            <div
              className="w-full px-5 py-4 rounded-xl mb-4 text-center text-lg break-all leading-relaxed select-all"
              style={{
                background:  "#080B12",
                border:      "1.5px solid #2A3244",
                fontFamily:  "'Space Mono', monospace",
                color:       "#E8EDF5",
                letterSpacing: "0.04em",
                minHeight:   "60px",
              }}
            >
              {password || <span className=" text-sm italic">No password generated</span>}
            </div>

            {/* Strength bar */}
            {password && (
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 flex gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-1.5 flex-1 rounded-full transition-all"
                      style={{ background: strength.score > i * 1.5 ? strength.color : "#2A3244" }}
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold" style={{ color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => copy(password)}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 active:scale-95"
                style={{ background: copied ? "#00CC77" : "linear-gradient(135deg, #00FF94, #00CC77)" }}
              >
                {copied ? "✓ Copied!" : "Copy Password"}
              </button>
              <button
                onClick={generate}
                className="px-4 py-2.5 rounded-xl border text-sm font-medium  hover:bg-sentri-muted transition-colors"
                style={{ borderColor: "#2A3244" }}
              >
                ↻ New
              </button>
            </div>
          </div>

          {/* Options */}
          <div
            className=" rounded-2xl border p-5 flex flex-col gap-4"
            style={{ borderColor: "#2A3244" }}
          >
            <p className="text-xs font-medium uppercase tracking-widest ">Options</p>

            {/* Length slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium ">Length</label>
                <span
                  className="text-sm font-semibold px-2.5 py-0.5 rounded-lg"
                  style={{ background: "rgba(0,255,148,0.08)", color: "#00FF94" }}
                >
                  {length}
                </span>
              </div>
              <input
                type="range"
                min={8}
                max={64}
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: "#00FF94" }}
              />
              <div className="flex justify-between mt-1 text-xs ">
                <span>8</span>
                <span>64</span>
              </div>
            </div>

            {/* Character toggles */}
            <div className="grid grid-cols-2 gap-2">
              <Toggle label="Uppercase (A–Z)" value={uppercase} onChange={setUppercase} />
              <Toggle label="Lowercase (a–z)" value={lowercase} onChange={setLowercase} />
              <Toggle label="Numbers (0–9)"   value={numbers}   onChange={setNumbers}   />
              <Toggle label="Symbols (!@#…)"  value={symbols}   onChange={setSymbols}   />
            </div>
          </div>

          {/* History */}
          {history.length > 1 && (
            <div
              className=" rounded-2xl border p-5"
              style={{ borderColor: "#2A3244" }}
            >
              <p className="text-xs font-medium uppercase tracking-widest  mb-3">Recent</p>
              <div className="flex flex-col gap-1.5">
                {history.slice(1).map((pw, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover: transition-colors group"
                  >
                    <span
                      className="flex-1 text-xs truncate"
                      style={{ fontFamily: "'Space Mono', monospace", color: "#8892A4" }}
                    >
                      {pw}
                    </span>
                    <button
                      onClick={() => copy(pw)}
                      className="text-xs  opacity-0 group-hover:opacity-100 transition-opacity hover:"
                    >
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
