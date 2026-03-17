"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useVaultStore } from "@/store/vault";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard",  icon: "⊞",  label: "All Items"   },
  { href: "/dashboard?filter=login",  icon: "🔑",  label: "Logins"     },
  { href: "/dashboard?filter=card",   icon: "💳",  label: "Cards"      },
  { href: "/dashboard?filter=note",   icon: "📄",  label: "Notes"      },
  { href: "/dashboard?filter=ssh_key",icon: "🖥",  label: "SSH Keys"   },
  { href: "/generator", icon: "⚡",  label: "Generator"  },
];

export default function Sidebar() {
  const pathname   = usePathname();
  const router     = useRouter();
  const lock       = useVaultStore((s) => s.lock);
  const itemCount  = useVaultStore((s) => s.items.length);

  async function handleLock() {
    const supabase = createClient();
    await supabase.auth.signOut();
    lock();
    router.push("/signin");
  }

  return (
    <aside
      className="hidden md:flex flex-col w-60 shrink-0 border-r h-screen sticky top-0 py-5 px-3"
      style={{ background: "#FFFFFF", borderColor: "#E8EDEB" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 mb-7">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
          style={{ background: "linear-gradient(135deg, #006341, #004D32)" }}
        >
          S
        </div>
        <span
          className="text-lg font-semibold"
          style={{ fontFamily: "'DM Serif Display', serif", color: "#006341" }}
        >
          Sentri
        </span>
      </div>

      {/* New Item */}
      <Link
        href="/vault/new"
        className="flex items-center justify-center gap-2 mx-3 mb-5 py-2 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 active:scale-95"
        style={{ background: "linear-gradient(135deg, #006341, #004D32)" }}
      >
        <span className="text-base leading-none">+</span>
        New Item
      </Link>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1">
        <p className="text-xs font-medium uppercase tracking-widest px-3 mb-1" style={{ color: "#667085" }}>
          Vault
        </p>
        {NAV.map((item) => {
          const active = pathname === item.href || pathname + window?.location?.search === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "font-medium"
                  : "text-sentri-sub hover:bg-sentri-muted hover:text-sentri-text"
              )}
              style={active ? { background: "rgba(0,99,65,0.08)", color: "#006341" } : {}}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t pt-4 mt-4 px-3 flex flex-col gap-1" style={{ borderColor: "#E8EDEB" }}>
        <div
          className="text-xs px-2 py-1 rounded-md mb-1"
          style={{ background: "rgba(0,99,65,0.06)", color: "#006341" }}
        >
          {itemCount} item{itemCount !== 1 ? "s" : ""} in vault
        </div>
        <button
          onClick={handleLock}
          className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-sentri-sub hover:bg-sentri-muted hover:text-sentri-danger transition-colors w-full text-left"
        >
          <span>🔒</span>
          Lock &amp; Sign out
        </button>
      </div>
    </aside>
  );
}
