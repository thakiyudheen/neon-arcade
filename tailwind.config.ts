import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1200px" },
    },
    extend: {
      colors: {
        night: {
          950: "#050814",
          900: "#070c1c",
          850: "#0a1024",
          800: "#0d1530",
          750: "#111b3d",
          700: "#16224a",
          600: "#1e2f63",
          500: "#2a4185",
        },
        neon: {
          cyan: "#22d3ee",
          violet: "#8b5cf6",
          pink: "#f472b6",
          lime: "#a3e635",
          amber: "#fbbf24",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        display: [
          "Space Grotesk",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        glow: "0 0 24px -6px rgba(34, 211, 238, 0.55)",
        "glow-violet": "0 0 30px -8px rgba(139, 92, 246, 0.6)",
        card: "0 20px 60px -30px rgba(0, 0, 0, 0.9)",
      },
      backgroundImage: {
        "grid-glow":
          "radial-gradient(circle at 20% 0%, rgba(34,211,238,0.12), transparent 40%), radial-gradient(circle at 80% 10%, rgba(139,92,246,0.14), transparent 45%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(34,211,238,0.45)" },
          "70%": { boxShadow: "0 0 0 14px rgba(34,211,238,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(34,211,238,0)" },
        },
        "win-line": {
          "0%": { opacity: "0", transform: "scaleX(0)" },
          "100%": { opacity: "1", transform: "scaleX(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.45s ease-out both",
        "scale-in": "scale-in 0.25s ease-out both",
        "pulse-ring": "pulse-ring 1.8s infinite",
        "win-line": "win-line 0.4s ease-out both",
        float: "float 5s ease-in-out infinite",
        shake: "shake 0.35s ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;
