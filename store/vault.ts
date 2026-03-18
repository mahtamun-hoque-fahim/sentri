"use client";

import { create } from "zustand";
import { DecryptedVaultItem } from "@/types/vault";

interface VaultStore {
  vaultKey:     CryptoKey | null;
  isUnlocked:   boolean;
  isLoading:    boolean;
  items:        DecryptedVaultItem[];
  lastActivity: number;          // epoch ms — updated on user interaction

  // Settings (persisted to localStorage)
  autoLockMinutes: number;       // 0 = never

  setVaultKey:       (key: CryptoKey) => void;
  lock:              () => void;
  setItems:          (items: DecryptedVaultItem[]) => void;
  addItem:           (item: DecryptedVaultItem) => void;
  updateItem:        (id: string, item: DecryptedVaultItem) => void;
  removeItem:        (id: string) => void;
  setLoading:        (v: boolean) => void;
  touchActivity:     () => void;
  setAutoLock:       (minutes: number) => void;
}

function loadAutoLock(): number {
  if (typeof window === "undefined") return 15;
  return Number(localStorage.getItem("sentri_autolock") ?? "15");
}

export const useVaultStore = create<VaultStore>((set) => ({
  vaultKey:        null,
  isUnlocked:      false,
  isLoading:       false,
  items:           [],
  lastActivity:    Date.now(),
  autoLockMinutes: loadAutoLock(),

  setVaultKey:  (key)  => set({ vaultKey: key, isUnlocked: true, lastActivity: Date.now() }),
  lock:         ()     => set({ vaultKey: null, isUnlocked: false, items: [] }),
  setItems:     (items)=> set({ items }),
  addItem:      (item) => set((s) => ({ items: [item, ...s.items] })),
  updateItem:   (id, item) => set((s) => ({ items: s.items.map((i) => (i.id === id ? item : i)) })),
  removeItem:   (id)   => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  setLoading:   (v)    => set({ isLoading: v }),
  touchActivity:()     => set({ lastActivity: Date.now() }),
  setAutoLock:  (minutes) => {
    if (typeof window !== "undefined") localStorage.setItem("sentri_autolock", String(minutes));
    set({ autoLockMinutes: minutes });
  },
}));
