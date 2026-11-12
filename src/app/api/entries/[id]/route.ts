import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authorizeUser } from "@/lib/session";
import { entryCalories, isValidPortion } from "@/lib/meals";
import { isFiniteNumber, isNonEmptyString } from "@/lib/validate";

type Context = { params: Promise<{ id: string }> };

/**
 * Corrige un registro ya cargado. Alimento: `quantity` (se recalculan las calorías).
 * Alimento libre: `calories` y/o `freeDescription`.
 * Comida porcionable: `portions` (se reescalan calorías y macros).
 */
export async function PATCH(request: NextRequest, context: Context) {
  const { id } = await context.params;
  const auth = await authorizeUser();
  if (!auth.ok) return auth.response;

  const entry = await prisma.foodEntry.findFirst({
    where: { id, profile: { userId: auth.user.id } },
    include: { food: true },
  });
  if (!entry) {
    return NextResponse.json({ error: "Registro no encontrado." }, { status: 404 });
  }

  const body = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  let data: {
    quantity?: number;
    calories?: number;
    freeDescription?: string;
    portions?: number;
    protein?: number | null;
    carbs?: number | null;
    fat?: number | null;
  };

  if (entry.portions != null) {
    // Comida porcionable: se reescalan las calorías y macros guardados al cargarla,
    // así no depende de cómo esté hoy la receta.
    const { portions } = body;
    if (!isValidPortion(portions)) {
      return NextResponse.json({ error: "Porciones inválidas." }, { status: 400 });
    }
    const factor = portions / entry.portions;
    const scale = (v: number | null) => (v == null ? null : v * factor);
    data = {
      portions,
      calories: entry.calories * factor,
      protein: scale(entry.protein),
      carbs: scale(entry.carbs),
      fat: scale(entry.fat),
    };
  } else if (entry.food) {
    const { quantity } = body;
    if (!isFiniteNumber(quantity) || quantity <= 0) {
      return NextResponse.json({ error: "Cantidad inválida." }, { status: 400 });
    }
    data = { quantity, calories: entryCalories(entry.food, quantity) };
  } else {
    const { calories, freeDescription } = body;
    data = {};
    if (calories !== undefined) {
      if (!isFiniteNumber(calories) || calories <= 0) {
        return NextResponse.json({ error: "Calorías inválidas." }, { status: 400 });
      }
      data.calories = calories;
    }
    if (freeDescription !== undefined) {
      if (!isNonEmptyString(freeDescription)) {
        return NextResponse.json({ error: "Descripción inválida." }, { status: 400 });
      }
      data.freeDescription = freeDescription.trim();
    }
  }

  const updated = await prisma.foodEntry.update({
    where: { id },
    data,
    include: { food: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  const auth = await authorizeUser();
  if (!auth.ok) return auth.response;

  // deleteMany con el filtro de dueño: solo borra si el registro es del usuario.
  const { count } = await prisma.foodEntry.deleteMany({
    where: { id, profile: { userId: auth.user.id } },
  });
  if (count === 0) {
    return NextResponse.json({ error: "Registro no encontrado." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
