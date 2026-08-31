import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The API is proxied rather than called cross-origin. That keeps the browser
// on one origin in development, so the backend needs no CORS configuration and
// production can serve this build from Phoenix unchanged.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.AIMS_API_URL ?? "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
