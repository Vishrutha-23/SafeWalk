import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // ✅ This is the critical fix (TomTom SDK must be pre‑bundled)
  optimizeDeps: {
    include: ["@tomtom-international/web-sdk-maps"],
  },

  // Optional: sometimes needed on Windows
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}));
