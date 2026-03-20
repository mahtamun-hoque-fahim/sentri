"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { useVaultStore } from "@/store/vault";
import { cn } from "@/lib/utils";

const VAULT_NAV = [
  { href: "/dashboard",                icon: "⊞",  label: "All Items"  },
  { href: "/dashboard?filter=login",   icon: "🔑",  label: "Logins"     },
  { href: "/dashboard?filter=card",    icon: "💳",  label: "Cards"      },
  { href: "/dashboard?filter=note",    icon: "📄",  label: "Notes"      },
  { href: "/dashboard?filter=ssh_key", icon: "🖥",   label: "SSH Keys"   },
];

const TOOLS_NAV = [
  { href: "/generator",     icon: "⚡",  label: "Generator"     },
  { href: "/watchtower",    icon: "🛡",   label: "Watchtower"    },
  { href: "/shared",        icon: "👥",  label: "Shared Vaults" },
  { href: "/import",        icon: "📥",  label: "Import"        },
  { href: "/emergency-kit", icon: "🆘",  label: "Emergency Kit" },
  { href: "/settings",      icon: "⚙",   label: "Settings"      },
];

function NavLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  const pathname = usePathname();
  const base     = href.split("?")[0];
  const active   = pathname === base || (pathname === "/dashboard" && href === "/dashboard");
  return (
    <Link href={href}
      className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
        active ? "font-medium" : "text-sentri-sub hover:bg-sentri-muted hover:text-sentri-text")}
      style={active ? { background: "rgba(0,99,65,0.08)", color: "#006341" } : {}}>
      <span className="text-base w-5 text-center leading-none">{icon}</span>
      {label}
    </Link>
  );
}

export default function Sidebar() {
  const router    = useRouter();
  const { signOut } = useClerk();
  const lock      = useVaultStore((s) => s.lock);
  const itemCount = useVaultStore((s) => s.items.length);
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLock() {
    lock();
    await signOut();
    router.push("/signin");
  }

  const content = (
    <>
      <div className="flex items-center gap-2 px-3 mb-7">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
          style={{ background: "linear-gradient(135deg, #006341, #004D32)" }}>S</div>
        <span className="text-lg font-semibold"
          style={{ fontFamily: "'DM Serif Display', serif", color: "#006341" }}>Sentri</span>
      </div>

      <Link href="/vault/new"
        className="flex items-center justify-center gap-2 mx-3 mb-5 py-2 rounded-xl text-white text-sm font-medium hover:opacity-90 active:scale-95"
        style={{ background: "linear-gradient(135deg, #006341, #004D32)" }}
        onClick={() => setMobileOpen(false)}>
        <span className="text-base leading-none">+</span>New Item
      </Link>

      <nav className="flex flex-col gap-0.5 flex-1">
        <p className="text-xs font-medium uppercase tracking-widest px-3 mb-1" style={{ color: "#667085" }}>Vault</p>
        {VAULT_NAV.map((item) => <NavLink key={item.href} {...item} />)}
        <p className="text-xs font-medium uppercase tracking-widest px-3 mt-4 mb-1" style={{ color: "#667085" }}>Tools</p>
        {TOOLS_NAV.map((item) => <NavLink key={item.href} {...item} />)}
      </nav>

      <div className="border-t pt-4 mt-4 px-3 flex flex-col gap-1" style={{ borderColor: "#E8EDEB" }}>
        <div className="text-xs px-2 py-1 rounded-md mb-1"
          style={{ background: "rgba(0,99,65,0.06)", color: "#006341" }}>
          {itemCount} item{itemCount !== 1 ? "s" : ""} in vault
        </div>
        <button onClick={handleLock}
          className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-sentri-sub hover:bg-sentri-muted hover:text-sentri-danger transition-colors w-full text-left">
          <span>🔒</span>Lock &amp; Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r h-screen sticky top-0 py-5 px-3"
        style={{ background: "#FFFFFF", borderColor: "#E8EDEB" }}>
        {content}
      </aside>
      <button className="md:hidden fixed top-4 left-4 z-50 w-9 h-9 rounded-xl flex items-center justify-center border bg-white shadow-card"
        style={{ borderColor: "#E8EDEB" }}
        onClick={() => setMobileOpen((o) => !o)}>
        <span className="text-lg">{mobileOpen ? "✕" : "☰"}</span>
      </button>
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="md:hidden fixed inset-y-0 left-0 z-50 flex flex-col w-64 border-r py-5 px-3"
            style={{ background: "#FFFFFF", borderColor: "#E8EDEB" }}
            onClick={() => setMobileOpen(false)}>
            {content}
          </aside>
        </>
      )}
    </>
  );
}
