"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { useVaultStore } from "@/store/vault";
import { AlertTriangle, X } from "lucide-react";

const EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];

export default function InactivityLock() {
  const router          = useRouter();
  const { signOut }     = useClerk();
  const lock            = useVaultStore((s) => s.lock);
  const isUnlocked      = useVaultStore((s) => s.isUnlocked);
  const autoLockMinutes = useVaultStore((s) => s.autoLockMinutes);
  const touchActivity   = useVaultStore((s) => s.touchActivity);
  const [showWarning, setShowWarning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isUnlocked || autoLockMinutes === 0) return;
    const touch = () => touchActivity();
    EVENTS.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    timerRef.current = setInterval(() => {
      const idle  = (Date.now() - useVaultStore.getState().lastActivity) / 1000 / 60;
      const limit = useVaultStore.getState().autoLockMinutes;
      if (limit === 0) return;
      if (idle >= limit)          doLock();
      else if (idle >= limit - 1) setShowWarning(true);
      else                        setShowWarning(false);
    }, 10_000);
    return () => {
      EVENTS.forEach((e) => window.removeEventListener(e, touch));
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnlocked, autoLockMinutes]);

  async function doLock() {
    setShowWarning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    lock();
    await signOut();
    router.push("/signin");
  }

  if (!showWarning) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 px-5 py-4 rounded-2xl max-w-xs animate-fade-up border"
      style={{ background: "var(--surface2)", borderColor: "rgba(255,181,71,0.4)", boxShadow: "0 0 20px rgba(255,181,71,0.1)" }}>
      <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" style={{ color: "#F5A623" }} />
      <div className="flex-1">
        <p className="text-sm font-bold" style={{ color: "var(--text)" }}>Vault locking soon</p>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--sub)" }}>
          No activity detected. Locking in under a minute.
        </p>
        <button onClick={() => { touchActivity(); setShowWarning(false); }}
          className="mt-2 text-xs font-bold" style={{ color: "#4F6EF7" }}>
          Stay unlocked
        </button>
      </div>
      <button onClick={doLock} className="mt-0.5 transition-colors" style={{ color: "var(--sub)" }}
        onMouseEnter={e => (e.currentTarget.style.color = "var(--danger)")}
        onMouseLeave={e => (e.currentTarget.style.color = "var(--sub)")}>
        <X size={14} />
      </button>
    </div>
  );
}
