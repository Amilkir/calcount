import { NextResponse } from "next/server";
import { prisma } from "./db";

/** Verifica que todos los alimentos existan y sean del catálogo o del propio usuario. */
export async function checkMealFoods(
  userId: string,
  items: { foodId: string }[]
): Promise<NextResponse | null> {
  const ids = [...new Set(items.map((i) => i.foodId))];
  const count = await prisma.food.count({
    where: { id: { in: ids }, OR: [{ userId: null }, { userId }] },
  });
  if (count !== ids.length) {
    return NextResponse.json({ error: "Alguno de los alimentos no existe." }, { status: 400 });
  }
  return null;
}
