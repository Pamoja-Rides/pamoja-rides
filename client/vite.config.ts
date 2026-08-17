import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // sw.js in /public is served as-is — no extra config needed.
  // This comment is just a reminder not to import sw.js through Vite.
});
