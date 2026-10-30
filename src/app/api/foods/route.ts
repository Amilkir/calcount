import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { FoodType, ServingUnit } from "@/generated/prisma/enums";
import { isEnumValue, isFiniteNumber, isNonEmptyString, parseMacros } from "@/lib/validate";
import { authorizeUser } from "@/lib/session";

export async function GET() {
  const auth = await authorizeUser();
  if (!auth.ok) return auth.response;

  const foods = await prisma.food.findMany({
    where: { OR: [{ userId: null }, { userId: auth.user.id }] },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(foods);
}

const DEFAULT_ICON = "🍽️";

export async function POST(request: NextRequest) {
  const auth = await authorizeUser();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const { name, category, icon, servingUnit, foodType, calories } = body ?? {};
  const macros = parseMacros(body);
  if (!macros.ok) {
    return NextResponse.json({ error: macros.error }, { status: 400 });
  }

  if (
    !isNonEmptyString(name) ||
    !isNonEmptyString(category) ||
    !isEnumValue(ServingUnit, servingUnit) ||
    !isEnumValue(FoodType, foodType) ||
    !isFiniteNumber(calories) ||
    calories < 0
  ) {
    return NextResponse.json(
      { error: "Datos de alimento inválidos o incompletos." },
      { status: 400 }
    );
  }

  const existing = await prisma.food.findFirst({
    where: { name: name.trim(), OR: [{ userId: null }, { userId: auth.user.id }] },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Ya existe un alimento con ese nombre." },
      { status: 409 }
    );
  }

  const food = await prisma.food.create({
    data: {
      userId: auth.user.id,
      name: name.trim(),
      category: category.trim(),
      icon: isNonEmptyString(icon) ? icon.trim() : DEFAULT_ICON,
      servingUnit,
      foodType,
      calories,
      ...macros.data,
    },
  });

  return NextResponse.json(food, { status: 201 });
}
