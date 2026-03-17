"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useVaultStore } from "@/store/vault";
import { createClient } from "@/lib/supabase";
import { decryptData } from "@/lib/crypto";
import { VaultItemRow, DecryptedVaultItem, ItemType, VaultItemData } from "@/types/vault";
import Header from "@/components/layout/Header";
import ItemCard from "@/components/vault/ItemCard";
import EmptyVault from "@/components/vault/EmptyVault";
import VaultSkeleton from "@/components/vault/VaultSkeleton";

const FILTER_LABELS: Record<string, string> = {
  login:          "Logins",
  card:           "Cards",
  note:           "Notes",
  ssh_key:        "SSH Keys",
  api_credential: "API Keys",
};

export default function DashboardContent() {
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter") as ItemType | null;

  const { vaultKey, items, setItems, setLoading, isLoading } = useVaultStore();
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [error,  setError]  = useState("");

  useEffect(() => {
    if (!vaultKey) return;
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vaultKey]);

  async function loadItems() {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: rows, error: fetchError } = await supabase
        .from("vault_items")
        .select("*")
        .order("updated_at", { ascending: false });

      if (fetchError) throw fetchError;
      if (!rows || rows.length === 0) {
        setItems([]);
        setLoaded(true);
        return;
      }

      const decrypted = await Promise.all(
        (rows as VaultItemRow[]).map(async (row): Promise<DecryptedVaultItem | null> => {
          try {
            const data  = await decryptData<VaultItemData>(vaultKey!, row.encrypted_data, row.iv);
            const title = await decryptData<string>(vaultKey!, row.title_encrypted, row.title_iv);
            return {
              id:          row.id,
              title:       title as unknown as string,
              item_type:   row.item_type,
              favicon_url: row.favicon_url,
              created_at:  row.created_at,
              updated_at:  row.updated_at,
              data,
            };
          } catch { return null; }
        })
      );

      setItems(decrypted.filter(Boolean) as DecryptedVaultItem[]);
    } catch (err: unknown) {
      setError("Could not load vault items. Try refreshing.");
      console.error(err);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }

  const filtered = useMemo(() => {
    let list = items;
    if (filter) list = list.filter((i) => i.item_type === filter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((i) =>
        i.title.toLowerCase().includes(q) ||
        (i.data.type === "login" && (
          i.data.username?.toLowerCase().includes(q) ||
          i.data.urls?.some((u) => u.toLowerCase().includes(q))
        ))
      );
    }
    return list;
  }, [items, filter, search]);

  const pageTitle = filter ? FILTER_LABELS[filter] ?? "Vault" : "All Items";

  return (
    <>
      <Header title={pageTitle} showSearch onSearch={setSearch} />
      <div className="flex-1 px-6 py-6 max-w-3xl w-full mx-auto">

        {/* Stats */}
        {!filter && loaded && items.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Logins",  count: items.filter((i) => i.item_type === "login").length,  icon: "🔑", color: "#006341" },
              { label: "Cards",   count: items.filter((i) => i.item_type === "card").length,   icon: "💳", color: "#C5A059" },
              { label: "Notes",   count: items.filter((i) => i.item_type === "note").length,   icon: "📄", color: "#667085" },
              { label: "SSH/API", count: items.filter((i) => ["ssh_key","api_credential"].includes(i.item_type)).length, icon: "⚡", color: "#004D32" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 p-3.5 bg-white rounded-xl border" style={{ borderColor: "#E8EDEB" }}>
                <span className="text-xl">{stat.icon}</span>
                <div>
                  <p className="text-xl font-semibold text-sentri-text leading-none">{stat.count}</p>
                  <p className="text-xs text-sentri-sub mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm border"
            style={{ background: "#FFF1F0", borderColor: "#FECAC7", color: "#D93025" }}>
            {error}
          </div>
        )}

        {isLoading && <VaultSkeleton count={6} />}

        {!isLoading && loaded && filtered.length === 0 && !search && <EmptyVault />}

        {!isLoading && loaded && filtered.length === 0 && search && (
          <div className="text-center py-16 text-sentri-sub text-sm">
            No results for &ldquo;{search}&rdquo;
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
