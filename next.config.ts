import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import path from "node:path";

const nextConfig: NextConfig = {
  /* config options here */
};

// Expone los bindings de Cloudflare (D1) a `next dev`.
// Guardamos el estado persistente en `node_modules/.cache` para evitar que el
// file watcher de Turbopack/Next.js detecte escrituras de SQLite en `.wrangler` y entre en un bucle infinito de recargas.
if (process.env.NODE_ENV !== "production") {
  initOpenNextCloudflareForDev({
    persist: {
      path: path.resolve(process.cwd(), "node_modules/.cache/wrangler/state/v3"),
    },
  });
}

export default nextConfig;
