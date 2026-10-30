import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { FoodType, ServingUnit } from "@/generated/prisma/enums";
import { isEnumValue, isFiniteNumber, isNonEmptyString, parseMacros } from "@/lib/validate";
import { authorizeUser } from "@/lib/session";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  const { id } = await context.params;
  const auth = await authorizeUser();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const { name, category, icon, servingUnit, foodType, calories } = body ?? {};

  const data: Record<string, unknown> = {};
  if (name !== undefined) {
    if (!isNonEmptyString(name)) {
      return NextResponse.json({ error: "Nombre inválido." }, { status: 400 });
    }
    data.name = name.trim();
  }
  if (category !== undefined) {
    if (!isNonEmptyString(category)) {
      return NextResponse.json({ error: "Categoría inválida." }, { status: 400 });
    }
    data.category = category.trim();
  }
  if (icon !== undefined) {
    if (!isNonEmptyString(icon)) {
      return NextResponse.json({ error: "Ícono inválido." }, { status: 400 });
    }
    data.icon = icon.trim();
  }
  if (servingUnit !== undefined) {
    if (!isEnumValue(ServingUnit, servingUnit)) {
      return NextResponse.json({ error: "Unidad de porción inválida." }, { status: 400 });
    }
    data.servingUnit = servingUnit;
  }
  if (foodType !== undefined) {
    if (!isEnumValue(FoodType, foodType)) {
      return NextResponse.json({ error: "Tipo de alimento inválido." }, { status: 400 });
    }
    data.foodType = foodType;
  }
  if (calories !== undefined) {
    if (!isFiniteNumber(calories) || calories < 0) {
      return NextResponse.json({ error: "Calorías inválidas." }, { status: 400 });
    }
    data.calories = calories;
  }
  const macros = parseMacros(body);
  if (!macros.ok) {
    return NextResponse.json({ error: macros.error }, { status: 400 });
  }
  Object.assign(data, macros.data);

  // Solo se pueden editar alimentos propios; el catálogo global es de solo lectura.
  const owned = await prisma.food.findFirst({ where: { id, userId: auth.user.id } });
  if (!owned) {
    return NextResponse.json({ error: "Alimento no encontrado." }, { status: 404 });
  }
  const food = await prisma.food.update({ where: { id }, data });
  return NextResponse.json(food);
}

export async function DELETE(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  const auth = await authorizeUser();
  if (!auth.ok) return auth.response;

  const { count } = await prisma.food.deleteMany({ where: { id, userId: auth.user.id } });
  if (count === 0) {
    return NextResponse.json({ error: "Alimento no encontrado." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
