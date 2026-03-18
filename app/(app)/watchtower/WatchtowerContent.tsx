"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useVaultStore } from "@/store/vault";
import { checkPasswordBreached, WatchtowerIssue } from "@/lib/hibp";
import { getPasswordStrength } from "@/lib/crypto";
import { DecryptedVaultItem } from "@/types/vault";

const SEVERITY_META = {
  critical: { color: "#D93025", bg: "rgba(217,48,37,0.07)",  border: "rgba(217,48,37,0.2)",  label: "Critical" },
  warning:  { color: "#EA8C35", bg: "rgba(234,140,53,0.07)", border: "rgba(234,140,53,0.2)",  label: "Warning"  },
  info:     { color: "#667085", bg: "rgba(102,112,133,0.07)",border: "rgba(102,112,133,0.2)", label: "Info"     },
};

const TYPE_META = {
  breached: { icon: "💀", label: "Data breach" },
  weak:     { icon: "⚠️", label: "Weak password" },
  reused:   { icon: "🔄", label: "Reused password" },
  old:      { icon: "🕐", label: "Old password" },
};

function ageInDays(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

export default function WatchtowerContent() {
  const items    = useVaultStore((s) => s.items);
  const logins   = items.filter((i) => i.item_type === "login" && i.data.type === "login");

  const [scanning,  setScanning]  = useState(false);
  const [done,      setDone]      = useState(false);
  const [issues,    setIssues]    = useState<WatchtowerIssue[]>([]);
  const [progress,  setProgress]  = useState(0);
  const [filter,    setFilter]    = useState<WatchtowerIssue["type"] | "all">("all");
  const [hibpError, setHibpError] = useState(false);

  const scan = useCallback(async () => {
    if (logins.length === 0) { setDone(true); return; }
    setScanning(true);
    setDone(false);
    setIssues([]);
    setProgress(0);
    setHibpError(false);

    const found: WatchtowerIssue[] = [];
    // Build password → itemIds map for reuse detection
    const pwMap = new Map<string, string[]>();

    for (let i = 0; i < logins.length; i++) {
      const item = logins[i] as DecryptedVaultItem & { data: { type: "login"; password: string; username: string; urls: string[] } };
      const pw   = item.data.password;

      // 1. Reuse tracking
      if (pw) {
        const existing = pwMap.get(pw) ?? [];
        pwMap.set(pw, [...existing, item.id]);
      }

      // 2. Weak password
      if (pw) {
        const strength = getPasswordStrength(pw);
        if (strength.score <= 2) {
          found.push({
            itemId:    item.id,
            itemTitle: item.title,
            type:      "weak",
            detail:    `Password strength: ${strength.label}`,
            severity:  strength.score <= 1 ? "critical" : "warning",
          });
        }
      }

      // 3. Old password (>90 days since last update)
      const age = ageInDays(item.updated_at);
      if (age > 90) {
        found.push({
          itemId:    item.id,
          itemTitle: item.title,
          type:      "old",
          detail:    `Not changed in ${age} days`,
          severity:  age > 180 ? "warning" : "info",
        });
      }

      // 4. HIBP breach check
      if (pw) {
        const count = await checkPasswordBreached(pw);
        if (count === -1) setHibpError(true);
        if (count > 0) {
          found.push({
            itemId:    item.id,
            itemTitle: item.title,
            type:      "breached",
            detail:    `Found ${count.toLocaleString()} times in known data breaches`,
            severity:  "critical",
          });
        }
      }

      setProgress(Math.round(((i + 1) / logins.length) * 100));
    }

    // 5. Add reuse issues
    Array.from(pwMap.entries()).forEach(([, ids]) => {
      if (ids.length > 1) {
        for (const id of ids) {
          const item = logins.find((l) => l.id === id);
          if (!item) continue;
          if (!found.some((f) => f.itemId === id && f.type === "reused")) {
            found.push({
              itemId:    id,
              itemTitle: item.title,
              type:      "reused",
              detail:    `Same password used across ${ids.length} accounts`,
              severity:  "warning",
            });
          }
        }
      }
    });

    setIssues(found);
    setScanning(false);
    setDone(true);
  }, [logins]);

  const filtered = filter === "all" ? issues : issues.filter((i) => i.type === filter);
  const counts   = {
    critical: issues.filter((i) => i.severity === "critical").length,
    warning:  issues.filter((i) => i.severity === "warning").length,
    info:     issues.filter((i) => i.severity === "info").length,
  };

  const score = logins.length === 0 ? 100
    : Math.max(0, Math.round(100 - (counts.critical * 20 + counts.warning * 8 + counts.info * 3)));

  const scoreColor = score >= 80 ? "#006341" : score >= 50 ? "#EA8C35" : "#D93025";
  const scoreLabel = score >= 80 ? "Good" : score >= 50 ? "Fair" : "At risk";

  return (
    <div className="flex-1 px-6 py-6 max-w-3xl mx-auto w-full">

      {/* Hero card */}
      <div className="bg-white rounded-2xl border p-6 mb-5 flex items-center gap-6"
        style={{ borderColor: "#E8EDEB" }}>

        {/* Score ring */}
        <div className="relative shrink-0">
          <svg width={96} height={96}>
            <circle cx={48} cy={48} r={40} fill="none" stroke="#E8EDEB" strokeWidth={8} />
            <circle cx={48} cy={48} r={40} fill="none"
              stroke={done ? scoreColor : "#E8EDEB"} strokeWidth={8}
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - score / 100)}`}
              strokeLinecap="round"
              transform="rotate(-90 48 48)"
              style={{ transition: "stroke-dashoffset 1s ease, stroke 0.5s" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold leading-none" style={{ color: done ? scoreColor : "#E8EDEB" }}>
              {done ? score : "—"}
            </span>
            <span className="text-xs mt-0.5" style={{ color: done ? scoreColor : "#E8EDEB" }}>
              {done ? scoreLabel : ""}
            </span>
          </div>
        </div>

        <div className="flex-1">
          <h2 className="text-lg font-semibold text-sentri-text mb-1"
            style={{ fontFamily: "'DM Serif Display', serif" }}>
            Security Score
          </h2>
          <p className="text-sm text-sentri-sub mb-4">
            {logins.length === 0
              ? "No login items found. Add some passwords to scan."
              : done
                ? issues.length === 0
                  ? "✅ All clear — no issues found across your vault."
                  : `${issues.length} issue${issues.length !== 1 ? "s" : ""} found across ${logins.length} login${logins.length !== 1 ? "s" : ""}.`
                : scanning
                  ? `Scanning ${logins.length} login${logins.length !== 1 ? "s" : ""}…`
                  : `${logins.length} login${logins.length !== 1 ? "s" : ""} ready to scan.`}
          </p>

          {scanning ? (
            <div className="flex flex-col gap-2">
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E8EDEB" }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${progress}%`, background: "linear-gradient(90deg, #006341, #2A8A58)" }} />
              </div>
              <p className="text-xs text-sentri-sub">Checking breach database… {progress}%</p>
            </div>
          ) : (
            <button
              onClick={scan}
              disabled={logins.length === 0}
              className="px-5 py-2 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #006341, #004D32)" }}
            >
              {done ? "Re-scan Vault" : "Scan Now"}
            </button>
          )}
        </div>

        {/* Stat pills */}
        {done && issues.length > 0 && (
          <div className="hidden sm:flex flex-col gap-2 shrink-0">
            {[
              { label: "Critical", count: counts.critical, color: "#D93025" },
              { label: "Warning",  count: counts.warning,  color: "#EA8C35" },
              { label: "Info",     count: counts.info,     color: "#667085" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                <span className="font-semibold" style={{ color: s.color }}>{s.count}</span>
                <span className="text-sentri-sub">{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {hibpError && (
        <div className="mb-4 px-4 py-3 rounded-xl border text-sm"
          style={{ background: "#FFF9EC", borderColor: "rgba(234,140,53,0.3)", color: "#EA8C35" }}>
          ⚠ Could not reach the breach database. Some breach checks may have been skipped.
        </div>
      )}

      {/* Filter tabs */}
      {done && issues.length > 0 && (
        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
          {(["all", "breached", "weak", "reused", "old"] as const).map((f) => {
            const count = f === "all" ? issues.length : issues.filter((i) => i.type === f).length;
            if (count === 0 && f !== "all") return null;
            return (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize"
                style={{
                  borderColor: filter === f ? "#006341" : "#E8EDEB",
                  background:  filter === f ? "rgba(0,99,65,0.08)" : "#fff",
                  color:       filter === f ? "#006341" : "#667085",
                }}>
                {f === "all" ? "All" : TYPE_META[f].label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Issues list */}
      {done && filtered.length > 0 && (
        <div className="flex flex-col gap-2">
          {filtered.map((issue, i) => {
            const sev  = SEVERITY_META[issue.severity];
            const type = TYPE_META[issue.type];
            return (
              <div key={`${issue.itemId}-${issue.type}`}
                className="flex items-start gap-4 px-5 py-4 bg-white rounded-xl border animate-fade-up"
                style={{ borderColor: "#E8EDEB", animationDelay: `${i * 0.04}s` }}>

                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                  style={{ background: sev.bg, border: `1px solid ${sev.border}` }}>
                  {type.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-sentri-text truncate">{issue.itemTitle}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                      style={{ background: sev.bg, color: sev.color }}>
                      {sev.label}
                    </span>
                  </div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: sev.color }}>{type.label}</p>
                  <p className="text-xs text-sentri-sub">{issue.detail}</p>
                </div>

                <Link href={`/vault/${issue.itemId}`}
                  className="text-xs px-3 py-1.5 rounded-lg border font-medium shrink-0 transition-colors hover:bg-sentri-bg"
                  style={{ borderColor: "#E8EDEB", color: "#667085" }}>
                  Fix →
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* All clear */}
      {done && issues.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ background: "rgba(0,99,65,0.07)" }}>🛡</div>
          <h3 className="text-lg font-semibold text-sentri-text mb-1"
            style={{ fontFamily: "'DM Serif Display', serif" }}>All clear</h3>
          <p className="text-sm text-sentri-sub">No security issues found across your vault.</p>
        </div>
      )}

      {/* Pre-scan empty */}
      {!scanning && !done && logins.length > 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ background: "rgba(0,99,65,0.07)" }}>🔍</div>
          <h3 className="text-lg font-semibold text-sentri-text mb-2"
            style={{ fontFamily: "'DM Serif Display', serif" }}>
            Scan your vault
          </h3>
          <p className="text-sm text-sentri-sub max-w-xs mx-auto">
            Check for breached passwords, weak passwords, reused credentials, and old passwords.
          </p>
        </div>
      )}
    </div>
  );
}
