import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#F6F3EE",
        cream: "#EAE2D6",
        charcoal: "#0D0D0D",
        "charcoal-soft": "#1C1C1C",
        forest: "#123E37",
        "forest-light": "#285C53",
        gold: "#F0B33A",
        "gold-soft": "#F6D489",
        burgundy: "#A31C2B",
        "burgundy-soft": "#CB3B4E",
        red: "#B71D2A",
        "sports-red": "#BB1E2D",
        "sports-gold": "#F6C76E",
        "steel": "#EDEDED",
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
