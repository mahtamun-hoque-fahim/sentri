"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useVaultStore } from "@/store/vault";
import { api } from "@/lib/api";
import { encryptData } from "@/lib/crypto";
import {
  detectFormat, parse1Password, parseBitwarden,
  parseLastPass, parseGenericCSV,
  ParsedImportItem, ImportFormat,
} from "@/lib/importers";
import Header from "@/components/layout/Header";

// Dynamic import of papaparse to keep bundle lean
async function parseCsvFile(text: string): Promise<Record<string, string>[]> {
  const Papa = (await import("papaparse")).default;
  const result = Papa.parse<Record<string, string>>(text, {
    header:        true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  });
  return result.data;
}

const FORMAT_META: Record<ImportFormat, { label: string; icon: string; desc: string }> = {
  "1password": { label: "1Password",  icon: "🔵", desc: "CSV export from 1Password" },
  bitwarden:   { label: "Bitwarden",  icon: "🔷", desc: "JSON export from Bitwarden" },
  lastpass:    { label: "LastPass",   icon: "🔴", desc: "CSV export from LastPass" },
  csv:         { label: "Generic CSV",icon: "📄", desc: "Any CSV with title/username/password columns" },
};

const TYPE_ICON: Record<string, string> = {
  login:          "🔑",
  card:           "💳",
  note:           "📄",
  api_credential: "⚡",
};

type ImportStep = "upload" | "preview" | "importing" | "done";

