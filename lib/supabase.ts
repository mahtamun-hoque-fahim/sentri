import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (typeof window !== "undefined") {
      console.warn("[Sentri] Supabase env vars missing. Running in demo mode.");
    }
    // Return a no-op proxy during build / demo mode
    return new Proxy({} as ReturnType<typeof createBrowserClient>, {
      get: () => new Proxy(() => {}, { get: () => () => ({ data: null, error: new Error("Supabase not configured") }) }),
    });
  }

  return createBrowserClient(url, key);
}
