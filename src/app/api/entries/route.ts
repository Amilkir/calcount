import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { MealSlot } from "@/generated/prisma/enums";
import { isEnumValue, isFiniteNumber, isNonEmptyString } from "@/lib/validate";
import { authorizeProfile } from "@/lib/session";

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

  const calories =
    food.servingUnit === "UNIT"
      ? food.calories * quantity
      : food.calories * (quantity / 100);

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
