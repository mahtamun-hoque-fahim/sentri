"use client";

import { create } from "zustand";
import { DecryptedVaultItem } from "@/types/vault";

interface VaultStore {
  // The derived AES-256 key — lives in memory only, cleared on lock/tab close
  vaultKey: CryptoKey | null;
  isUnlocked: boolean;
  isLoading: boolean;

  // In-memory decrypted items cache
  items: DecryptedVaultItem[];

  // Actions
  setVaultKey: (key: CryptoKey) => void;
  lock: () => void;
  setItems: (items: DecryptedVaultItem[]) => void;
  addItem: (item: DecryptedVaultItem) => void;
  updateItem: (id: string, item: DecryptedVaultItem) => void;
  removeItem: (id: string) => void;
  setLoading: (v: boolean) => void;
}

export const useVaultStore = create<VaultStore>((set) => ({
  vaultKey:   null,
  isUnlocked: false,
  isLoading:  false,
  items:      [],

  setVaultKey: (key) => set({ vaultKey: key, isUnlocked: true }),

  lock: () => set({ vaultKey: null, isUnlocked: false, items: [] }),

  setItems: (items) => set({ items }),

  addItem: (item) =>
    set((state) => ({ items: [item, ...state.items] })),

  updateItem: (id, item) =>
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? item : i)),
    })),

  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

  setLoading: (v) => set({ isLoading: v }),
}));
