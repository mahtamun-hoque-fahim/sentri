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
          primary:   "#00FF94",
          "primary-dim": "#00CC77",
          secondary: "#7B61FF",
          accent:    "#00D4FF",
          surface:   "#0F1117",
          surface2:  "#161B27",
          surface3:  "#1E2535",
          border:    "#2A3244",
          bg:        "#080B12",
          text:      "#E8EDF5",
          sub:       "#8892A4",
          muted:     "#1E2535",
          danger:    "#FF4D6A",
          warning:   "#FFB547",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body:    ["Space Grotesk", "sans-serif"],
        mono:    ["Space Mono", "monospace"],
      },
      boxShadow: {
        card:  "0 1px 4px 0 rgba(0,0,0,0.3), 0 0 0 1px rgba(0,255,148,0.06)",
        vault: "0 4px 24px 0 rgba(0,255,148,0.12)",
        glow:  "0 0 0 3px rgba(0,255,148,0.2)",
        neon:  "0 0 20px rgba(0,255,148,0.4)",
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
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 8px rgba(0,255,148,0.2)" },
          "50%":       { boxShadow: "0 0 20px rgba(0,255,148,0.4)" },
        },
      },
      animation: {
        "fade-up":    "fade-up 0.45s ease both",
        "fade-in":    "fade-in 0.3s ease both",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
