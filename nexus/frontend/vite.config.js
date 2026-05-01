import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(() => {
  const backendBase = "http://127.0.0.1:8000";
  const wsBase = backendBase.replace(/^http/, "ws");

  return {
    plugins: [react()],
    server: {
      port: 3000,
      // host: true → makes Vite accessible on the LAN so you can open
      //   http://<your-pc-ip>:3000  on a phone connected to the same Wi-Fi
      host: true,
      open: false,
      proxy: {
        // REST API
        "/api": {
          target: backendBase,
          changeOrigin: true,
          secure: false,
        },
        // WebSocket (chat + notifications)
        "/api/chat/ws": { target: wsBase, ws: true, changeOrigin: true },
        "/api/notifications/ws": { target: wsBase, ws: true, changeOrigin: true },
        // Static uploads served by FastAPI
        "/uploads": {
          target: backendBase,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: false,
    },
  };
});
