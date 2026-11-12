import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authorizeUser } from "@/lib/session";
import { MEAL_TEMPLATE_INCLUDE, parseMealTemplateInput } from "@/lib/meals";
import { checkMealFoods } from "@/lib/meal-foods";

export async function GET() {
  const auth = await authorizeUser();
  if (!auth.ok) return auth.response;

  const meals = await prisma.mealTemplate.findMany({
    where: { userId: auth.user.id },
    include: MEAL_TEMPLATE_INCLUDE,
    orderBy: { name: "asc" },
  });
  return NextResponse.json(meals);
}

export async function POST(request: NextRequest) {
  const auth = await authorizeUser();
  if (!auth.ok) return auth.response;

  const parsed = parseMealTemplateInput(await request.json().catch(() => null));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { name, icon, servings, items } = parsed.data;

  const foodsError = await checkMealFoods(auth.user.id, items);
  if (foodsError) return foodsError;

  const existing = await prisma.mealTemplate.findUnique({
    where: { userId_name: { userId: auth.user.id, name } },
  });
  if (existing) {
    return NextResponse.json({ error: "Ya tienes una comida con ese nombre." }, { status: 409 });
  }

  const meal = await prisma.mealTemplate.create({
    data: {
      userId: auth.user.id,
      name,
      icon,
      servings,
      items: { create: items.map((item, position) => ({ ...item, position })) },
    },
    include: MEAL_TEMPLATE_INCLUDE,
  });
  return NextResponse.json(meal, { status: 201 });
}
