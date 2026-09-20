import { defineConfig } from "vite";

export default defineConfig({
  server: {
    // The server, the root prestart's kill-port, the Dockerfile's EXPOSE and the
    // e2e runner's printed URL all assume 1234.
    port: 1234,
    strictPort: true,
    // Bind all interfaces so the client Dockerfile's published port reaches it.
    host: true
  },
  preview: {
    port: 1234,
    strictPort: true
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // Matches tsconfig's sourceMap - Vite omits these from builds by default.
    sourcemap: true,
    // Keep every sprite a real file. Inlined assets become data: URIs, which would
    // bloat the bundle with ~148 sprites and defeat the content-hashed filenames
    // SpriteAtlas leans on to invalidate its IndexedDB cache.
    assetsInlineLimit: 0
  }
});
