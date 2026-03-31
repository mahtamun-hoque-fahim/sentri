"use client";

import Link from "next/link";
import { Key, CreditCard, FileText, Terminal, Zap, ChevronRight } from "lucide-react";
import { DecryptedVaultItem, ItemType } from "@/types/vault";

const TYPE_META: Record<ItemType, { icon: React.ElementType; label: string; color: string }> = {
  login:          { icon: Key,        label: "Login",   color: "var(--accent)" },
  card:           { icon: CreditCard, label: "Card",    color: "#C8A96A" },
  note:           { icon: FileText,   label: "Note",    color: "#6B7A99" },
  ssh_key:        { icon: Terminal,   label: "SSH Key", color: "#A78BFA" },
  api_credential: { icon: Zap,        label: "API Key", color: "#F5A623" },
};

export default function ItemCard({ item }: { item: DecryptedVaultItem }) {
  const meta = TYPE_META[item.itemType];
  const Icon = meta.icon;

  let subtitle = "";
  if (item.data.type === "login")               subtitle = item.data.username || (item.data.urls?.[0] ?? "");
  else if (item.data.type === "card")           subtitle = item.data.number ? `•••• ${item.data.number.slice(-4)}` : "Credit card";
  else if (item.data.type === "note")           subtitle = item.data.content?.slice(0, 50) ?? "";
  else if (item.data.type === "ssh_key")        subtitle = item.data.fingerprint ?? "SSH Key pair";
  else if (item.data.type === "api_credential") subtitle = item.data.hostname ?? item.data.credential_type;

  return (
    <Link href={`/vault/${item.id}`}
      className="group flex items-center gap-3.5 px-4 py-3.5 rounded-xl border transition-all animate-fade-up vault-card"
      style={{ textDecoration: "none" }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
        style={{ background: `${meta.color}12`, border: `1px solid ${meta.color}22` }}>
        {item.faviconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.faviconUrl} alt="" className="w-5 h-5 rounded-md"
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <Icon size={15} style={{ color: meta.color }} strokeWidth={1.8} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{item.title}</p>
        <p className="text-xs truncate mt-0.5 font-mono" style={{ color: "var(--sub)", fontSize: "11px" }}>{subtitle}</p>
      </div>

      <span className="text-xs px-2 py-0.5 rounded-md font-medium hidden sm:inline-flex"
        style={{ background: `${meta.color}10`, color: meta.color, border: `1px solid ${meta.color}20`, fontSize: "10px" }}>
        {meta.label}
      </span>

      <ChevronRight size={14} className="flex-shrink-0 opacity-0 group-hover:opacity-50 transition-opacity"
        style={{ color: "var(--sub)" }} />
    </Link>
  );
}
