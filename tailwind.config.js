/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#D97706", // Gold/Amber
        "teal-dark": "#0f4c5c", // Deep petrol blue
        "teal-base": "#115E59", // Petrol teal
        "teal-light": "#134e4a",
        "bg-light": "#F3F4F6",
        "bg-dark": "#0F172A",
        "card-light": "#FFFFFF",
        "card-dark": "#1E293B",
      },
      fontFamily: {
        display: ["Outfit", "sans-serif"],
      },
    },
  },
  plugins: [],
};
