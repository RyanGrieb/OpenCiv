import { defineConfig } from "vite";

// Both default to what the root `npm start` uses. Set them (the root `npm run start:ports`
// launcher does) to run several client/server pairs side by side.
const clientPort = Number(process.env.CLIENT_PORT || 1234);
const serverPort = Number(process.env.SERVER_PORT || 2000);

export default defineConfig({
  // The port the client's websocket connects to when the join screen's address has none.
  define: {
    "import.meta.env.VITE_SERVER_PORT": JSON.stringify(String(serverPort))
  },
  server: {
    // The root prestart's kill-port, the Dockerfile's EXPOSE and compose.yml assume
    // the default 1234.
    port: clientPort,
    strictPort: true,
    // Bind all interfaces so the client Dockerfile's published port reaches it.
    host: true
  },
  preview: {
    port: clientPort,
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
