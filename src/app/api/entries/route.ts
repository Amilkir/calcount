import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { MealSlot } from "@/generated/prisma/enums";
import { isEnumValue, isFiniteNumber, isNonEmptyString } from "@/lib/validate";
import { authorizeProfile } from "@/lib/session";
import { MEAL_TEMPLATE_INCLUDE, entryCalories } from "@/lib/meals";

export async function GET(request: NextRequest) {
  const profileId = request.nextUrl.searchParams.get("profileId");
  const date = request.nextUrl.searchParams.get("date");

  if (!isNonEmptyString(profileId) || !isNonEmptyString(date)) {
    return NextResponse.json(
      { error: "Se requieren los parámetros profileId y date." },
      { status: 400 }
    );
  }

  const auth = await authorizeProfile(profileId);
  if (!auth.ok) return auth.response;

  const entries = await prisma.foodEntry.findMany({
    where: { profileId, date },
    include: { food: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { profileId, mealSlot, date, freeDescription } = body ?? {};

  if (
    !isNonEmptyString(profileId) ||
    !isEnumValue(MealSlot, mealSlot) ||
    !isNonEmptyString(date)
  ) {
    return NextResponse.json(
      { error: "Datos de registro inválidos o incompletos." },
      { status: 400 }
    );
  }

  const auth = await authorizeProfile(profileId);
  if (!auth.ok) return auth.response;

  // Varios alimentos de una vez (autocompletado): foods = [{ foodId, quantity }].
  if (body.foods !== undefined) {
    const raw: unknown = body.foods;
    if (!Array.isArray(raw) || raw.length === 0 || raw.length > 20) {
      return NextResponse.json({ error: "Lista de alimentos inválida." }, { status: 400 });
    }
    const items: { foodId: string; quantity: number }[] = [];
    for (const entry of raw) {
      const { foodId, quantity } = (entry ?? {}) as Record<string, unknown>;
      if (!isNonEmptyString(foodId) || !isFiniteNumber(quantity) || quantity <= 0) {
        return NextResponse.json({ error: "Lista de alimentos inválida." }, { status: 400 });
      }
      items.push({ foodId, quantity });
    }
    const foods = await prisma.food.findMany({
      where: {
        id: { in: [...new Set(items.map((i) => i.foodId))] },
        OR: [{ userId: null }, { userId: auth.user.id }],
      },
    });
    const byId = new Map(foods.map((f) => [f.id, f]));
    if (items.some((i) => !byId.has(i.foodId))) {
      return NextResponse.json({ error: "Alimento no encontrado." }, { status: 404 });
    }

    const { count } = await prisma.foodEntry.createMany({
      data: items.map(({ foodId, quantity }) => ({
        profileId,
        foodId,
        mealSlot,
        quantity,
        date,
        calories: entryCalories(byId.get(foodId)!, quantity),
      })),
    });
    return NextResponse.json({ count }, { status: 201 });
  }

  // Comida guardada: se crea un registro por cada alimento de la plantilla.
  const { mealTemplateId } = body ?? {};
  if (mealTemplateId !== undefined) {
    if (!isNonEmptyString(mealTemplateId)) {
      return NextResponse.json({ error: "Comida inválida." }, { status: 400 });
    }
    const template = await prisma.mealTemplate.findFirst({
      where: { id: mealTemplateId, userId: auth.user.id },
      include: MEAL_TEMPLATE_INCLUDE,
    });
    if (!template || template.items.length === 0) {
      return NextResponse.json({ error: "Comida no encontrada." }, { status: 404 });
    }

    // Opcional: cantidades ajustadas para este registro, [{ itemId, quantity }].
    // Los alimentos de la plantilla que no vengan en la lista no se cargan.
    let selection = template.items.map((item) => ({ item, quantity: item.quantity }));
    if (body.items !== undefined) {
      const raw: unknown = body.items;
      const byId = new Map(template.items.map((item) => [item.id, item]));
      const seen = new Set<string>();
      if (!Array.isArray(raw) || raw.length === 0) {
        return NextResponse.json({ error: "Elige al menos un alimento." }, { status: 400 });
      }
      selection = [];
      for (const entry of raw) {
        const { itemId, quantity } = (entry ?? {}) as Record<string, unknown>;
        const item = typeof itemId === "string" ? byId.get(itemId) : undefined;
        if (!item || seen.has(item.id) || !isFiniteNumber(quantity) || quantity <= 0) {
          return NextResponse.json(
            { error: "Cantidades de la comida inválidas." },
            { status: 400 }
          );
        }
        seen.add(item.id);
        selection.push({ item, quantity });
      }
    }

    const { count } = await prisma.foodEntry.createMany({
      data: selection.map(({ item, quantity }) => ({
        profileId,
        foodId: item.foodId,
        mealSlot,
        quantity,
        date,
        calories: entryCalories(item.food, quantity),
      })),
    });
    return NextResponse.json({ count }, { status: 201 });
  }

  if (isNonEmptyString(freeDescription)) {
    const { calories } = body ?? {};
    if (!isFiniteNumber(calories) || calories <= 0) {
      return NextResponse.json(
        { error: "Datos de alimento libre inválidos o incompletos." },
        { status: 400 }
      );
    }

    const entry = await prisma.foodEntry.create({
      data: {
        profileId,
        mealSlot,
        date,
        freeDescription: freeDescription.trim(),
        calories,
      },
      include: { food: true },
    });

    return NextResponse.json(entry, { status: 201 });
  }

  const { foodId, quantity } = body ?? {};

  if (!isNonEmptyString(foodId) || !isFiniteNumber(quantity) || quantity <= 0) {
    return NextResponse.json(
      { error: "Datos de registro inválidos o incompletos." },
      { status: 400 }
    );
  }

  const food = await prisma.food.findFirst({
    where: { id: foodId, OR: [{ userId: null }, { userId: auth.user.id }] },
  });
  if (!food) {
    return NextResponse.json({ error: "Alimento no encontrado." }, { status: 404 });
  }

  const calories = entryCalories(food, quantity);

  const entry = await prisma.foodEntry.create({
    data: {
      profileId,
      foodId,
      mealSlot,
      quantity,
      date,
      calories,
    },
    include: { food: true },
  });

  return NextResponse.json(entry, { status: 201 });
}
