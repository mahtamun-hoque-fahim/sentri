"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useVaultStore } from "@/store/vault";
import Sidebar from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router     = useRouter();
  const isUnlocked = useVaultStore((s) => s.isUnlocked);

  useEffect(() => {
    if (!isUnlocked) {
      router.replace("/signin");
    }
  }, [isUnlocked, router]);

  if (!isUnlocked) {
    return (
      <div className="min-h-screen vault-pattern flex items-center justify-center">
        <div className="text-sentri-sub text-sm">Redirecting…</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-sentri-bg" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
