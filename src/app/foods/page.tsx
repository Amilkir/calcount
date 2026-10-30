import { prisma } from "@/lib/db";
import { requireUserPage } from "@/lib/session";
import FoodsManager from "@/components/FoodsManager";

export const dynamic = "force-dynamic";

export default async function FoodsPage() {
  const user = await requireUserPage();
  const foods = await prisma.food.findMany({
    where: { OR: [{ userId: null }, { userId: user.id }] },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return <FoodsManager foods={foods} />;
}
