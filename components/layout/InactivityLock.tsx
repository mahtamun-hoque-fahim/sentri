"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { useVaultStore } from "@/store/vault";

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
      if (idle >= limit)         doLock();
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
    <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 px-5 py-4 rounded-2xl shadow-vault border max-w-xs animate-fade-up"
      style={{ background: "#fff", borderColor: "#F9D74C", borderWidth: "1.5px" }}>
      <span className="text-xl mt-0.5">⚠️</span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-sentri-text">Vault locking soon</p>
        <p className="text-xs text-sentri-sub mt-0.5">No activity detected. Locking in under a minute.</p>
        <button onClick={() => { touchActivity(); setShowWarning(false); }}
          className="mt-2 text-xs font-medium" style={{ color: "#006341" }}>
          Stay unlocked
        </button>
      </div>
      <button onClick={doLock} className="text-sentri-sub hover:text-sentri-danger text-sm mt-0.5">✕</button>
    </div>
  );
}
