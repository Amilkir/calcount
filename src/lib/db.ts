import { PrismaClient } from "@/generated/prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// El binding D1 solo existe dentro de una petición, así que el cliente se
// resuelve de forma perezosa y se reutiliza mientras el binding sea el mismo.
const clients = new WeakMap<object, PrismaClient>();

export function getPrisma(): PrismaClient {
  const { env } = getCloudflareContext();
  let client = clients.get(env.DB);
  if (!client) {
    client = new PrismaClient({ adapter: new PrismaD1(env.DB) });
    clients.set(env.DB, client);
  }
  return client;
}

// Mantiene la API `prisma.<modelo>` que usa el resto de la app.
export const prisma = new Proxy({} as PrismaClient, {
  get: (_, prop) => Reflect.get(getPrisma(), prop),
});
