"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { importShareKeyFromFragment, } from "@/lib/sharing";
import { decryptData } from "@/lib/crypto";
import { ItemType, VaultItemData } from "@/types/vault";
import Link from "next/link";
import { Lock } from "lucide-react";

interface ShareRow {
  id:                   string;
  encrypted_share_data: string;
  share_iv:             string;
  expires_at:           string;
  view_count:           number;
  max_views:            number;
}

interface SharedPayload {
  title:     string;
  itemType: ItemType;
  data:      VaultItemData;
}

type Status = "loading" | "decrypting" | "ready" | "expired" | "exhausted" | "error";

const TYPE_ICON: Record<ItemType, string> = {
  login:          "🔑",
  card:           "💳",
  note:           "📄",
  ssh_key:        "🖥",
  api_credential: "⚡",
};

export default function SharePage() {
  const { shareId }  = useParams<{ shareId: string }>();
  const [status,     setStatus]   = useState<Status>("loading");
  const [payload,    setPayload]  = useState<SharedPayload | null>(null);
  const [copied,     setCopied]   = useState<Record<string, boolean>>({});
  const [viewsLeft,  setViewsLeft]= useState(0);
  const [expiresAt,  setExpiresAt]= useState("");

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareId]);

  async function load() {
    setStatus("loading");
    try {
      // Fetch from API (handles expiry + view count atomically)
      let share: { id: string; encryptedShareData: string; shareIv: string; expiresAt: string; viewsLeft: number };
      try {
        share = await api.shares.get(shareId) as typeof share;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "expired")   { setStatus("expired");   return; }
        if (msg === "exhausted") { setStatus("exhausted"); return; }
        setStatus("error"); return;
      }

      setViewsLeft(share.viewsLeft);
      setExpiresAt(share.expiresAt);

      // Get key from URL fragment
      setStatus("decrypting");
      const fragment = window.location.hash.replace("#k=", "").replace("#", "");
      if (!fragment) { setStatus("error"); return; }

      const shareKey = await importShareKeyFromFragment(fragment);
      const result   = await decryptData<SharedPayload>(shareKey, share.encryptedShareData, share.shareIv);
      setPayload(result);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  function copy(label: string, value: string) {
    navigator.clipboard.writeText(value);
    setCopied((c) => ({ ...c, [label]: true }));
    setTimeout(() => setCopied((c) => ({ ...c, [label]: false })), 2000);
  }

  function CopyBtn({ label, value }: { label: string; value: string }) {
    return (
      <button onClick={() => copy(label, value)}
        className="text-xs px-2.5 py-1 rounded-lg border transition-all"
        style={{
          borderColor: copied[label] ? "#4F6EF7" : "var(--border)",
          background:  copied[label] ? "rgba(79,110,247,0.07)" : "transparent",
          color:       copied[label] ? "#4F6EF7" : "var(--sub)",
        }}>
        {copied[label] ? "✓" : "Copy"}
      </button>
    );
  }

  function Field({ label, value, secret = false }: { label: string; value: string; secret?: boolean }) {
    const [show, setShow] = useState(!secret);
    return (
      <div>
        <p className="text-xs font-medium uppercase tracking-widest  mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <p className="flex-1 text-sm  break-all"
            style={secret && !show ? { filter: "blur(5px)", userSelect: "none" } : {}}>
            {value}
          </p>
          {secret && (
            <button onClick={() => setShow((s) => !s)}
              className="text-xs  hover: shrink-0">
              {show ? "Hide" : "Show"}
            </button>
          )}
          {value && <CopyBtn label={label} value={value} />}
        </div>
      </div>
    );
  }

  // ─── Status screens ────────────────────────────────────────────────────────

  const Center = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen vault-pattern flex items-center justify-center px-6"
      style={{ fontFamily: "'Geist', sans-serif" }}>
      <div className="text-center max-w-sm">{children}</div>
    </div>
  );

  if (status === "loading" || status === "decrypting") return (
    <Center>
      <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-4"
        style={{ background: "rgba(79,110,247,0.08)" }}><Lock size={20} style={{ color: "#4F6EF7" }} /></div>
      <p className="text-sm font-medium ">
        {status === "loading" ? "Loading share…" : "Decrypting item…"}
      </p>
      <p className="text-xs  mt-1">
        {status === "decrypting" && "Using the key from your URL to decrypt locally."}
      </p>
    </Center>
  );

  if (status === "expired") return (
    <Center>
      <div className="text-4xl mb-4">⏱</div>
      <h1 className="text-xl font-semibold  mb-2"
        style={{ fontFamily: "'Geist', serif" }}>Link expired</h1>
      <p className="text-sm ">This share link has expired. Ask the sender to create a new one.</p>
    </Center>
  );

  if (status === "exhausted") return (
    <Center>
      <div className="text-4xl mb-4">👁</div>
      <h1 className="text-xl font-semibold  mb-2"
        style={{ fontFamily: "'Geist', serif" }}>Already viewed</h1>
      <p className="text-sm ">This link has reached its maximum view count.</p>
    </Center>
  );

  if (status === "error" || !payload) return (
    <Center>
      <div className="text-4xl mb-4">❌</div>
      <h1 className="text-xl font-semibold  mb-2"
        style={{ fontFamily: "'Geist', serif" }}>Could not decrypt</h1>
      <p className="text-sm ">The link may be incomplete or the key is missing from the URL.</p>
    </Center>
  );

  // ─── Ready — show decrypted item ──────────────────────────────────────────

  return (
    <div className="min-h-screen vault-pattern" style={{ fontFamily: "'Geist', sans-serif" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b /80 backdrop-blur-sm"
        style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #4F6EF7, #3A56D4)" }}>S</div>
          <span className="text-lg font-semibold"
            style={{ fontFamily: "'Geist', serif", color: "#4F6EF7" }}>Sentri</span>
        </div>
        <Link href="/signin"
          className="text-sm font-medium px-4 py-1.5 rounded-lg text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #4F6EF7, #3A56D4)" }}>
          Open my vault
        </Link>
      </nav>

      <div className="flex items-start justify-center px-6 py-12">
        <div className="w-full max-w-md flex flex-col gap-4">

          {/* Header */}
          <div className="text-center mb-2 animate-fade-up">
            <p className="text-xs font-medium uppercase tracking-widest  mb-2">
              Shared with you via Sentri
            </p>
            <h1 className="text-2xl font-normal "
              style={{ fontFamily: "'Geist', serif" }}>
              {payload.title}
            </h1>
          </div>

          {/* Metadata strip */}
          <div className="flex items-center justify-center gap-4 text-xs  animate-fade-up">
            {viewsLeft > 0 && <span>👁 {viewsLeft} view{viewsLeft !== 1 ? "s" : ""} remaining</span>}
            {viewsLeft === 0 && <span>👁 Last view</span>}
            <span>·</span>
            <span>⏱ Expires {new Date(expiresAt).toLocaleDateString()}</span>
            <span>·</span>
            <span className="font-medium" style={{ color: "#4F6EF7" }}>🔐 Decrypted locally</span>
          </div>

          {/* Item card */}
          <div className=" rounded-2xl border p-6 flex flex-col gap-5 shadow-card animate-fade-up"
            style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: "rgba(79,110,247,0.08)" }}>
                {TYPE_ICON[payload.itemType]}
              </div>
              <div>
                <p className="font-semibold ">{payload.title}</p>
                <p className="text-xs  capitalize mt-0.5">{payload.itemType.replace("_", " ")}</p>
              </div>
            </div>

            {payload.data.type === "login" && (
              <>
                {payload.data.username && <Field label="Username" value={payload.data.username} />}
                <Field label="Password" value={payload.data.password} secret />
                {payload.data.urls?.[0] && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-widest  mb-1">URL</p>
                    <div className="flex items-center gap-2">
                      <a href={payload.data.urls[0]} target="_blank" rel="noopener noreferrer"
                        className="flex-1 text-sm truncate hover:underline" style={{ color: "#4F6EF7" }}>
                        {payload.data.urls[0]}
                      </a>
                      <CopyBtn label="URL" value={payload.data.urls[0]} />
                    </div>
                  </div>
                )}
                {payload.data.notes && <Field label="Notes" value={payload.data.notes} />}
              </>
            )}
            {payload.data.type === "card" && (
              <>
                <Field label="Cardholder" value={payload.data.cardholder_name} />
                <Field label="Card Number" value={payload.data.number} secret />
                <Field label="Expiry" value={payload.data.expiry} />
                <Field label="CVV" value={payload.data.cvv} secret />
              </>
            )}
            {payload.data.type === "note" && (
              <Field label="Content" value={payload.data.content} />
            )}
            {payload.data.type === "ssh_key" && (
              <>
                <Field label="Public Key" value={payload.data.public_key} />
                <Field label="Private Key" value={payload.data.private_key} secret />
              </>
            )}
            {payload.data.type === "api_credential" && (
              <>
                <Field label="Type" value={payload.data.credential_type} />
                <Field label="Key / Token" value={payload.data.key} secret />
                {payload.data.hostname && <Field label="Hostname" value={payload.data.hostname} />}
              </>
            )}
          </div>

          {/* Security note */}
          <div className="text-center">
            <p className="text-xs  leading-relaxed max-w-xs mx-auto">
              This item was decrypted in your browser using a key embedded in the URL.
              Sentri&apos;s servers only stored encrypted ciphertext — they never saw this data.
            </p>
          </div>

          {/* CTA */}
          <div className="text-center pt-2">
            <p className="text-xs  mb-3">Want your own encrypted vault?</p>
            <Link href="/signup"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium"
              style={{ background: "linear-gradient(135deg, #4F6EF7, #3A56D4)" }}>
              Create a free Sentri vault →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
