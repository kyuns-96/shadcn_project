import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-ag-grid": ["ag-grid-community", "ag-grid-react"],
          "vendor-recharts": ["recharts"],
          "vendor-dnd": [
            "@dnd-kit/core",
            "@dnd-kit/sortable",
            "@dnd-kit/utilities",
            "@dnd-kit/modifiers",
          ],
          "vendor-redux": ["@reduxjs/toolkit", "react-redux"],
        },
      },
    },
  },
  server: {
    proxy: {
      "/api/v1": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
    headers: {
      "Content-Security-Policy": "script-src 'self'",
    },
  },
});
