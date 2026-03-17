import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sentri: {
          primary:   "#006341",
          secondary: "#004D32",
          highlight: "#F9D74C",
          accent:    "#C5A059",
          surface:   "#FFFFFF",
          bg:        "#F7F9F8",
          text:      "#1A1F1E",
          sub:       "#667085",
          danger:    "#D93025",
          muted:     "#E8EDEB",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body:    ["var(--font-body)", "sans-serif"],
        mono:    ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        card:  "0 1px 4px 0 rgba(0,0,0,0.07), 0 0 0 1px rgba(0,99,65,0.06)",
        vault: "0 4px 24px 0 rgba(0,99,65,0.10)",
        glow:  "0 0 0 3px rgba(0,99,65,0.18)",
      },
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.45s ease both",
        "fade-in": "fade-in 0.3s ease both",
      },
    },
  },
  plugins: [],
};
export default config;
