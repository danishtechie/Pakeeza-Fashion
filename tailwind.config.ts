import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#F4F0E8",
        cream: "#E8E1D5",
        charcoal: "#171717",
        "charcoal-soft": "#292827",
        forest: "#163D35",
        "forest-light": "#2D6658",
        gold: "#C38B4A",
        "gold-soft": "#E0B978",
        burgundy: "#8D3040",
        "burgundy-soft": "#B04E5E",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      letterSpacing: {
        widest2: "0.25em",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "soft-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s ease-out forwards",
        "soft-in": "soft-in 0.9s ease-out forwards",
        "float": "float 5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
