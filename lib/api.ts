/**
 * Sentri API Client
 * Thin fetch wrapper that replaces all supabase.from() calls.
 * Every request goes through our Next.js API routes,
 * which are protected by Clerk server-side auth.
 */

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? res.statusText);
  }

  return res.json();
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export const api = {
  profile: {
    get: ()           => req("/api/profile"),
    create: (body: object) => req("/api/profile", { method: "POST", body: JSON.stringify(body) }),
  },

  // ─── Vault Items ─────────────────────────────────────────────────────────────
  items: {
    list:   ()             => req("/api/vault/items"),
    get:    (id: string)   => req(`/api/vault/items/${id}`),
    create: (body: object) => req("/api/vault/items", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: object) =>
      req(`/api/vault/items/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: string)   => req(`/api/vault/items/${id}`, { method: "DELETE" }),
  },

  // ─── History ─────────────────────────────────────────────────────────────────
  history: {
    list:   (itemId: string) => req(`/api/vault/history/${itemId}`),
    create: (body: object)   => req("/api/vault/history", { method: "POST", body: JSON.stringify(body) }),
  },

  // ─── Shares ──────────────────────────────────────────────────────────────────
  shares: {
    get:    (shareId: string) => req(`/api/shares/${shareId}`),
    create: (body: object)    => req("/api/shares", { method: "POST", body: JSON.stringify(body) }),
  },

  // ─── Sessions ────────────────────────────────────────────────────────────────
  sessions: {
    list:   ()             => req("/api/sessions"),
    create: (body: object) => req("/api/sessions", { method: "POST", body: JSON.stringify(body) }),
    delete: (id: string)   => req(`/api/sessions/${id}`, { method: "DELETE" }),
  },

  // ─── Vaults ──────────────────────────────────────────────────────────────────
  vaults: {
    list:   ()             => req("/api/vaults"),
    create: (body: object) => req("/api/vaults", { method: "POST", body: JSON.stringify(body) }),
  },

  // ─── Invites ─────────────────────────────────────────────────────────────────
  invites: {
    list:   ()             => req("/api/invites"),
    create: (body: object) => req("/api/invites", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: object) =>
      req(`/api/invites/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: string)   => req(`/api/invites/${id}`, { method: "DELETE" }),
  },
};
