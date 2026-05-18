import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0a0a0b",
          elevated: "#111114",
          card: "#15151a",
          hover: "#1c1c22",
        },
        line: {
          DEFAULT: "#26262e",
          strong: "#3a3a44",
        },
        ink: {
          DEFAULT: "#f5f5f7",
          muted: "#a1a1aa",
          dim: "#6b6b76",
        },
        brand: {
          50: "#f0f9ff",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          glow: "#0ea5e933",
        },
        risk: {
          critical: "#ef4444",
          "critical-bg": "#ef444415",
          warning: "#f59e0b",
          "warning-bg": "#f59e0b15",
          info: "#3b82f6",
          "info-bg": "#3b82f615",
          good: "#10b981",
          "good-bg": "#10b98115",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(circle at center, rgba(255,255,255,0.04) 1px, transparent 1px)",
        "brand-glow":
          "radial-gradient(ellipse at top, rgba(14,165,233,0.15), transparent 50%)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out forwards",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
