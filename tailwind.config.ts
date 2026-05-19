import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6366f1",
        "primary-dark": "#4f46e5",
        positive: "#22c55e",
        warning: "#f59e0b",
        negative: "#ef4444",
        "brand-bg": "#f8fafc",
        "brand-card": "#ffffff",
        "brand-border": "#e2e8f0",
        "text-primary": "#0f172a",
        "text-secondary": "#475569",
        muted: "#94a3b8",
        "team-accent": "#0891b2",
      },
    },
  },
  plugins: [],
};
export default config;
