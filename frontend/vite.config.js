import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss(), // Tailwind CSS
        autoprefixer(), // Autoprefixer
      ],
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@import "bootstrap/scss/bootstrap";`, // Include Bootstrap SCSS
      },
    },
  },
  base: "/", // Calea de bază pentru proiect
});
