import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep warm "night asphalt" surfaces
        ink: {
          950: "#0B0806",
          900: "#120D0A",
          800: "#1A130E",
          700: "#241A13",
          600: "#31251B",
        },
        // Primary — hot sundown ember
        ember: {
          300: "#FFB08A",
          400: "#FF8A50",
          500: "#FF6A2B",
          600: "#F04E0F",
        },
        // Secondary — street-lamp honey gold
        honey: {
          300: "#FFD98A",
          400: "#FFC24D",
          500: "#F5A623",
        },
        // Live / online / success
        mint: {
          300: "#8CF5C2",
          400: "#4ADE97",
          500: "#2EC981",
        },
        // Warm off-whites for text & hairlines
        sand: {
          50: "#FAF5EC",
          100: "#F1E8D8",
          300: "#D8CBB4",
          500: "#A6947B",
        },
        // Danger / ON AIR red
        flame: {
          400: "#FF6B5E",
          500: "#F43F2E",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 14px 44px -20px rgba(0, 0, 0, 0.85)",
        ember: "0 10px 32px -10px rgba(255, 106, 43, 0.55)",
        "ember-lg": "0 16px 48px -12px rgba(240, 78, 15, 0.6)",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        pulseglow: {
          "0%,100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        pulseglow: "pulseglow 2.4s ease-in-out infinite",
        shimmer: "shimmer 2s infinite",
        marquee: "marquee 32s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
