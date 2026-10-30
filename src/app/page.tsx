import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUserPage } from "@/lib/session";

export const dynamic = "force-dynamic";

// Un perfil por cuenta: la home solo decide a dónde enviar al usuario.
export default async function HomePage() {
  const user = await requireUserPage();
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  redirect(profile ? `/profiles/${profile.id}` : "/profiles/new");
}
