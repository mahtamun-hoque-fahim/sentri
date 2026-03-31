"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import ThemeToggle from "@/components/layout/ThemeToggle";

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
  onSearch?: (q: string) => void;
}

export default function Header({ title = "Vault", showSearch = true, onSearch }: HeaderProps) {
  const [q, setQ] = useState("");

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 border-b backdrop-blur-sm"
      style={{ background: "rgba(10,14,23,0.9)", borderColor: "var(--border)" }}>
      <h1 className="text-sm font-semibold" style={{ color: "var(--text)" }}>{title}</h1>
      <div className="flex items-center gap-2">
        {showSearch && (
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--sub)" }} />
            <input type="text" value={q}
              onChange={e => { setQ(e.target.value); onSearch?.(e.target.value); }}
              placeholder="Search vault…"
              className="vault-input pl-8 pr-4 py-1.5 text-xs w-48"
              style={{ borderRadius: "8px" }} />
          </div>
        )}
        <ThemeToggle />
        <Link href="/vault/new"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold btn-accent">
          <Plus size={13} strokeWidth={2.5} />
          Add
        </Link>
      </div>
    </header>
  );
}
