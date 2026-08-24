import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: false,
        secure: false
      },
      "/ws": {
        target: "ws://localhost:5000",
        ws: true
      }
    },
    fs: {
      strict: true,
      deny: [".env", ".env.*", "*.pem", "*.key", "*.crt"]
    }
  },
  preview: {
    host: "localhost",
    port: 4173,
    strictPort: true
  },
  build: {
    // Three.js is intentionally isolated in its own cacheable vendor chunk.
    // Its minified size is ~533 kB (~133 kB gzip), so use a realistic ceiling
    // while retaining warnings for unexpectedly large application chunks.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/three/")) return "three-core";
          if (id.includes("node_modules/@react-three/fiber/")) return "r3f-vendor";
          if (id.includes("node_modules/three-mesh-bvh/")) return "three-bvh-vendor";
          if (id.includes("node_modules/camera-controls/")) return "three-controls-vendor";
          if (id.includes("node_modules/troika-three")) return "troika-vendor";
          if (id.includes("node_modules/@react-three/drei/")) return "drei-vendor";
          if (id.includes("node_modules/gsap")) return "gsap-vendor";
          if (id.includes("node_modules/motion")) return "motion-vendor";
          if (id.includes("node_modules/react") || id.includes("node_modules/react-router")) {
            return "react-vendor";
          }
        }
      }
    }
  }
});
