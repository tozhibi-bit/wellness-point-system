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
        bg: "#f4f1ea",
        panel: "#fbfaf6",
        ink: "#1a1a1a",
        "ink-soft": "#555555",
        "ink-mute": "#8a8a8a",
        line: "#e3ddd0",
        "line-strong": "#c9c1ae",
        accent: "#8b2e2e",
        "accent-soft": "#c94a4a",
        gold: "#b8935a",
        matcha: "#5d7a4a",
        sumi: "#2b2b2b",
      },
      fontFamily: {
        sans: ["Zen Kaku Gothic New", "sans-serif"],
        mincho: ["Shippori Mincho", "serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
