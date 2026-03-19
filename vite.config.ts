import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Mock framer so the component works outside Framer
      framer: "/src/framer-mock.ts",
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
