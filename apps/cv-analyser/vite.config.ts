import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

const plugins = [react(), tailwindcss()];

export default defineConfig({
  // Use root-relative asset URLs because the same SPA build is served under
  // multiple localized mount points (/cv-analyser, /career-path, /en/..., /es/...).
  // A product-specific base causes stale hashed files and blank pages on non-CV routes.
  base: '/',
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Warn when any individual chunk exceeds 500 KB (uncompressed)
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          // ─── PDF generation (jspdf + html2canvas) ─────────────────────
          // Only loaded on Results pages that export a PDF
          'vendor-pdf': ['jspdf', 'html2canvas'],

          // ─── PDF/DOCX parsing (pdfjs-dist + mammoth) ──────────────────
          // Loaded on every Home page for CV upload; isolate so it can be
          // preloaded independently and cached across pages
          'vendor-pdf-parse': ['pdfjs-dist', 'mammoth'],

          // ─── Radix UI primitives ──────────────────────────────────────
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-select',
            '@radix-ui/react-accordion',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-progress',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-popover',
          ],

          // ─── Animation library ────────────────────────────────────────
          'vendor-motion': ['framer-motion'],

          // ─── Charts (recharts) ────────────────────────────────────────
          // Only used in Results pages; keep in its own cacheable chunk
          'vendor-charts': ['recharts'],
        },
      },
    },
  },
  server: {
    port: 3000,
    strictPort: false,
    host: true,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      ".manus.computer",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: false,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      ".manus.computer",
    ],
  },
});
