"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { useVaultStore } from "@/store/vault";
import {
  LayoutGrid, Key, CreditCard, FileText, Terminal,
  Zap, Shield, Users, Download, AlertTriangle, Settings,
  LogOut, Plus, Menu, X,
} from "lucide-react";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { SentriLogo } from "@/components/ui/SentriLogo";

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
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "7px 12px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: active ? 500 : 400,
        color: active ? "var(--accent)" : "var(--sub)",
        background: active ? "var(--accent-dim)" : "transparent",
        borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
        transition: "color 0.15s, background 0.15s",
        textDecoration: "none",
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLAnchorElement).style.color = "var(--text2)";
          (e.currentTarget as HTMLAnchorElement).style.background = "var(--surface2)";
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLAnchorElement).style.color = "var(--sub)";
          (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
        }
      }}
    >
      <Icon size={15} strokeWidth={active ? 2 : 1.6} />
      <span>{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const router      = useRouter();
  const { signOut } = useClerk();
  const lock        = useVaultStore((s) => s.lock);
  const itemCount   = useVaultStore((s) => s.items.length);
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLock() {
    lock();
    await signOut();
    router.push("/signin");
  }

  const content = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* Logo */}
      <div style={{ padding: "0 20px", marginBottom: "20px", display: "flex", alignItems: "center", height: 40 }}>
        <SentriLogo height={22} />
      </div>

      {/* New Item button */}
      <Link
        href="/vault/new"
        onClick={() => setMobileOpen(false)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          margin: "0 12px 16px",
          padding: "8px 0",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          background: "var(--accent)",
          color: "var(--bg)",
          textDecoration: "none",
          transition: "opacity 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
      >
        <Plus size={14} strokeWidth={2.5} />
        New Item
      </Link>

      {/* Nav */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1, padding: "0 8px" }}>
        <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", padding: "0 12px", marginBottom: 4, color: "var(--border2)" }}>
          Vault
        </p>
        {VAULT_NAV.map(item => <NavItem key={item.href} {...item} />)}

        <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", padding: "0 12px", marginTop: 20, marginBottom: 4, color: "var(--border2)" }}>
          Tools
        </p>
        {TOOLS_NAV.map(item => <NavItem key={item.href} {...item} />)}
      </nav>

      {/* Footer */}
      <div style={{ padding: "12px 12px 0", marginTop: 12, borderTop: "1px solid var(--border)" }}>
        {/* Vault status */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 10px", borderRadius: 7, marginBottom: 6,
          background: "var(--accent-dim)",
          border: "1px solid color-mix(in srgb, var(--accent) 15%, transparent)",
          fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text2)",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", flexShrink: 0 }} />
          {itemCount} item{itemCount !== 1 ? "s" : ""} encrypted
        </div>

        {/* Theme + Lock row */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <ThemeToggle />
          <button
            onClick={handleLock}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              flex: 1, padding: "7px 8px", borderRadius: 7,
              background: "transparent", border: "none", cursor: "pointer",
              fontSize: 13, color: "var(--sub)", textAlign: "left",
              transition: "color 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--danger)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--sub)")}
          >
            <LogOut size={14} />
            Lock &amp; Sign out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        style={{
          flexDirection: "column",
          width: 220,
          flexShrink: 0,
          borderRight: "1px solid var(--border)",
          height: "100vh",
          position: "sticky",
          top: 0,
          padding: "20px 0",
          background: "var(--surface)",
        }}
        className="hidden lg:flex"
      >
        {content}
      </aside>

      {/* Mobile toggle */}
      <button
        className="lg:hidden"
        style={{
          position: "fixed", top: 16, left: 16, zIndex: 50,
          width: 36, height: 36, borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "var(--surface)", border: "1px solid var(--border)",
          color: "var(--sub)", cursor: "pointer",
        }}
        onClick={() => setMobileOpen(o => !o)}
      >
        {mobileOpen ? <X size={15} /> : <Menu size={15} />}
      </button>

      {/* Mobile overlay + sidebar */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden"
            style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.5)" }}
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="lg:hidden"
            style={{
              position: "fixed", insetBlock: 0, left: 0, zIndex: 50,
              width: 220, padding: "20px 0",
              background: "var(--surface)", borderRight: "1px solid var(--border)",
            }}
            onClick={() => setMobileOpen(false)}
          >
            {content}
          </aside>
        </>
      )}
    </>
  );
}
