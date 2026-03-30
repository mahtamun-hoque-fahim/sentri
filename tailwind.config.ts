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
          bg:       "#0A0E17",
          bg2:      "#0F1623",
          surface:  "#141C2E",
          surface2: "#1A2236",
          surface3: "#1F2840",
          border:   "#263352",
          border2:  "#2E3D63",
          text:     "#E2E8F5",
          text2:    "#A8B4CC",
          sub:      "#6B7A99",
          accent:   "#4F6EF7",
          accent2:  "#3A56D4",
          success:  "#34C98A",
          danger:   "#F0516A",
          warning:  "#F5A623",
          gold:     "#C8A96A",
        },
      },
      fontFamily: {
        display: ["Instrument Serif", "Georgia", "serif"],
        body:    ["Geist", "system-ui", "sans-serif"],
        mono:    ["Geist Mono", "monospace"],
      },
      boxShadow: {
        card:   "0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(38,51,82,0.8)",
        vault:  "0 8px 32px rgba(0,0,0,0.4)",
        accent: "0 4px 20px rgba(79,110,247,0.35)",
        glow:   "0 0 0 3px rgba(79,110,247,0.15)",
      },
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fade-in 0.35s ease both",
      },
    },
  },
  plugins: [],
};
export default config;
