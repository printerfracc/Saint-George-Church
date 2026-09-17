import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "deep-red": "#8B1E3F",
        gold: "#D4AF37",
        cream: "#F7F3E9",
        "coptic-gold": {
          light: "#E5C07B",
          main: "#D4AF37",
          dark: "#997A15",
        },
        "coptic-gold-light": "#E5C07B",
        "coptic-gold-main": "#D4AF37",
        "coptic-gold-dark": "#997A15",
        "coptic-red-main": "#8B1E3F",
      },
    },
  },
  plugins: [],
};

export default config;
