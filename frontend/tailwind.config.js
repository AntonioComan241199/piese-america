/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    './node_modules/bootstrap/dist/css/bootstrap.min.css', // Adaugă acest rând

  ],
  theme: {
    extend: {
      colors: {
        primary: "#000d6b",
        secondary: "#f9a826",
      },
      fontFamily: {
        sans: ["Roboto", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Dezactivează stilurile implicite Tailwind pentru a evita conflictele
  },
};
