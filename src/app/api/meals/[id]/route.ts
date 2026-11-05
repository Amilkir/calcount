import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authorizeUser } from "@/lib/session";
import { MEAL_TEMPLATE_INCLUDE, parseMealTemplateInput } from "@/lib/meals";
import { checkMealFoods } from "@/lib/meal-foods";

type Context = { params: Promise<{ id: string }> };

/** Reemplaza el nombre, el ícono y la lista de alimentos de la comida. */
export async function PUT(request: NextRequest, context: Context) {
  const { id } = await context.params;
  const auth = await authorizeUser();
  if (!auth.ok) return auth.response;

  const owned = await prisma.mealTemplate.findFirst({ where: { id, userId: auth.user.id } });
  if (!owned) {
    return NextResponse.json({ error: "Comida no encontrada." }, { status: 404 });
  }

  const parsed = parseMealTemplateInput(await request.json().catch(() => null));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { name, icon, items } = parsed.data;

  const foodsError = await checkMealFoods(auth.user.id, items);
  if (foodsError) return foodsError;

  const clash = await prisma.mealTemplate.findFirst({
    where: { userId: auth.user.id, name, NOT: { id } },
  });
  if (clash) {
    return NextResponse.json({ error: "Ya tienes una comida con ese nombre." }, { status: 409 });
  }

  // Update anidado: borra los alimentos anteriores y crea los nuevos. D1 no es transaccional,
  // por eso todo se valida antes de escribir.
  const meal = await prisma.mealTemplate.update({
    where: { id },
    data: {
      name,
      icon,
      items: {
        deleteMany: {},
        create: items.map((item, position) => ({ ...item, position })),
      },
    },
    include: MEAL_TEMPLATE_INCLUDE,
  });
  return NextResponse.json(meal);
}

export async function DELETE(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  const auth = await authorizeUser();
  if (!auth.ok) return auth.response;

  const { count } = await prisma.mealTemplate.deleteMany({ where: { id, userId: auth.user.id } });
  if (count === 0) {
    return NextResponse.json({ error: "Comida no encontrada." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
