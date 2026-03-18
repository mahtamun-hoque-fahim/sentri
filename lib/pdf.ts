/**
 * Sentri Emergency Kit PDF Generator
 * Fully client-side — never sent to server.
 * Generates a printable PDF with account details + Secret Key.
 */

export interface EmergencyKitData {
  email:        string;
  secretKey:    string;
  secretKeyHint?: string;
  createdAt:    string;
}

export async function generateEmergencyKitPDF(data: EmergencyKitData): Promise<void> {
  // Dynamic import to avoid SSR issues
  const { jsPDF }    = await import("jspdf");
  const QRCode       = (await import("qrcode")).default;

  const doc    = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W      = 210;
  const H      = 297;
  const margin = 20;
  const inner  = W - margin * 2;

  // ─── Colours ────────────────────────────────────────────────────────────────
  const green   = [0,  99,  65]  as [number, number, number];
  const darkGreen=[0,  77,  50]  as [number, number, number];
  const obsidian= [26, 31,  30]  as [number, number, number];
  const subGrey = [102,112,133]  as [number, number, number];
  const muted   = [232,237,235]  as [number, number, number];
  const white   = [255,255,255]  as [number, number, number];
  const yellow  = [249,215, 76]  as [number, number, number];

  // ─── Header band ────────────────────────────────────────────────────────────
  doc.setFillColor(...green);
  doc.rect(0, 0, W, 38, "F");

  // Logo circle
  doc.setFillColor(...darkGreen);
  doc.roundedRect(margin, 10, 14, 14, 3, 3, "F");
  doc.setTextColor(...white);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("S", margin + 7, 18.5, { align: "center" });

  // Brand name
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Sentri", margin + 18, 19);

  // Subtitle
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text("Emergency Kit", margin + 18, 25);

  // Date top right
  doc.setFontSize(7.5);
  doc.text(`Generated ${data.createdAt}`, W - margin, 19, { align: "right" });

  // ─── Warning banner ─────────────────────────────────────────────────────────
  doc.setFillColor(...yellow);
  doc.rect(0, 38, W, 14, "F");
  doc.setTextColor(...obsidian);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(
    "⚠  KEEP THIS DOCUMENT PRIVATE  —  Anyone with this file can access your vault",
    W / 2, 46.5,
    { align: "center" }
  );

  let y = 66;

  // ─── Section helper ─────────────────────────────────────────────────────────
  function section(title: string) {
    doc.setFillColor(...muted);
    doc.roundedRect(margin, y - 4, inner, 7, 2, 2, "F");
    doc.setTextColor(...green);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), margin + 4, y + 0.5);
    y += 10;
  }

  function field(label: string, value: string, mono = false) {
    doc.setTextColor(...subGrey);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(label, margin, y);

    doc.setTextColor(...obsidian);
    doc.setFontSize(9);
    doc.setFont(mono ? "courier" : "helvetica", mono ? "normal" : "bold");
    doc.text(value, margin, y + 5);
    y += 14;
  }

  // ─── Account details ────────────────────────────────────────────────────────
  section("Account Details");
  field("Email address", data.email);

  // ─── Secret Key ─────────────────────────────────────────────────────────────
  section("Secret Key");

  // Big Secret Key box
  doc.setFillColor(245, 249, 247);
  doc.setDrawColor(...green);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, inner, 20, 3, 3, "FD");

  doc.setTextColor(...green);
  doc.setFontSize(13);
  doc.setFont("courier", "bold");
  doc.text(data.secretKey, W / 2, y + 13, { align: "center", charSpace: 1.5 });
  y += 28;

  // ─── QR Code ─────────────────────────────────────────────────────────────────
  section("QR Code (scan to copy Secret Key)");

  const qrDataURL = await QRCode.toDataURL(data.secretKey, {
    width:    200,
    margin:   1,
    color:    { dark: "#006341", light: "#ffffff" },
  });

  const QR_SIZE = 42;
  doc.addImage(qrDataURL, "PNG", W / 2 - QR_SIZE / 2, y, QR_SIZE, QR_SIZE);
  y += QR_SIZE + 10;

  // ─── How to use ─────────────────────────────────────────────────────────────
  section("How to sign in");

  const steps = [
    "1.  Go to your Sentri vault URL",
    "2.  Enter your email address",
    "3.  Enter your Master Password (the one you chose at signup)",
    "4.  Enter this Secret Key exactly as shown above",
    "5.  Your vault will decrypt and unlock locally on your device",
  ];

  doc.setTextColor(...obsidian);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  steps.forEach((step) => {
    doc.text(step, margin + 2, y);
    y += 6;
  });
  y += 6;

  // ─── Security notes ─────────────────────────────────────────────────────────
  section("Security Notes");

  const notes = [
    "•  Your Secret Key is never stored by Sentri — only you have it",
    "•  Without the Secret Key + Master Password, your vault cannot be decrypted",
    "•  Store this document in a safe, fireproof location (or a safety deposit box)",
    "•  Consider giving a copy to a trusted person in case of emergency",
    "•  Do not store this digitally alongside your passwords",
  ];

  doc.setTextColor(...subGrey);
  doc.setFontSize(8);
  notes.forEach((note) => {
    doc.text(note, margin + 2, y);
    y += 5.5;
  });

  // ─── Footer ─────────────────────────────────────────────────────────────────
  doc.setFillColor(...green);
  doc.rect(0, H - 16, W, 16, "F");
  doc.setTextColor(...white);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Sentri — Zero-knowledge encrypted password manager", W / 2, H - 8, { align: "center" });
  doc.text("All vault data is encrypted with AES-256-GCM. Sentri never has access to your plaintext.", W / 2, H - 4, { align: "center" });

  // ─── Save ───────────────────────────────────────────────────────────────────
  doc.save(`sentri-emergency-kit-${Date.now()}.pdf`);
}
