import Link from "next/link";

export default function EmptyVault() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-6">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-6"
        style={{ background: "rgba(0,99,65,0.07)" }}
      >
        🔐
      </div>
      <h2
        className="text-2xl font-normal mb-2"
        style={{ fontFamily: "'DM Serif Display', serif", color: "#1A1F1E" }}
      >
        Your vault is empty
      </h2>
      <p className="text-sm text-sentri-sub mb-8 max-w-xs leading-relaxed">
        Add your first item — a login, card, secure note, or API key.
        Everything is encrypted before leaving your device.
      </p>
      <Link
        href="/vault/new"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 active:scale-95"
        style={{ background: "linear-gradient(135deg, #006341, #004D32)" }}
      >
        <span>+</span>
        Add first item
      </Link>
    </div>
  );
}
