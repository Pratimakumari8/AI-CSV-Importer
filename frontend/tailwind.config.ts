import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0B0E14",
          900: "#11151D",
          800: "#171C27",
          700: "#232937",
          600: "#323A4B",
          500: "#4A5468",
          400: "#6B7690",
          300: "#9AA3B8",
          200: "#C7CDDA",
          100: "#E8EBF1",
          50: "#F5F6F9",
        },
        signal: {
          amber: "#E8A33D",
          green: "#3FB27F",
          red: "#E15A5A",
          blue: "#4C8BF5",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      keyframes: {
        "flow-dash": {
          to: { strokeDashoffset: "-24" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "flow-dash": "flow-dash 1s linear infinite",
        "fade-up": "fade-up 0.35s ease-out",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
