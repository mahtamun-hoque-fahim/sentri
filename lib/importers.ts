/**
 * Sentri Import Parsers
 * Converts exports from 1Password, Bitwarden, and generic CSV
 * into Sentri's VaultItemData format.
 */

import { LoginItem, CardItem, SecureNoteItem, VaultItemData } from "@/types/vault";

export interface ParsedImportItem {
  title:     string;
  item_type: "login" | "card" | "note" | "api_credential";
  data:      VaultItemData;
  source:    string; // original row for debugging
}

export type ImportFormat = "1password" | "bitwarden" | "lastpass" | "csv";

// ─── Format detection ─────────────────────────────────────────────────────────

export function detectFormat(headers: string[]): ImportFormat {
  const h = headers.map((x) => x.toLowerCase().trim());
  if (h.includes("notesplain") || h.includes("type") && h.includes("fields")) return "1password";
  if (h.includes("reprompt") || (h.includes("type") && h.includes("notes") && h.includes("login_uri"))) return "bitwarden";
  if (h.includes("extra") && h.includes("grouping")) return "lastpass";
  return "csv";
}

// ─── 1Password CSV ────────────────────────────────────────────────────────────
// Fields: Title, Username, Password, URL, Notes, Type, ...

export function parse1Password(rows: Record<string, string>[]): ParsedImportItem[] {
  return rows
    .filter((r) => r.Title || r.title)
    .map((r) => {
      const title    = r.Title    || r.title    || "Untitled";
      const username = r.Username || r.username || "";
      const password = r.Password || r.password || "";
      const url      = r.URL      || r.url      || r.Website || r.website || "";
      const notes    = r.Notes    || r.notes    || r.NotesSafe || "";
      const type     = (r.Type    || r.type     || "login").toLowerCase();

      if (type === "secure note" || type === "note") {
        return {
          title,
          item_type: "note" as const,
          data: { type: "note", content: notes } as SecureNoteItem,
          source: JSON.stringify(r),
        };
      }

      return {
        title,
        item_type: "login" as const,
        data: {
          type:     "login",
          username,
          password,
          urls:     url ? [url] : [],
          notes:    notes || undefined,
        } as LoginItem,
        source: JSON.stringify(r),
      };
    });
}

// ─── Bitwarden JSON ───────────────────────────────────────────────────────────

interface BitwardenLogin {
  username?: string;
  password?: string;
  uris?:     { uri: string }[];
  totp?:     string;
}

interface BitwardenCard {
  cardholderName?: string;
  number?:         string;
  expMonth?:       string;
  expYear?:        string;
  code?:           string;
}

interface BitwardenItem {
  name:    string;
  type:    number; // 1=login, 2=note, 3=card, 4=identity
  notes?:  string;
  login?:  BitwardenLogin;
  card?:   BitwardenCard;
  fields?: { name: string; value: string; type: number }[];
}

export function parseBitwarden(json: string): ParsedImportItem[] {
  try {
    const parsed = JSON.parse(json);
    const items: BitwardenItem[] = parsed.items ?? [];

    return items.map((item) => {
      const title = item.name || "Untitled";

      if (item.type === 2) {
        return {
          title,
          item_type: "note" as const,
          data: { type: "note", content: item.notes ?? "" } as SecureNoteItem,
          source: JSON.stringify(item),
        };
      }

      if (item.type === 3 && item.card) {
        const c = item.card;
        return {
          title,
          item_type: "card" as const,
          data: {
            type:             "card",
            cardholder_name:  c.cardholderName ?? "",
            number:           c.number ?? "",
            expiry:           `${c.expMonth ?? ""}/${(c.expYear ?? "").slice(-2)}`,
            cvv:              c.code ?? "",
          } as CardItem,
          source: JSON.stringify(item),
        };
      }

      // Default: login
      const login = item.login ?? {};
      return {
        title,
        item_type: "login" as const,
        data: {
          type:         "login",
          username:     login.username ?? "",
          password:     login.password ?? "",
          urls:         login.uris?.map((u) => u.uri).filter(Boolean) ?? [],
          notes:        item.notes ?? undefined,
          totp_secret:  login.totp ?? undefined,
        } as LoginItem,
        source: JSON.stringify(item),
      };
    });
  } catch {
    return [];
  }
}

// ─── LastPass CSV ──────────────────────────────────────────────────────────────
// Fields: url,username,password,totp,extra,name,grouping,fav

export function parseLastPass(rows: Record<string, string>[]): ParsedImportItem[] {
  return rows
    .filter((r) => r.name || r.Name)
    .map((r) => {
      const title    = r.name     || r.Name     || "Untitled";
      const username = r.username || r.Username || "";
      const password = r.password || r.Password || "";
      const url      = r.url      || r.URL      || "";
      const notes    = r.extra    || r.Extra     || r.notes || "";
      const totp     = r.totp     || r.TOTP      || "";

      if (url === "http://sn" || !url) {
        return {
          title,
          item_type: "note" as const,
          data: { type: "note", content: notes } as SecureNoteItem,
          source: JSON.stringify(r),
        };
      }

      return {
        title,
        item_type: "login" as const,
        data: {
          type:         "login",
          username,
          password,
          urls:         url ? [url] : [],
          notes:        notes || undefined,
          totp_secret:  totp || undefined,
        } as LoginItem,
        source: JSON.stringify(r),
      };
    });
}

// ─── Generic CSV ──────────────────────────────────────────────────────────────
// Best-effort mapping of common field names

export function parseGenericCSV(rows: Record<string, string>[]): ParsedImportItem[] {
  return rows
    .filter((r) => Object.values(r).some((v) => v))
    .map((r) => {
      const k       = Object.keys(r).map((x) => x.toLowerCase());
      const get     = (names: string[]) => {
        for (const name of names) {
          const key = k.find((x) => x.includes(name));
          if (key) return r[Object.keys(r)[k.indexOf(key)]] ?? "";
        }
        return "";
      };

      const title    = get(["title", "name", "label", "site"]) || "Imported Item";
      const username = get(["username", "user", "email", "login"]);
      const password = get(["password", "pass", "secret"]);
      const url      = get(["url", "website", "site", "uri"]);
      const notes    = get(["notes", "note", "comment", "extra"]);

      return {
        title,
        item_type: "login" as const,
        data: {
          type:     "login",
          username,
          password,
          urls:     url ? [url] : [],
          notes:    notes || undefined,
        } as LoginItem,
        source: JSON.stringify(r),
      };
    });
}
