/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      flexsearch: path.resolve(__dirname, "./node_modules/flexsearch/dist/flexsearch.bundle.module.min.js"),
      dexie: path.resolve(__dirname, "./node_modules/dexie/dist/dexie.mjs"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    css: false,
  },
});
