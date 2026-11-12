import { prisma } from "./db";
import type { Profile } from "@/generated/prisma/client";
import { calculateCalorieTargets, type CalorieTargets } from "./calories";
import {
  ADAPTIVE_WINDOW_DAYS,
  estimateObservedTdee,
  type AdaptiveEstimate,
} from "./adaptive";
import { addDays, toDateKey } from "./date";
import { decodeSupplements } from "./supplements";

export async function getAdaptiveEstimate(profileId: string): Promise<AdaptiveEstimate> {
  const todayKey = toDateKey(new Date());
  const windowStart = addDays(todayKey, -ADAPTIVE_WINDOW_DAYS);

  const [logs, totals] = await Promise.all([
    prisma.weightLog.findMany({
      where: { profileId, date: { gte: windowStart, lte: todayKey } },
      orderBy: { date: "asc" },
    }),
    prisma.foodEntry.groupBy({
      by: ["date"],
      where: { profileId, date: { gte: windowStart, lte: todayKey } },
      _sum: { calories: true },
    }),
  ]);

  const dailyCalories = Object.fromEntries(
    totals.map((t) => [t.date, t._sum.calories ?? 0])
  );
  return estimateObservedTdee(logs, dailyCalories, todayKey);
}

/** Calcula las metas de un perfil, aplicando el ajuste dinámico si está activo. */
export async function getTargetsForProfile(profile: Profile): Promise<CalorieTargets> {
  const observedTdee = profile.adaptiveTdee
    ? (await getAdaptiveEstimate(profile.id)).observedTdee
    : null;
  return calculateCalorieTargets({ ...profile, observedTdee });
}

/**
 * Lo vigente del perfil que se guarda con cada día: metas de calorías y macros (sin el
 * extra por deporte), meta de agua y suplementos. Así el historial y las estadísticas no
 * cambian si más adelante se edita el perfil o el peso.
 */
export async function dayLogSnapshot(profile: Profile) {
  const targets = await getTargetsForProfile(profile);
  return {
    waterGoalMl: targets.waterMl,
    supplementsPlanned: JSON.stringify(decodeSupplements(profile.supplements)),
    goalCalories: targets.goalCalories,
    proteinG: targets.macros.proteinG,
    carbsG: targets.macros.carbsG,
    fatG: targets.macros.fatG,
  };
}

/** Solo se actualiza lo vigente de hoy (con un día de margen por la diferencia horaria). */
export function isSnapshotDate(date: string): boolean {
  return date >= addDays(toDateKey(new Date()), -1);
}

/** Guarda las metas vigentes en el registro del día (si es hoy o ayer). */
export async function snapshotDay(profile: Profile, date: string): Promise<void> {
  if (!isSnapshotDate(date)) return;
  const snapshot = await dayLogSnapshot(profile);
  await prisma.dailyLog.upsert({
    where: { profileId_date: { profileId: profile.id, date } },
    update: snapshot,
    create: { profileId: profile.id, date, ...snapshot },
  });
}
