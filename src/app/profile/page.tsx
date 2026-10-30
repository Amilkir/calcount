import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUserPage } from "@/lib/session";
import { profileToFormValues } from "@/lib/profile-form";
import type { ChangeItem } from "@/lib/profile-history";
import ProfileForm from "@/components/ProfileForm";
import ProfileHistory from "@/components/ProfileHistory";
import ProfileTabs from "@/components/ProfileTabs";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUserPage();
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/profiles/new");

  const rows = await prisma.profileChange.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const entries = rows.map((r) => ({
    id: r.id,
    source: r.source,
    note: r.note,
    changes: JSON.parse(r.changes) as ChangeItem[],
    goalBefore: r.goalBefore,
    goalAfter: r.goalAfter,
    maintenanceBefore: r.maintenanceBefore,
    maintenanceAfter: r.maintenanceAfter,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">Tu perfil</h1>
        <p className="text-sm text-neutral-500">
          Actualiza tus datos cuando algo cambie: cada ajuste queda registrado con su efecto en
          tus calorías.
        </p>
      </div>

      <ProfileTabs
        historyCount={entries.length}
        form={
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <ProfileForm
              mode="edit"
              profileId={profile.id}
              initialValues={profileToFormValues(profile)}
            />
          </div>
        }
        history={<ProfileHistory entries={entries} />}
      />
    </div>
  );
}
