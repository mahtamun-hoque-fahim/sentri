import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sentri — Secure Vault",
  description: "Zero-knowledge password manager for your trusted circle.",
  icons: {
    icon: [
      { url: "/logos/sentri-icon-dark.svg", media: "(prefers-color-scheme: dark)" },
      { url: "/logos/sentri-icon-light.svg", media: "(prefers-color-scheme: light)" },
    ],
  },
  openGraph: {
    title: "Sentri — Secure Vault",
    description: "Zero-knowledge password manager for your trusted circle.",
    images: [{ url: "/logos/sentri-logo-white.svg" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* eslint-disable-next-line @next/next/no-page-custom-font */}
          <link
            href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap"
            rel="stylesheet"
          />
          {/* Prevent flash of wrong theme */}
          <script dangerouslySetInnerHTML={{ __html: `
            (function() {
              var t = localStorage.getItem('sentri-theme') || 'dark';
              if (t === 'light') document.documentElement.classList.add('light');
            })();
          ` }} />
        </head>
        <body>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
