/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Inter'", "'Space Grotesk'", "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          50: "#e9edfb",
          100: "#d6def7",
          200: "#c2cff3",
          300: "#9db4ec",
          400: "#6f90dd",
          500: "#1f3f8a",
          600: "#162f6b",
          700: "#0f214d"
        },
        dark: "#0a0f1f",
        ink: "#0b1224",
        accent: "#1fb6ff"
      },
      boxShadow: {
        soft: "0 10px 40px rgba(15, 23, 42, 0.10)",
        glow: "0 20px 70px rgba(79, 70, 229, 0.35)"
      }
    },
  },
  plugins: [],
};
