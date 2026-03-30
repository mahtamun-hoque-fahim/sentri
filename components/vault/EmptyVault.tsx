"use client";

import Link from "next/link";
import { ShieldOff, Plus } from "lucide-react";

export default function EmptyVault() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "rgba(0,255,148,0.06)", border: "1px solid rgba(0,255,148,0.12)" }}>
        <ShieldOff size={28} style={{ color: "#2A3244" }} />
      </div>
      <h3 className="text-base font-bold mb-2" style={{ color: "#E8EDF5" }}>Your vault is empty</h3>
      <p className="text-sm mb-6 max-w-xs leading-relaxed" style={{ color: "#8892A4" }}>
        Add your first login, card, or secure note to get started.
      </p>
      <Link href="/vault/new"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:shadow-neon active:scale-95 btn-neon">
        <Plus size={14} strokeWidth={2.5} />
        Add First Item
      </Link>
    </div>
  );
}
