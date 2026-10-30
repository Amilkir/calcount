import { prisma } from "./db";
import type { Profile } from "@/generated/prisma/client";
import { calculateCalorieTargets, type CalorieTargets } from "./calories";
import {
  ADAPTIVE_WINDOW_DAYS,
  estimateObservedTdee,
  type AdaptiveEstimate,
} from "./adaptive";
import { addDays, toDateKey } from "./date";

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
