import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        surface: "hsl(var(--surface) / <alpha-value>)",
        "surface-container": "hsl(var(--surface-container) / <alpha-value>)",
        "surface-container-high": "hsl(var(--surface-container-high) / <alpha-value>)",
        "surface-container-highest": "hsl(var(--surface-container-highest) / <alpha-value>)",
        "surface-bright": "hsl(var(--surface-bright) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        outline: "hsl(var(--outline) / <alpha-value>)",
        primary: "hsl(var(--primary) / <alpha-value>)",
        "primary-fixed-dim": "hsl(var(--primary-fixed-dim) / <alpha-value>)",
        "on-primary": "hsl(var(--on-primary) / <alpha-value>)",
        secondary: "hsl(var(--secondary) / <alpha-value>)",
        "secondary-container": "hsl(var(--secondary-container) / <alpha-value>)",
        "on-secondary": "hsl(var(--on-secondary) / <alpha-value>)",
        tertiary: "hsl(var(--tertiary) / <alpha-value>)",
        "on-tertiary": "hsl(var(--on-tertiary) / <alpha-value>)",
        destructive: "hsl(var(--destructive) / <alpha-value>)",
        "destructive-container": "hsl(var(--destructive-container) / <alpha-value>)",
        success: "hsl(var(--success) / <alpha-value>)",
        muted: "hsl(var(--muted) / <alpha-value>)",
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
