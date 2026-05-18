import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        risk: {
          critical: "#dc2626",
          warning: "#d97706",
          info: "#2563eb",
          good: "#16a34a",
        },
      },
    },
  },
  plugins: [],
};

export default config;
