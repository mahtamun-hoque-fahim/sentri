/**
 * Sentri HIBP Integration
 * Uses the k-anonymity model — only the first 5 chars of the SHA-1 hash
 * are sent to the API. The full hash never leaves the device.
 */

async function sha1(text: string): Promise<string> {
  const encoded = new TextEncoder().encode(text);
  const hashBuf = await crypto.subtle.digest("SHA-1", encoded);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
    .join("");
}

/**
 * Returns the number of times a password appeared in HIBP data breaches.
 * Returns 0 if not found, -1 if the API call failed.
 */
export async function checkPasswordBreached(password: string): Promise<number> {
  if (!password) return 0;
  try {
    const hash   = await sha1(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
    });

    if (!res.ok) return -1;

    const text  = await res.text();
    const lines = text.split("\n");

    for (const line of lines) {
      const [lineSuffix, countStr] = line.trim().split(":");
      if (lineSuffix?.toUpperCase() === suffix) {
        return parseInt(countStr ?? "0", 10);
      }
    }
    return 0;
  } catch {
    return -1;
  }
}

export type WatchtowerIssue = {
  itemId:    string;
  itemTitle: string;
  type:      "breached" | "weak" | "reused" | "old";
  detail:    string;
  severity:  "critical" | "warning" | "info";
};
