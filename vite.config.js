import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "./src/renderer",
  plugins: [react()],
  publicDir: false,
  base: "./",
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
  },
});
