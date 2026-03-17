"use client";

import Link from "next/link";
import { DecryptedVaultItem, ItemType } from "@/types/vault";

const TYPE_META: Record<ItemType, { icon: string; label: string; color: string }> = {
  login:          { icon: "🔑", label: "Login",      color: "#006341" },
  card:           { icon: "💳", label: "Card",       color: "#C5A059" },
  note:           { icon: "📄", label: "Note",       color: "#667085" },
  ssh_key:        { icon: "🖥",  label: "SSH Key",   color: "#1A1F1E" },
  api_credential: { icon: "⚡", label: "API Key",    color: "#004D32" },
};

interface ItemCardProps {
  item: DecryptedVaultItem;
  onDelete?: (id: string) => void;
}

export default function ItemCard({ item }: ItemCardProps) {
  const meta = TYPE_META[item.item_type];

  // Extract subtitle based on type
  let subtitle = "";
  if (item.data.type === "login") {
    subtitle = item.data.username || (item.data.urls?.[0] ?? "");
  } else if (item.data.type === "card") {
    subtitle = item.data.number ? `•••• ${item.data.number.slice(-4)}` : "Credit card";
  } else if (item.data.type === "note") {
    subtitle = item.data.content?.slice(0, 40) ?? "";
  } else if (item.data.type === "ssh_key") {
    subtitle = item.data.fingerprint ?? "SSH Key pair";
  } else if (item.data.type === "api_credential") {
    subtitle = item.data.hostname ?? item.data.credential_type;
  }

  return (
    <Link
      href={`/vault/${item.id}`}
      className="group flex items-center gap-4 px-5 py-4 bg-white rounded-xl border transition-all hover:shadow-card hover:-translate-y-px animate-fade-up"
      style={{ borderColor: "#E8EDEB" }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
        style={{ background: `${meta.color}12` }}
      >
        {item.favicon_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.favicon_url} alt="" className="w-5 h-5 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        ) : (
          meta.icon
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-sentri-text truncate">{item.title}</p>
        <p className="text-xs text-sentri-sub truncate mt-0.5">{subtitle}</p>
      </div>

      {/* Type badge */}
      <span
        className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 hidden sm:inline-flex"
        style={{ background: `${meta.color}10`, color: meta.color }}
      >
        {meta.label}
      </span>

      {/* Arrow */}
      <span className="text-sentri-muted group-hover:text-sentri-sub transition-colors text-sm shrink-0">
        →
      </span>
    </Link>
  );
}
