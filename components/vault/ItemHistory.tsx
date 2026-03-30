"use client";

import { useState } from "react";
import { useVaultStore } from "@/store/vault";
import { api } from "@/lib/api";
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
    const data = await api.history.list(itemId) as HistoryRow[];
    setRows(data ?? []);
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
        <p><span className="">User:</span> {data.username}</p>
        <p><span className="">Pass:</span> {"•".repeat(Math.min(data.password.length, 16))}</p>
      </div>
    );
    if (data.type === "card") return (
      <div className="text-xs space-y-1">
        <p><span className="">Card:</span> •••• {data.number.slice(-4)}</p>
        <p><span className="">Exp:</span> {data.expiry}</p>
      </div>
    );
    return <p className="text-xs ">{data.type} item</p>;
  }

  return (
    <div className="border-t pt-4 mt-2" style={{ borderColor: "#2A3244" }}>
      <button
        onClick={toggle}
        className="flex items-center gap-2 text-sm font-medium transition-colors w-full text-left"
        style={{ color: "#8892A4" }}
      >
        <span className="text-base" style={{ transform: open ? "rotate(90deg)" : "none", display: "inline-block", transition: "transform 0.2s" }}>›</span>
        Version history
        {rows.length > 0 && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
            style={{ background: "#2A3244", color: "#8892A4" }}>
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
            <p className="text-xs  py-2">No history yet. History is saved when you edit an item.</p>
          )}
          {!loading && rows.map((row) => (
            <div key={row.id}>
              <button
                onClick={() => expandRow(row)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-colors hover:"
                style={{ borderColor: "#2A3244" }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🕐</span>
                  <div>
                    <p className="text-xs font-medium ">
                      {new Date(row.changed_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    <p className="text-xs ">
                      {new Date(row.changed_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <span className=" text-xs">{expanded === row.id ? "Hide" : "View"}</span>
              </button>

              {expanded === row.id && decrypted[row.id] && (
                <div
                  className="mt-1 mx-1 px-4 py-3 rounded-xl border"
                  style={{ background: "#080B12", borderColor: "#2A3244" }}
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
