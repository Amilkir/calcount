// Prisma solo se usa aquí para generar el cliente y el SQL de las migraciones.
// La base real es Cloudflare D1 (ver wrangler.jsonc); las migraciones viven en
// /migrations y se aplican con `wrangler d1 migrations apply`.
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: "file:./dev.db",
  },
});
