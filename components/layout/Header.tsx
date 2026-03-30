"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus } from "lucide-react";

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
  onSearch?: (q: string) => void;
}

export default function Header({ title = "Vault", showSearch = true, onSearch }: HeaderProps) {
  const [q, setQ] = useState("");

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setQ(e.target.value);
    onSearch?.(e.target.value);
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 border-b backdrop-blur-sm"
      style={{ background: "rgba(8,11,18,0.85)", borderColor: "#1E2535" }}>
      <h1 className="text-base font-bold tracking-tight" style={{ color: "#E8EDF5", fontFamily: "Space Grotesk" }}>
        {title}
      </h1>

      <div className="flex items-center gap-3">
        {showSearch && (
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "#8892A4" }} />
            <input
              type="text"
              value={q}
              onChange={handleSearch}
              placeholder="Search vault…"
              className="pl-8 pr-4 py-1.5 rounded-lg border text-sm outline-none w-52 transition-all font-mono"
              style={{
                background: "#161B27",
                borderColor: "#2A3244",
                color: "#E8EDF5",
                fontSize: "12px",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(0,255,148,0.4)";
                e.target.style.boxShadow = "0 0 0 3px rgba(0,255,148,0.08)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#2A3244";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>
        )}
        <Link href="/vault/new"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all hover:shadow-neon active:scale-95 btn-neon"
          style={{ fontSize: "12px" }}>
          <Plus size={13} strokeWidth={2.5} />
          Add
        </Link>
      </div>
    </header>
  );
}
