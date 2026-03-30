"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useVaultStore } from "@/store/vault";
import { api } from "@/lib/api";
import { decryptData } from "@/lib/crypto";
import { DecryptedVaultItem, ItemType, VaultItemData } from "@/types/vault";
import Header from "@/components/layout/Header";
import ItemCard from "@/components/vault/ItemCard";
import EmptyVault from "@/components/vault/EmptyVault";
import VaultSkeleton from "@/components/vault/VaultSkeleton";
import { Key, CreditCard, FileText, Zap } from "lucide-react";

const FILTER_LABELS: Record<string, string> = {
  login: "Logins", card: "Cards", note: "Notes",
  ssh_key: "SSH Keys", api_credential: "API Keys",
};

const STATS = [
  { key: "login",                  label: "Logins",  Icon: Key,        color: "#00FF94" },
  { key: "card",                   label: "Cards",   Icon: CreditCard, color: "#00D4FF" },
  { key: "note",                   label: "Notes",   Icon: FileText,   color: "#8892A4" },
  { key: "ssh_key,api_credential", label: "SSH/API", Icon: Zap,        color: "#7B61FF" },
];

interface RawItem {
  id: string; itemType: ItemType; encryptedData: string; iv: string;
  titleEncrypted: string; titleIv: string; faviconUrl: string | null;
  createdAt: string; updatedAt: string;
}

export default function DashboardContent() {
  const searchParams = useSearchParams();
  const filter       = searchParams.get("filter") as ItemType | null;
  const { vaultKey, items, setItems, setLoading, isLoading } = useVaultStore();
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [error,  setError]  = useState("");

  useEffect(() => { if (vaultKey) loadItems(); }, [vaultKey]); // eslint-disable-line

  async function loadItems() {
    setLoading(true); setError("");
    try {
      const rows = await api.items.list() as RawItem[];
      if (!rows?.length) { setItems([]); setLoaded(true); return; }
      const decrypted = await Promise.all(rows.map(async (row): Promise<DecryptedVaultItem | null> => {
        try {
          const data  = await decryptData<VaultItemData>(vaultKey!, row.encryptedData, row.iv);
          const title = await decryptData<string>(vaultKey!, row.titleEncrypted, row.titleIv);
          return { id: row.id, title: title as unknown as string, itemType: row.itemType,
            faviconUrl: row.faviconUrl, createdAt: row.createdAt, updatedAt: row.updatedAt, data };
        } catch { return null; }
      }));
      setItems(decrypted.filter(Boolean) as DecryptedVaultItem[]);
    } catch (err: unknown) {
      setError("Could not load vault items. Try refreshing.");
      console.error(err);
    } finally { setLoading(false); setLoaded(true); }
  }

  const filtered = useMemo(() => {
    let list = items;
    if (filter) list = list.filter((i) => i.itemType === filter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.title.toLowerCase().includes(q) ||
        (i.data.type === "login" && (
          i.data.username?.toLowerCase().includes(q) ||
          i.data.urls?.some((u) => u.toLowerCase().includes(q))
        )));
    }
    return list;
  }, [items, filter, search]);

  const pageTitle = filter ? (FILTER_LABELS[filter] ?? "Vault") : "All Items";

  return (
    <>
      <Header title={pageTitle} showSearch onSearch={setSearch} />
      <div className="flex-1 px-6 py-6 max-w-3xl w-full mx-auto">
        {!filter && loaded && items.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {STATS.map((stat) => {
              const keys  = stat.key.split(",");
              const count = items.filter((i) => keys.includes(i.itemType)).length;
              return (
                <div key={stat.key} className="flex items-center gap-3 p-3.5 rounded-xl border animate-fade-up"
                  style={{ background: "#0F1117", borderColor: "#2A3244" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${stat.color}12`, border: `1px solid ${stat.color}22` }}>
                    <stat.Icon size={14} style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p className="text-xl font-bold leading-none font-mono" style={{ color: stat.color }}>{count}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#8892A4" }}>{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl border text-sm"
            style={{ background: "rgba(255,77,106,0.08)", borderColor: "rgba(255,77,106,0.25)", color: "#FF4D6A" }}>{error}</div>
        )}
        {isLoading && <VaultSkeleton count={6} />}
        {!isLoading && loaded && items.length === 0 && !search && <EmptyVault />}
        {!isLoading && loaded && filtered.length === 0 && search && (
          <div className="text-center py-16">
            <p className="text-sm font-mono" style={{ color: "#8892A4" }}>
              No results for <span className="font-bold" style={{ color: "#E8EDF5" }}>&ldquo;{search}&rdquo;</span>
            </p>
          </div>
        )}
        {!isLoading && filtered.length > 0 && (
          <div className="flex flex-col gap-2">
            {filtered.map((item, i) => (
              <div key={item.id} className="animate-fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                <ItemCard item={item} />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
