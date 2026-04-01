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
    <header className="pl-16 lg:pl-6" style={{
      position: "sticky", top: 0, zIndex: 30,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 24px",
      borderBottom: "1px solid var(--border)",
      background: "var(--bg)",
      backdropFilter: "blur(8px)",
    }}>
      <h1 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: 0 }}>{title}</h1>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {showSearch && (
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--sub)", pointerEvents: "none" }} />
            <input
              type="text"
              value={q}
              onChange={e => { setQ(e.target.value); onSearch?.(e.target.value); }}
              placeholder="Search vault…"
              className="vault-input"
              style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 6, paddingBottom: 6, fontSize: 12, width: 192, borderRadius: 8 }}
            />
          </div>
        )}
        <ThemeToggle />
        <Link
          href="/vault/new"
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "6px 12px", borderRadius: 8,
            fontSize: 12, fontWeight: 600,
            background: "var(--accent)", color: "var(--bg)",
            textDecoration: "none", transition: "opacity 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          <Plus size={13} strokeWidth={2.5} />
          Add
        </Link>
      </div>
    </header>
  );
}
