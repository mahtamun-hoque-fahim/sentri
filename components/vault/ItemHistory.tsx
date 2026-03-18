"use client";

import { useState } from "react";
import { useVaultStore } from "@/store/vault";
import { createClient } from "@/lib/supabase";
import { decryptData } from "@/lib/crypto";
import { VaultItemData } from "@/types/vault";

interface HistoryRow {
  id:             string;
  encrypted_data: string;
  iv:             string;
  changed_at:     string;
}

interface ItemHistoryProps {
  itemId: string;
}

export default function ItemHistory({ itemId }: ItemHistoryProps) {
  const vaultKey = useVaultStore((s) => s.vaultKey);
  const [open,    setOpen]    = useState(false);
  const [rows,    setRows]    = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [decrypted, setDecrypted] = useState<Record<string, VaultItemData>>({});

  async function load() {
    if (!vaultKey) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("item_history")
      .select("id, encrypted_data, iv, changed_at")
      .eq("item_id", itemId)
      .order("changed_at", { ascending: false })
      .limit(10);

    setRows((data as HistoryRow[]) ?? []);
    setLoading(false);
  }

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && rows.length === 0) await load();
  }

  async function expandRow(row: HistoryRow) {
    if (expanded === row.id) { setExpanded(null); return; }
    if (!decrypted[row.id] && vaultKey) {
      try {
        const data = await decryptData<VaultItemData>(vaultKey, row.encrypted_data, row.iv);
        setDecrypted((d) => ({ ...d, [row.id]: data }));
      } catch { /* ignore */ }
    }
    setExpanded(row.id);
  }

  function renderData(data: VaultItemData) {
    if (data.type === "login") return (
      <div className="text-xs space-y-1">
        <p><span className="text-sentri-sub">User:</span> {data.username}</p>
        <p><span className="text-sentri-sub">Pass:</span> {"•".repeat(Math.min(data.password.length, 16))}</p>
      </div>
    );
    if (data.type === "card") return (
      <div className="text-xs space-y-1">
        <p><span className="text-sentri-sub">Card:</span> •••• {data.number.slice(-4)}</p>
        <p><span className="text-sentri-sub">Exp:</span> {data.expiry}</p>
      </div>
    );
    return <p className="text-xs text-sentri-sub">{data.type} item</p>;
  }

  return (
    <div className="border-t pt-4 mt-2" style={{ borderColor: "#E8EDEB" }}>
      <button
        onClick={toggle}
        className="flex items-center gap-2 text-sm font-medium transition-colors w-full text-left"
        style={{ color: "#667085" }}
      >
        <span className="text-base" style={{ transform: open ? "rotate(90deg)" : "none", display: "inline-block", transition: "transform 0.2s" }}>›</span>
        Version history
        {rows.length > 0 && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
            style={{ background: "#E8EDEB", color: "#667085" }}>
            {rows.length}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-2">
          {loading && (
            <div className="flex flex-col gap-2">
              {[1,2].map((i) => <div key={i} className="shimmer h-12 rounded-xl" />)}
            </div>
          )}
          {!loading && rows.length === 0 && (
            <p className="text-xs text-sentri-sub py-2">No history yet. History is saved when you edit an item.</p>
          )}
          {!loading && rows.map((row) => (
            <div key={row.id}>
              <button
                onClick={() => expandRow(row)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-colors hover:bg-sentri-bg"
                style={{ borderColor: "#E8EDEB" }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🕐</span>
                  <div>
                    <p className="text-xs font-medium text-sentri-text">
                      {new Date(row.changed_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    <p className="text-xs text-sentri-sub">
                      {new Date(row.changed_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <span className="text-sentri-sub text-xs">{expanded === row.id ? "Hide" : "View"}</span>
              </button>

              {expanded === row.id && decrypted[row.id] && (
                <div
                  className="mt-1 mx-1 px-4 py-3 rounded-xl border"
                  style={{ background: "#F7F9F8", borderColor: "#E8EDEB" }}
                >
                  {renderData(decrypted[row.id])}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
