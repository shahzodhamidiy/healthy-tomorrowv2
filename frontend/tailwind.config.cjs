/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        sage: { DEFAULT: "#8A9A5B", dark: "#6B7A45", light: "#EEF1EA" },
        terra: { DEFAULT: "#E2725B", light: "#F7EBE8" },
        ink: { DEFAULT: "#2C352D", 2: "#5C665D", 3: "#8A948C" },
        cream: "#F9F8F6",
        line: "#E4E2DC",
      },
      fontFamily: {
        serif: ['"Instrument Serif"', "serif"],
        sans: ['"Satoshi"', "ui-sans-serif", "system-ui"],
        mono: ['"Geist Mono"', "ui-monospace"],
      },
    },
  },
  plugins: [],
};
