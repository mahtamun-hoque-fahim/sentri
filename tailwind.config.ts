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
          bg:       "var(--bg)",
          surface:  "var(--surface)",
          surface2: "var(--surface2)",
          border:   "var(--border)",
          border2:  "var(--border2)",
          text:     "var(--text)",
          text2:    "var(--text2)",
          sub:      "var(--sub)",
          accent:   "var(--accent)",
          success:  "var(--success)",
          danger:   "var(--danger)",
          warning:  "var(--warning)",
        },
      },
      fontFamily: {
        display: ["Instrument Serif", "Georgia", "serif"],
        body:    ["Geist", "system-ui", "sans-serif"],
        mono:    ["Geist Mono", "monospace"],
      },
      boxShadow: {
        card:   "0 2px 8px rgba(0,0,0,0.2), 0 0 0 1px var(--border)",
        vault:  "0 8px 32px rgba(0,0,0,0.3)",
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
        "fade-up": "fade-up 0.45s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fade-in 0.3s ease both",
      },
    },
  },
  plugins: [],
};
export default config;
