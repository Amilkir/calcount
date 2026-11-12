import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUserPage } from "@/lib/session";
import StatsView from "@/components/stats/StatsView";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const user = await requireUserPage();
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/profiles/new");

  return <StatsView profileId={profile.id} profileName={profile.name} />;
}
