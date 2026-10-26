import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": { target: "http://127.0.0.1:8000", changeOrigin: true, rewrite: path => path.replace(/^\/api/, "") } } },
  resolve: {
    alias: {
      "@techgram/kernel": resolve(root, "../../kernel/src/index.ts"),
    },
  },
  build: { target: "es2022" },
});
