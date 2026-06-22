import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      "/api": {
        target: "https://localhost:7177",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      "/hubs": {
        target: "https://localhost:7177",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      "/UserFiles": {
        target: "https://localhost:7177",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
