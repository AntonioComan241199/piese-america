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
  build: {
    assetsInlineLimit: 4096, // Limita pentru includerea fișierelor inline (4KB)
    manifest: true, // Manifest.json pentru identificarea hash-urilor fișierelor
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"], // Împarte pachetele externe în chunk-uri separate
        },
      },
    },
  },
});
