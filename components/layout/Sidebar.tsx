"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { useVaultStore } from "@/store/vault";
import { cn } from "@/lib/utils";
import {
  LayoutGrid, Key, CreditCard, FileText, Terminal,
  Zap, Shield, Users, Download, AlertTriangle, Settings,
  LogOut, Plus, Menu, X,
} from "lucide-react";

const VAULT_NAV = [
  { href: "/dashboard",                icon: LayoutGrid, label: "All Items"  },
  { href: "/dashboard?filter=login",   icon: Key,        label: "Logins"     },
  { href: "/dashboard?filter=card",    icon: CreditCard, label: "Cards"      },
  { href: "/dashboard?filter=note",    icon: FileText,   label: "Notes"      },
  { href: "/dashboard?filter=ssh_key", icon: Terminal,   label: "SSH Keys"   },
];

const TOOLS_NAV = [
  { href: "/generator",     icon: Zap,           label: "Generator"     },
  { href: "/watchtower",    icon: Shield,        label: "Watchtower"    },
  { href: "/shared",        icon: Users,         label: "Shared Vaults" },
  { href: "/import",        icon: Download,      label: "Import"        },
  { href: "/emergency-kit", icon: AlertTriangle, label: "Emergency Kit" },
  { href: "/settings",      icon: Settings,      label: "Settings"      },
];

function NavItem({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  const pathname = usePathname();
  const base     = href.split("?")[0];
  const active   = pathname === base || (pathname === "/dashboard" && href === "/dashboard");
  return (
    <Link href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all relative",
        active ? "nav-active font-medium" : "hover:bg-sentri-surface2"
      )}
      style={!active ? { color: "var(--sub)" } : { color: "var(--accent)" }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.color = "var(--text2)"; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.color = "var(--sub)"; }}>
      <Icon size={15} strokeWidth={active ? 2 : 1.7} />
      <span>{label}</span>
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
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 mb-6">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white"
          style={{ background: "var(--accent)", boxShadow: "0 2px 8px rgba(79,110,247,0.35)" }}>S</div>
        <span className="text-base font-semibold" style={{ color: "var(--text)" }}>Sentri</span>
      </div>

      {/* New Item */}
      <Link href="/vault/new"
        className="flex items-center justify-center gap-2 mx-3 mb-5 py-2 rounded-lg text-sm font-semibold btn-accent text-white"
        onClick={() => setMobileOpen(false)}>
        <Plus size={14} strokeWidth={2.5} />
        New Item
      </Link>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1 px-1">
        <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-1.5"
          style={{ color: "var(--border2)", letterSpacing: "0.1em", fontSize: "10px" }}>Vault</p>
        {VAULT_NAV.map((item) => <NavItem key={item.href} {...item} />)}

        <p className="text-xs font-semibold uppercase tracking-widest px-3 mt-5 mb-1.5"
          style={{ color: "var(--border2)", letterSpacing: "0.1em", fontSize: "10px" }}>Tools</p>
        {TOOLS_NAV.map((item) => <NavItem key={item.href} {...item} />)}
      </nav>

      {/* Footer */}
      <div className="px-4 pt-4 mt-4 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="text-xs px-2 py-1.5 rounded-md mb-2 font-mono"
          style={{ background: "rgba(79,110,247,0.07)", color: "var(--text2)", border: "1px solid rgba(79,110,247,0.12)" }}>
          <span style={{ color: "var(--success)" }}>●</span>
          {" "}{itemCount} item{itemCount !== 1 ? "s" : ""} encrypted
        </div>
        <button onClick={handleLock}
          className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm w-full text-left transition-colors"
          style={{ color: "var(--sub)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--danger)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--sub)"; }}>
          <LogOut size={14} />
          Lock &amp; Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r h-screen sticky top-0 py-5"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        {content}
      </aside>
      <button className="md:hidden fixed top-4 left-4 z-50 w-9 h-9 rounded-xl flex items-center justify-center border"
        style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--sub)" }}
        onClick={() => setMobileOpen(o => !o)}>
        {mobileOpen ? <X size={15} /> : <Menu size={15} />}
      </button>
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)} />
          <aside className="md:hidden fixed inset-y-0 left-0 z-50 flex flex-col w-56 border-r py-5"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            onClick={() => setMobileOpen(false)}>
            {content}
          </aside>
        </>
      )}
    </>
  );
}
