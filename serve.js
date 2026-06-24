// Production entry point for Bun.
// Serves dist/client/ as static files (with immutable caching for hashed
// assets) and falls back to the TanStack Start SSR fetch handler for
// everything else.

import handler from "./dist/server/server.js";

const CLIENT_DIR = new URL("./dist/client", import.meta.url).pathname;
const PORT = parseInt(process.env.PORT ?? "3000", 10);

Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",

  async fetch(req) {
    const { pathname } = new URL(req.url);

    // Static asset requests — all hashed filenames live under /assets/
    // and the favicon is at the root.
    if (pathname.startsWith("/assets/") || pathname === "/favicon.ico") {
      const file = Bun.file(CLIENT_DIR + pathname);
      if (await file.exists()) {
        return new Response(file, {
          headers: {
            // Vite hashes asset filenames → safe to cache forever
            "cache-control": pathname.startsWith("/assets/")
              ? "public, max-age=31536000, immutable"
              : "public, max-age=3600",
          },
        });
      }
    }

    // Everything else → SSR handler (also handles client-side navigation
    // catch-all so deep links work)
    return handler.fetch(req);
  },
});

console.log(`Server listening on http://0.0.0.0:${PORT}`);
