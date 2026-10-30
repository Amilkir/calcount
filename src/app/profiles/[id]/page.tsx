import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getTargetsForProfile } from "@/lib/targets";
import { requireUserPage } from "@/lib/session";
import Dashboard from "@/components/Dashboard";

export default async function ProfileDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUserPage();
  const profile = await prisma.profile.findFirst({ where: { id, userId: user.id } });
  if (!profile) notFound();

  const foods = await prisma.food.findMany({
    where: { OR: [{ userId: null }, { userId: user.id }] },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const targets = await getTargetsForProfile(profile);

  return <Dashboard profile={profile} foods={foods} targets={targets} />;
}