export default function ImportPage() {
  const router    = useRouter();
  const vaultKey  = useVaultStore((s) => s.vaultKey);
  const addItem   = useVaultStore((s) => s.addItem);

  const [step,       setStep]       = useState<ImportStep>("upload");
  const [dragging,   setDragging]   = useState(false);
  const [format,     setFormat]     = useState<ImportFormat | null>(null);
  const [items,      setItems]      = useState<ParsedImportItem[]>([]);
  const [selected,   setSelected]   = useState<Set<number>>(new Set());
  const [progress,   setProgress]   = useState(0);
  const [imported,   setImported]   = useState(0);
  const [errors,     setErrors]     = useState<string[]>([]);
  const [fileName,   setFileName]   = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setFileName(file.name);
    const text   = await file.text();
    let parsed: ParsedImportItem[] = [];
    let fmt: ImportFormat = "csv";

    try {
      if (file.name.endsWith(".json")) {
        fmt    = "bitwarden";
        parsed = parseBitwarden(text);
      } else {
        const rows = await parseCsvFile(text);
        if (rows.length === 0) { setErrors(["No data found in file."]); return; }
        fmt    = detectFormat(Object.keys(rows[0]));
        if (fmt === "1password") parsed = parse1Password(rows);
        else if (fmt === "lastpass") parsed = parseLastPass(rows);
        else parsed = parseGenericCSV(rows);
      }
    } catch (err) {
      setErrors([`Could not parse file: ${err instanceof Error ? err.message : String(err)}`]);
      return;
    }

    setFormat(fmt);
    setItems(parsed.filter((i) => i.title && (
      (i.data.type === "login" && (i.data.password || i.data.username)) ||
      (i.data.type === "note"  && i.data.content) ||
      (i.data.type === "card"  && i.data.number)
    )));
    setSelected(new Set(parsed.map((_, i) => i)));
    setStep("preview");
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  async function handleImport() {
    if (!vaultKey || selected.size === 0) return;
    setStep("importing");
    setProgress(0);
    const toImport = items.filter((_, i) => selected.has(i));
    let done = 0;
    const errs: string[] = [];

    for (const item of toImport) {
      try {
        const { ciphertext: encData,  iv: dataIV  } = await encryptData(vaultKey, item.data);
        const { ciphertext: encTitle, iv: titleIV } = await encryptData(vaultKey, item.title);

        let favicon_url: string | null = null;
        if (item.data.type === "login" && item.data.urls?.[0]) {
          try {
            const domain = new URL(item.data.urls[0]).hostname;
            favicon_url  = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
          } catch { /* ignore */ }
        }

        const row = await api.items.create({
          itemType:       item.item_type,
          encryptedData:  encData,
          iv:             dataIV,
          titleEncrypted: encTitle,
          titleIv:        titleIV,
          faviconUrl:     favicon_url,
        }) as { id: string; createdAt: string; updatedAt: string };

        addItem({
          id:        row.id,
          title:     item.title,
          itemType:  item.item_type as import("@/types/vault").ItemType,
          faviconUrl: favicon_url,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          data:      item.data,
        });
        done++;
      } catch (err) {
        errs.push(`"${item.title}": ${err instanceof Error ? err.message : "failed"}`);
      }
      setProgress(Math.round(((done + errs.length) / toImport.length) * 100));
      setImported(done);
    }

    setErrors(errs);
    setStep("done");
  }

  function toggleAll() {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((_, i) => i)));
  }

  function toggleOne(idx: number) {
    setSelected((s) => {
      const n = new Set(s);
      n.has(idx) ? n.delete(idx) : n.add(idx);
      return n;
    });
  }

  return (
    <>
      <Header title="Import" showSearch={false} />
      <div className="flex-1 px-6 py-6 max-w-3xl mx-auto w-full">

        {/* Step: Upload */}
        {step === "upload" && (
          <div className="flex flex-col gap-5">

            {/* Supported formats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(Object.entries(FORMAT_META) as [ImportFormat, typeof FORMAT_META[ImportFormat]][]).map(([key, meta]) => (
                <div key={key}
                  className="flex flex-col items-start gap-2 p-4 bg-white rounded-xl border"
                  style={{ borderColor: "#E8EDEB" }}>
                  <span className="text-2xl">{meta.icon}</span>
                  <p className="text-sm font-semibold text-sentri-text">{meta.label}</p>
                  <p className="text-xs text-sentri-sub leading-relaxed">{meta.desc}</p>
                </div>
              ))}
            </div>

            {/* Drop zone */}
            <div
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all"
              style={{
                borderColor: dragging ? "#006341" : "#E8EDEB",
                background:  dragging ? "rgba(0,99,65,0.04)" : "#fff",
              }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: "rgba(0,99,65,0.07)" }}>📁</div>
              <div className="text-center">
                <p className="text-sm font-semibold text-sentri-text mb-1">
                  Drop your export file here
                </p>
                <p className="text-xs text-sentri-sub">
                  Supports .csv (1Password, LastPass, generic) and .json (Bitwarden)
                </p>
              </div>
              <span
                className="px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: "linear-gradient(135deg,#006341,#004D32)" }}>
                Browse files
              </span>
              <input ref={fileRef} type="file" accept=".csv,.json,.txt"
                className="hidden" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
            </div>

            {errors.length > 0 && (
              <div className="px-4 py-3 rounded-xl border text-sm"
                style={{ background: "#FFF1F0", borderColor: "#FECAC7", color: "#D93025" }}>
                {errors[0]}
              </div>
            )}

            {/* How to export guides */}
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E8EDEB" }}>
              <p className="text-xs font-medium uppercase tracking-widest text-sentri-sub mb-4">
                How to export from your current manager
              </p>
              <div className="flex flex-col gap-3">
                {[
                  { name: "1Password",  steps: "1Password → File → Export → All Items → CSV" },
                  { name: "Bitwarden",  steps: "Bitwarden → Tools → Export Vault → .json format" },
                  { name: "LastPass",   steps: "LastPass → Account Options → Export → LastPass CSV" },
                  { name: "Chrome",     steps: "chrome://password-manager/settings → Export Passwords → CSV" },
                ].map((g) => (
                  <div key={g.name} className="flex items-start gap-3">
                    <span className="text-xs font-semibold w-20 shrink-0 mt-0.5" style={{ color: "#006341" }}>
                      {g.name}
                    </span>
                    <p className="text-xs text-sentri-sub leading-relaxed">{g.steps}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === "preview" && (
          <div className="flex flex-col gap-4">
            {/* Summary bar */}
            <div className="flex items-center gap-4 px-5 py-4 bg-white rounded-xl border"
              style={{ borderColor: "#E8EDEB" }}>
              <div className="flex-1">
                <p className="text-sm font-semibold text-sentri-text">
                  {fileName}
                </p>
                <p className="text-xs text-sentri-sub mt-0.5">
                  Detected: <span className="font-medium" style={{ color: "#006341" }}>
                    {format ? FORMAT_META[format].label : "Unknown"}
                  </span> · {items.length} items found
                </p>
              </div>
              <button onClick={() => { setStep("upload"); setItems([]); setErrors([]); }}
                className="text-xs text-sentri-sub hover:text-sentri-text transition-colors">
                Change file
              </button>
            </div>

            {/* Select all + counts */}
            <div className="flex items-center justify-between px-1">
              <button onClick={toggleAll}
                className="text-xs font-medium transition-colors"
                style={{ color: "#006341" }}>
                {selected.size === items.length ? "Deselect all" : `Select all (${items.length})`}
              </button>
              <p className="text-xs text-sentri-sub">
                {selected.size} of {items.length} selected
              </p>
            </div>

            {/* Item list */}
            <div className="flex flex-col gap-1.5 max-h-[480px] overflow-y-auto pr-1">
              {items.map((item, i) => (
                <label key={i}
                  className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border cursor-pointer transition-all hover:shadow-card"
                  style={{
                    borderColor: selected.has(i) ? "#006341" : "#E8EDEB",
                    background:  selected.has(i) ? "rgba(0,99,65,0.02)" : "#fff",
                  }}>
                  <input type="checkbox" checked={selected.has(i)}
                    onChange={() => toggleOne(i)}
                    className="w-4 h-4 accent-sentri-primary shrink-0" />
                  <span className="text-lg shrink-0">{TYPE_ICON[item.item_type] ?? "🔑"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sentri-text truncate">{item.title}</p>
                    <p className="text-xs text-sentri-sub truncate">
                      {item.data.type === "login"  && (item.data.username || item.data.urls?.[0] || "Login")}
                      {item.data.type === "note"   && "Secure note"}
                      {item.data.type === "card"   && `•••• ${item.data.number?.slice(-4) ?? "xxxx"}`}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full capitalize shrink-0"
                    style={{ background: "#F7F9F8", color: "#667085" }}>
                    {item.item_type.replace("_", " ")}
                  </span>
                </label>
              ))}
            </div>

            {/* Security note */}
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl border text-xs"
              style={{ background: "rgba(0,99,65,0.05)", borderColor: "rgba(0,99,65,0.15)" }}>
              <span>🔐</span>
              <p className="text-sentri-sub leading-relaxed">
                All items will be encrypted with AES-256-GCM in your browser before being stored.
                Sentri&apos;s servers never see plaintext passwords.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleImport}
                disabled={selected.size === 0}
                className="flex-1 py-3 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #006341, #004D32)" }}>
                Import {selected.size} item{selected.size !== 1 ? "s" : ""} →
              </button>
              <button onClick={() => { setStep("upload"); setItems([]); }}
                className="px-5 py-3 rounded-xl border text-sm font-medium text-sentri-sub hover:bg-sentri-muted"
                style={{ borderColor: "#E8EDEB" }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Step: Importing */}
        {step === "importing" && (
          <div className="flex flex-col items-center justify-center py-20 gap-6">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
              style={{ background: "rgba(0,99,65,0.07)" }}>🔐</div>
            <div className="text-center">
              <p className="text-lg font-semibold text-sentri-text mb-1"
                style={{ fontFamily: "'DM Serif Display', serif" }}>
                Encrypting &amp; importing…
              </p>
              <p className="text-sm text-sentri-sub">
                {imported} of {items.filter((_, i) => selected.has(i)).length} items
              </p>
            </div>
            <div className="w-full max-w-xs">
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E8EDEB" }}>
                <div className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, background: "linear-gradient(90deg, #006341, #2A8A58)" }} />
              </div>
              <p className="text-xs text-sentri-sub text-center mt-2">{progress}%</p>
            </div>
          </div>
        )}

        {/* Step: Done */}
        {step === "done" && (
          <div className="flex flex-col items-center justify-center py-16 gap-6">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
              style={{ background: "rgba(0,99,65,0.07)" }}>✅</div>
            <div className="text-center">
              <h2 className="text-2xl font-normal text-sentri-text mb-2"
                style={{ fontFamily: "'DM Serif Display', serif" }}>
                Import complete
              </h2>
              <p className="text-sm text-sentri-sub">
                {imported} item{imported !== 1 ? "s" : ""} imported and encrypted successfully.
              </p>
            </div>

            {errors.length > 0 && (
              <div className="w-full max-w-md px-4 py-3 rounded-xl border text-sm"
                style={{ background: "#FFF1F0", borderColor: "#FECAC7", color: "#D93025" }}>
                <p className="font-semibold mb-1">{errors.length} item{errors.length !== 1 ? "s" : ""} failed:</p>
                <ul className="text-xs space-y-0.5">
                  {errors.slice(0, 5).map((e, i) => <li key={i}>• {e}</li>)}
                  {errors.length > 5 && <li>…and {errors.length - 5} more</li>}
                </ul>
              </div>
            )}

            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 rounded-xl text-white text-sm font-medium"
              style={{ background: "linear-gradient(135deg, #006341, #004D32)" }}>
              Go to vault →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
