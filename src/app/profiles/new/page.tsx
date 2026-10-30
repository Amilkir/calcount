import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUserPage } from "@/lib/session";
import ProfileForm from "@/components/ProfileForm";

export const dynamic = "force-dynamic";

export default async function NewProfilePage() {
  const user = await requireUserPage();
  const existing = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (existing) redirect(`/profiles/${existing.id}`);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Crea tu perfil</h1>
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <ProfileForm mode="create" />
      </div>
    </div>
  );
}
