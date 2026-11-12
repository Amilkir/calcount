// Estadísticas de un rango de días: consumo, metas vigentes cada día, macros y hábitos.
import type { Profile } from "@/generated/prisma/client";
import type { MealSlot } from "@/generated/prisma/enums";
import { prisma } from "./db";
import { getTargetsForProfile } from "./targets";
import { addDays, toDateKey } from "./date";
import { entryMacros } from "./macros";
import { dayHabitStatus, type DailyLogData } from "./daily-log";
import { decodeSupplements } from "./supplements";
import { decodeSportPlan, decodeSportsDone, sportsBonusKcal } from "./sports";
import type { StatsDay, StatsResponse } from "./stats-types";

const SLOTS: MealSlot[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK", "EXTRA"];

/** Lista de fechas entre start y end, ambas incluidas. */
export function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) dates.push(d);
  return dates;
}

export async function buildStats(
  profile: Profile,
  startDate: string,
  endDate: string
): Promise<StatsResponse> {
  const [targets, entries, logs, changes, weights] = await Promise.all([
    getTargetsForProfile(profile),
    prisma.foodEntry.findMany({
      where: { profileId: profile.id, date: { gte: startDate, lte: endDate } },
      include: { food: true },
    }),
    prisma.dailyLog.findMany({
      where: { profileId: profile.id, date: { gte: startDate, lte: endDate } },
    }),
    prisma.profileChange.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true, goalAfter: true, maintenanceAfter: true },
    }),
    prisma.weightLog.findMany({
      where: { profileId: profile.id },
      orderBy: { date: "asc" },
      select: { date: true, weightKg: true },
      take: 1000,
    }),
  ]);

  const logByDate = new Map(logs.map((l) => [l.date, l]));
  const changeKeys = changes.map((c) => ({ ...c, date: toDateKey(c.createdAt) }));

  /**
   * Meta y mantenimiento vigentes un día pasado, según el historial de cambios del perfil.
   * Si no hay historial que lo cubra, se usan los actuales.
   */
  function historicalTargets(date: string) {
    let found: (typeof changeKeys)[number] | undefined;
    for (const c of changeKeys) {
      if (c.date <= date) found = c;
      else break;
    }
    return found
      ? { goal: found.goalAfter, maintenance: found.maintenanceAfter }
      : { goal: targets.goalCalories, maintenance: targets.maintenanceCalories };
  }

  const todayKey = toDateKey(new Date());
  const current = {
    supplements: decodeSupplements(profile.supplements),
    waterGoalMl: targets.waterMl,
    todayKey,
  };

  const days: StatsDay[] = dateRange(startDate, endDate).map((date) => {
    const dayEntries = entries.filter((e) => e.date === date);
    const log = logByDate.get(date);

    const bySlot = Object.fromEntries(SLOTS.map((s) => [s, 0])) as Record<MealSlot, number>;
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    let otherKcal = 0;
    for (const entry of dayEntries) {
      const m = entryMacros(entry);
      calories += entry.calories;
      protein += m.protein;
      carbs += m.carbs;
      fat += m.fat;
      if (m.kind === "other") otherKcal += entry.calories;
      bySlot[entry.mealSlot] += entry.calories;
    }

    // Metas: lo guardado ese día si existe; si no, se reconstruye desde el historial del perfil.
    const history = historicalTargets(date);
    const baseGoal = log?.goalCalories ?? history.goal;
    const proteinG = log?.proteinG ?? targets.macros.proteinG;
    const fatG = log?.fatG ?? targets.macros.fatG;
    const baseCarbs = log?.carbsG ?? Math.max(0, (baseGoal - proteinG * 4 - fatG * 9) / 4);

    const sports = decodeSportsDone(log?.sportsDone);
    const sportKcal = sportsBonusKcal(sports);

    const logData: DailyLogData | undefined = log && {
      date,
      waterMl: log.waterMl,
      waterGoalMl: log.waterGoalMl,
      supplementsPlanned: decodeSupplements(log.supplementsPlanned),
      supplementsTaken: decodeSupplements(log.supplementsTaken),
      sportsDone: sports,
    };
    const habits = dayHabitStatus(date, logData, current);

    return {
      date,
      logged: dayEntries.length > 0,
      calories,
      protein,
      carbs,
      fat,
      otherKcal,
      bySlot,
      goal: baseGoal + sportKcal,
      proteinG,
      carbsG: baseCarbs + sportKcal / 4,
      fatG,
      maintenance: history.maintenance + sportKcal,
      sports,
      sportKcal,
      waterReached: habits.waterReached,
      supplementsDone: habits.supplementsDone,
    };
  });

  return {
    startDate,
    endDate,
    days,
    weights,
    showWeightChart: profile.showWeightChart,
    hasSupplements: current.supplements.length > 0 || logs.some((l) => l.supplementsPlanned !== "[]"),
    hasSports: decodeSportPlan(profile.sports).length > 0 || days.some((d) => d.sports.length > 0),
  };
}
