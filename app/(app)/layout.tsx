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
      <div className="min-h-screen vault-pattern flex items-center justify-center">
        <div className="text-sm font-mono animate-pulse" style={{ color: "#8892A4" }}>Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: "#080B12" }}>
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {children}
      </main>
      <InactivityLock />
    </div>
  );
}
