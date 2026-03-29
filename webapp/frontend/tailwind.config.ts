import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0f9ff",
          100: "#e0f2fe",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          900: "#0c4a6e",
        },
        surface: {
          900: "#0a0f1e",
          800: "#111827",
          700: "#1f2937",
          600: "#374151",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      animation: {
        "fade-in":    "fadeIn 0.4s ease forwards",
        "slide-up":   "slideUp 0.5s ease forwards",
        "pulse-slow": "pulse 3s infinite",
      },
      keyframes: {
        fadeIn:  { from: { opacity: "0" },                           to: { opacity: "1" } },
        slideUp: { from: { transform: "translateY(20px)", opacity: "0" },
                     to: { transform: "translateY(0)",    opacity: "1" } },
      },
    },
  },
  plugins: [],
};

export default config;
