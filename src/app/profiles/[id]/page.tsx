import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getTargetsForProfile } from "@/lib/targets";
import { requireUserPage } from "@/lib/session";
import { MEAL_TEMPLATE_INCLUDE } from "@/lib/meals";
import Dashboard from "@/components/Dashboard";

export default async function ProfileDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string | string[] }>;
}) {
  const { id } = await params;
  // ?date=YYYY-MM-DD abre un día pasado para editarlo (desde Estadísticas).
  const rawDate = (await searchParams).date;
  const date = typeof rawDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : undefined;
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

  return <Dashboard
      key={date ?? "today"}
      profile={profile}
      foods={foods}
      meals={meals}
      targets={targets}
      date={date}
    />;
}
