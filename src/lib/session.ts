import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function getSession() {
  // headers() primero: marca la ruta como dinámica antes de tocar el contexto de Cloudflare.
  const requestHeaders = await headers();
  return getAuth().api.getSession({ headers: requestHeaders });
}

/** Para páginas: exige sesión o redirige al login. */
export async function requireUserPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.user;
}

/** Para rutas API: devuelve 401 si no hay sesión. */
export async function authorizeUser() {
  const session = await getSession();
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "No autenticado." }, { status: 401 }),
    };
  }
  return { ok: true as const, user: session.user };
}

/** Para rutas API: el perfil debe existir y pertenecer al usuario autenticado. */
export async function authorizeProfile(profileId: string) {
  const auth = await authorizeUser();
  if (!auth.ok) return auth;

  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId: auth.user.id },
  });
  if (!profile) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Perfil no encontrado." }, { status: 404 }),
    };
  }
  return { ok: true as const, user: auth.user, profile };
}
