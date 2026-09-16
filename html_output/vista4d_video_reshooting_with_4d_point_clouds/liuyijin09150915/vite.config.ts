import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  server: { port: 5173, open: false },
  build: { outDir: "dist", sourcemap: false },
});
