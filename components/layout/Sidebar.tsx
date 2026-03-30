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
  Lock, Plus, Menu, X, ChevronRight,
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

function NavLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  const pathname = usePathname();
  const base     = href.split("?")[0];
  const active   = pathname === base || (pathname === "/dashboard" && href === "/dashboard");
  return (
    <Link href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all group relative",
        active
          ? "text-sentri-primary font-medium"
          : "text-sentri-sub hover:text-sentri-text"
      )}
      style={active ? {
        background: "rgba(0,255,148,0.08)",
        boxShadow: "inset 0 0 0 1px rgba(0,255,148,0.15)",
      } : {}}>
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full"
          style={{ background: "#00FF94" }} />
      )}
      <Icon size={15} strokeWidth={active ? 2.5 : 1.8} />
      <span>{label}</span>
      {active && <ChevronRight size={12} className="ml-auto opacity-50" />}
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
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 mb-7">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #00FF94, #00CC77)", color: "#080B12" }}>
          S
          <span className="absolute inset-0 opacity-20"
            style={{ background: "linear-gradient(135deg, transparent, rgba(255,255,255,0.4))" }} />
        </div>
        <span className="text-lg font-bold tracking-tight" style={{ color: "#00FF94", fontFamily: "Space Grotesk" }}>
          Sentri
        </span>
        <span className="ml-auto text-xs px-1.5 py-0.5 rounded font-mono"
          style={{ background: "rgba(0,255,148,0.1)", color: "#00FF94", border: "1px solid rgba(0,255,148,0.2)" }}>
          v1
        </span>
      </div>

      {/* New Item button */}
      <Link href="/vault/new"
        className="flex items-center justify-center gap-2 mx-3 mb-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:shadow-neon active:scale-95 btn-neon"
        onClick={() => setMobileOpen(false)}>
        <Plus size={15} strokeWidth={2.5} />
        New Item
      </Link>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1">
        <p className="text-xs font-bold uppercase tracking-widest px-3 mb-1.5 font-mono"
          style={{ color: "#2A3244", letterSpacing: "0.12em" }}>Vault</p>
        {VAULT_NAV.map((item) => <NavLink key={item.href} {...item} />)}
        <p className="text-xs font-bold uppercase tracking-widest px-3 mt-5 mb-1.5 font-mono"
          style={{ color: "#2A3244", letterSpacing: "0.12em" }}>Tools</p>
        {TOOLS_NAV.map((item) => <NavLink key={item.href} {...item} />)}
      </nav>

      {/* Footer */}
      <div className="border-t pt-4 mt-4 px-3 flex flex-col gap-2"
        style={{ borderColor: "#1E2535" }}>
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-mono"
          style={{ background: "rgba(0,255,148,0.05)", border: "1px solid rgba(0,255,148,0.1)", color: "#00FF94" }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse-glow flex-shrink-0"
            style={{ background: "#00FF94" }} />
          {itemCount} item{itemCount !== 1 ? "s" : ""} encrypted
        </div>
        <button onClick={handleLock}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all w-full text-left group"
          style={{ color: "#8892A4" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#FF4D6A")}
          onMouseLeave={e => (e.currentTarget.style.color = "#8892A4")}>
          <Lock size={14} />
          Lock &amp; Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r h-screen sticky top-0 py-5 px-3"
        style={{ background: "#0F1117", borderColor: "#1E2535" }}>
        {content}
      </aside>
      <button className="md:hidden fixed top-4 left-4 z-50 w-9 h-9 rounded-xl flex items-center justify-center border"
        style={{ background: "#0F1117", borderColor: "#2A3244", color: "#8892A4" }}
        onClick={() => setMobileOpen((o) => !o)}>
        {mobileOpen ? <X size={16} /> : <Menu size={16} />}
      </button>
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)} />
          <aside className="md:hidden fixed inset-y-0 left-0 z-50 flex flex-col w-64 border-r py-5 px-3"
            style={{ background: "#0F1117", borderColor: "#1E2535" }}
            onClick={() => setMobileOpen(false)}>
            {content}
          </aside>
        </>
      )}
    </>
  );
}
