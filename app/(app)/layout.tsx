"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useVaultStore } from "@/store/vault";
import Sidebar from "@/components/layout/Sidebar";
import InactivityLock from "@/components/layout/InactivityLock";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router       = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const isUnlocked   = useVaultStore((s) => s.isUnlocked);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { router.replace("/signin"); return; }
    if (!isUnlocked) { router.replace("/unlock"); return; }
  }, [isLoaded, isSignedIn, isUnlocked, router]);

  if (!isLoaded || !isSignedIn || !isUnlocked) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ fontSize: 13, color: "var(--sub)", fontFamily: "var(--font-mono)" }}>Loading…</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", overflow: "hidden", background: "var(--bg)" }}>
        {children}
      </main>
      <InactivityLock />
    </div>
  );
}
