import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sentri — Secure Vault",
  description: "Zero-knowledge password manager for your trusted circle.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
