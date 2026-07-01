import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          900: "#05060f",
          800: "#0a0c1b",
          700: "#111427",
          600: "#171b34",
        },
        neon: {
          violet: "#8b5cf6",
          fuchsia: "#d946ef",
          cyan: "#22d3ee",
          lime: "#a3e635",
          amber: "#fbbf24",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
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
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        pulseglow: "pulseglow 2.4s ease-in-out infinite",
        shimmer: "shimmer 2s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
