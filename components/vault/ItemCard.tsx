"use client";

import Link from "next/link";
import { Key, CreditCard, FileText, Terminal, Zap, ChevronRight } from "lucide-react";
import { DecryptedVaultItem, ItemType } from "@/types/vault";

const TYPE_META: Record<ItemType, { icon: React.ElementType; label: string; color: string; glow: string }> = {
  login:          { icon: Key,        label: "Login",   color: "#00FF94", glow: "rgba(0,255,148,0.12)" },
  card:           { icon: CreditCard, label: "Card",    color: "#00D4FF", glow: "rgba(0,212,255,0.12)" },
  note:           { icon: FileText,   label: "Note",    color: "#8892A4", glow: "rgba(136,146,164,0.12)" },
  ssh_key:        { icon: Terminal,   label: "SSH Key", color: "#7B61FF", glow: "rgba(123,97,255,0.12)" },
  api_credential: { icon: Zap,        label: "API Key", color: "#FFB547", glow: "rgba(255,181,71,0.12)" },
};

interface ItemCardProps {
  item: DecryptedVaultItem;
}

export default function ItemCard({ item }: ItemCardProps) {
  const meta = TYPE_META[item.itemType];
  const Icon = meta.icon;

  let subtitle = "";
  if (item.data.type === "login")          subtitle = item.data.username || (item.data.urls?.[0] ?? "");
  else if (item.data.type === "card")      subtitle = item.data.number ? `•••• ${item.data.number.slice(-4)}` : "Credit card";
  else if (item.data.type === "note")      subtitle = item.data.content?.slice(0, 40) ?? "";
  else if (item.data.type === "ssh_key")   subtitle = item.data.fingerprint ?? "SSH Key pair";
  else if (item.data.type === "api_credential") subtitle = item.data.hostname ?? item.data.credential_type;

  return (
    <Link href={`/vault/${item.id}`}
      className="group flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all animate-fade-up"
      style={{
        background: "#161B27",
        borderColor: "#2A3244",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = `rgba(${meta.color === "#00FF94" ? "0,255,148" : meta.color === "#00D4FF" ? "0,212,255" : meta.color === "#7B61FF" ? "123,97,255" : meta.color === "#FFB547" ? "255,181,71" : "136,146,164"},0.35)`;
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 0 16px ${meta.glow}`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = "#2A3244";
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
      }}>
      {/* Icon */}
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: meta.glow, border: `1px solid ${meta.color}22` }}>
        {item.faviconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.faviconUrl} alt="" className="w-5 h-5 rounded"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <Icon size={15} style={{ color: meta.color }} strokeWidth={2} />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "#E8EDF5" }}>{item.title}</p>
        <p className="text-xs truncate mt-0.5 font-mono" style={{ color: "#8892A4", fontSize: "11px" }}>{subtitle}</p>
      </div>

      {/* Badge */}
      <span className="text-xs px-2 py-0.5 rounded font-mono font-bold hidden sm:inline-flex"
        style={{ background: meta.glow, color: meta.color, border: `1px solid ${meta.color}33`, fontSize: "10px" }}>
        {meta.label}
      </span>

      <ChevronRight size={14} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: "#8892A4" }} />
    </Link>
  );
}
