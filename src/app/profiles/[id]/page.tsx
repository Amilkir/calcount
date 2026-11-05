import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getTargetsForProfile } from "@/lib/targets";
import { requireUserPage } from "@/lib/session";
import { MEAL_TEMPLATE_INCLUDE } from "@/lib/meals";
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

  const [foods, meals, targets] = await Promise.all([
    prisma.food.findMany({
      where: { OR: [{ userId: null }, { userId: user.id }] },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    prisma.mealTemplate.findMany({
      where: { userId: user.id },
      include: MEAL_TEMPLATE_INCLUDE,
      orderBy: { name: "asc" },
    }),
    getTargetsForProfile(profile),
  ]);

  return <Dashboard profile={profile} foods={foods} meals={meals} targets={targets} />;
}
