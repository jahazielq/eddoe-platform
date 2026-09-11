import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#041e42",
          light: "#0b3866",
        },
        gold: {
          DEFAULT: "#c9a227",
          dark: "#a3821e",
          light: "#f4ecd8",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
