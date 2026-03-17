"use client";

import { useState } from "react";
import Link from "next/link";

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
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 border-b bg-white/80 backdrop-blur-sm"
      style={{ borderColor: "#E8EDEB" }}
    >
      <h1
        className="text-lg font-semibold text-sentri-text"
        style={{ fontFamily: "'DM Serif Display', serif" }}
      >
        {title}
      </h1>

      <div className="flex items-center gap-3">
        {showSearch && (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sentri-sub text-sm">
              🔍
            </span>
            <input
              type="text"
              value={q}
              onChange={handleSearch}
              placeholder="Search vault…"
              className="pl-9 pr-4 py-1.5 rounded-lg border text-sm outline-none w-52 transition-shadow"
              style={{ borderColor: "#E8EDEB", background: "#F7F9F8" }}
              onFocus={(e) => (e.target.style.boxShadow = "0 0 0 3px rgba(0,99,65,0.15)")}
              onBlur={(e)  => (e.target.style.boxShadow = "none")}
            />
          </div>
        )}

        <Link
          href="/vault/new"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-sm font-medium transition-all hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg, #006341, #004D32)" }}
        >
          <span className="text-base leading-none">+</span>
          Add
        </Link>
      </div>
    </header>
  );
}
