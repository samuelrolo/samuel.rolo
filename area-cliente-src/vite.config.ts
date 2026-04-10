import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

const plugins = [react(), tailwindcss()];

export default defineConfig({
  base: '/area-cliente/',
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
          // ─── Supabase client ─────────────────────────────────────────────
          // Auth + DB client; large but needed on every page
          'vendor-supabase': ['@supabase/supabase-js'],

          // ─── PDF/DOCX parsing (pdfjs-dist + mammoth) ──────────────────
          // Only used in MemberArea for CV upload; lazy-load friendly
          'vendor-pdf-parse': ['pdfjs-dist', 'mammoth'],

          // ─── PDF generation (jspdf) ─────────────────────────────────────
          // Only loaded when user exports a PDF
          'vendor-pdf-gen': ['jspdf'],

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
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-avatar',
            '@radix-ui/react-switch',
          ],

          // ─── Animation library ────────────────────────────────────────
          'vendor-motion': ['framer-motion'],

          // ─── Charts (recharts) ────────────────────────────────────────
          // Only used in analytics/dashboard views
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
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
