/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class", // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: "#0f766e", // Teal - main brand color
        accent: "#D97706", // Amber - accent/highlights

        // Teal variants
        "teal-dark": "#0d4542",
        "teal-base": "#115E59",
        "teal-deep": "#0f4c5c",

        // Background colors
        "bg-light": "#F3F4F6",
        "bg-dark": "#0F172A",
        "bg-darker": "#020617",

        // Card colors
        "card-light": "#FFFFFF",
        "card-dark": "#1E293B",

        // Text colors (using Tailwind's slate palette)
        "text-primary-light": "#1E293B",
        "text-primary-dark": "#F8FAFC",
        "text-secondary-light": "#64748B",
        "text-secondary-dark": "#94A3B8",

        // Border colors
        "border-light": "#E2E8F0",
        "border-dark": "#334155",

        // Accent background
        "accent-bg-light": "#FEF3C7",
        "accent-bg-dark": "rgba(217, 119, 6, 0.2)",
      },
      fontFamily: {
        outfit: ["Outfit", "sans-serif"],
        "outfit-regular": ["Outfit_400Regular", "sans-serif"],
        "outfit-medium": ["Outfit_500Medium", "sans-serif"],
        "outfit-semibold": ["Outfit_600SemiBold", "sans-serif"],
        "outfit-bold": ["Outfit_700Bold", "sans-serif"],
      },
      borderRadius: {
        "4xl": "40px",
      },
    },
  },
  plugins: [],
};
