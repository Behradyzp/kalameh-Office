import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/postcss";
import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  root: path.resolve(__dirname, "cpanel-src"),
  base: "./",
  publicDir: path.resolve(__dirname, "public"),
  resolve: { alias: { "@": path.resolve(__dirname) } },
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    sourcemap: false,
  },
});
