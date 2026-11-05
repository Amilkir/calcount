import { prisma } from "@/lib/db";
import { requireUserPage } from "@/lib/session";
import { MEAL_TEMPLATE_INCLUDE } from "@/lib/meals";
import FoodsManager from "@/components/FoodsManager";
import FoodsTabs from "@/components/FoodsTabs";
import MealsManager from "@/components/MealsManager";

export const dynamic = "force-dynamic";

export default async function FoodsPage() {
  const user = await requireUserPage();
  const [foods, meals] = await Promise.all([
    prisma.food.findMany({
      where: { OR: [{ userId: null }, { userId: user.id }] },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    prisma.mealTemplate.findMany({
      where: { userId: user.id },
      include: MEAL_TEMPLATE_INCLUDE,
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <FoodsTabs
      mealCount={meals.length}
      foods={<FoodsManager foods={foods} />}
      meals={<MealsManager foods={foods} meals={meals} />}
    />
  );
}
