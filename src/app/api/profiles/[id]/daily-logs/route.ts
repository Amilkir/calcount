import { NextRequest, NextResponse } from "next/server";
import type { DailyLog } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { authorizeProfile } from "@/lib/session";
import type { DailyLogData } from "@/lib/daily-log";
import { dayLogSnapshot, isSnapshotDate } from "@/lib/targets";
import { decodeSupplements, parseSupplementList } from "@/lib/supplements";
import { decodeSportsDone, parseSportsDoneInput, sportCreditKcal } from "@/lib/sports";
import { isFiniteNumber, isNonEmptyString } from "@/lib/validate";

type Context = { params: Promise<{ id: string }> };

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_WATER_ML = 20000;

function toData(log: DailyLog): DailyLogData {
  return {
    date: log.date,
    waterMl: log.waterMl,
    waterGoalMl: log.waterGoalMl,
    supplementsPlanned: decodeSupplements(log.supplementsPlanned),
    supplementsTaken: decodeSupplements(log.supplementsTaken),
    sportsDone: decodeSportsDone(log.sportsDone),
    goalCalories: log.goalCalories,
    proteinG: log.proteinG,
    carbsG: log.carbsG,
    fatG: log.fatG,
  };
}

export async function GET(request: NextRequest, context: Context) {
  const { id } = await context.params;
  const auth = await authorizeProfile(id);
  if (!auth.ok) return auth.response;

  const startDate = request.nextUrl.searchParams.get("startDate");
  const endDate = request.nextUrl.searchParams.get("endDate");
  if (
    !isNonEmptyString(startDate) ||
    !isNonEmptyString(endDate) ||
    !DATE_KEY.test(startDate) ||
    !DATE_KEY.test(endDate)
  ) {
    return NextResponse.json(
      { error: "Se requieren los parámetros startDate y endDate." },
      { status: 400 }
    );
  }

  const logs = await prisma.dailyLog.findMany({
    where: { profileId: id, date: { gte: startDate, lte: endDate } },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(logs.map(toData));
}

/**
 * Crea o actualiza el registro de un día. Acepta `waterMl`, `supplementsTaken` y/o
 * `sportsDone` ([{ sport, minutes }]; las kcal se calculan aquí con el peso y la meta actuales).
 */
export async function PUT(request: NextRequest, context: Context) {
  const { id } = await context.params;
  const auth = await authorizeProfile(id);
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const date = body?.date;
  if (!isNonEmptyString(date) || !DATE_KEY.test(date)) {
    return NextResponse.json({ error: "Fecha inválida." }, { status: 400 });
  }

  const data: { waterMl?: number; supplementsTaken?: string; sportsDone?: string } = {};

  if (body?.waterMl !== undefined) {
    const waterMl = body.waterMl;
    if (!isFiniteNumber(waterMl) || waterMl < 0 || waterMl > MAX_WATER_ML) {
      return NextResponse.json({ error: "Cantidad de agua inválida." }, { status: 400 });
    }
    data.waterMl = Math.round(waterMl);
  }

  if (body?.supplementsTaken !== undefined) {
    const taken = parseSupplementList(body.supplementsTaken);
    if (!taken) {
      return NextResponse.json({ error: "Suplementos inválidos." }, { status: 400 });
    }
    data.supplementsTaken = JSON.stringify(taken);
  }

  if (body?.sportsDone !== undefined) {
    const done = parseSportsDoneInput(body.sportsDone);
    if (!done) {
      return NextResponse.json({ error: "Deportes inválidos." }, { status: 400 });
    }
    const { weightKg, goal } = auth.profile;
    data.sportsDone = JSON.stringify(
      done.map((d) => ({ ...d, kcal: sportCreditKcal(d.sport, d.minutes, weightKg, goal) }))
    );
  }

  // Se guarda lo vigente del perfil (metas, agua y suplementos), para que el historial del
  // día no cambie si más adelante se edita el perfil o el peso. Los días pasados conservan el suyo.
  const snapshot = await dayLogSnapshot(auth.profile);
  const refreshSnapshot = isSnapshotDate(date);

  const log = await prisma.dailyLog.upsert({
    where: { profileId_date: { profileId: id, date } },
    update: refreshSnapshot ? { ...data, ...snapshot } : data,
    create: { profileId: id, date, ...data, ...snapshot },
  });

  return NextResponse.json(toData(log));
}
