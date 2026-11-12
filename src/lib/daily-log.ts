import type { Supplement } from "./supplements";
import type { SportDone } from "./sports";

/** Registro diario de hidratación y suplementos, tal como lo devuelve la API. */
export interface DailyLogData {
  date: string;
  waterMl: number;
  waterGoalMl: number;
  supplementsPlanned: Supplement[];
  supplementsTaken: Supplement[];
  /** Deportes hechos ese día, con las kcal que se suman a la meta. */
  sportsDone: SportDone[];
  /** Metas vigentes ese día (sin el extra por deporte); null si no se guardaron. */
  goalCalories?: number | null;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
}

export interface DayHabitStatus {
  /** null si no hay suplementos que tomar ese día. */
  supplementsDone: boolean | null;
  waterMl: number;
  waterGoalMl: number;
  waterReached: boolean;
}

export interface CurrentHabits {
  supplements: Supplement[];
  waterGoalMl: number;
  todayKey: string;
}

/**
 * Suplementos y meta de agua que aplican a un día. Los días pasados con registro
 * conservan lo vigente al registrarlos; hoy y los días sin registro usan el perfil actual.
 */
export function dayPlan(
  date: string,
  log: DailyLogData | undefined,
  current: CurrentHabits
): { supplements: Supplement[]; waterGoalMl: number } {
  if (log && date < current.todayKey) {
    return { supplements: log.supplementsPlanned, waterGoalMl: log.waterGoalMl };
  }
  return { supplements: current.supplements, waterGoalMl: current.waterGoalMl };
}

/** Estado de un día: si se tomaron todos los suplementos y si se alcanzó la meta de agua. */
export function dayHabitStatus(
  date: string,
  log: DailyLogData | undefined,
  current: CurrentHabits
): DayHabitStatus {
  const plan = dayPlan(date, log, current);
  const planned = plan.supplements;
  const taken = new Set(log?.supplementsTaken ?? []);
  const waterMl = log?.waterMl ?? 0;
  const waterGoalMl = plan.waterGoalMl;
  return {
    supplementsDone: planned.length ? planned.every((s) => taken.has(s)) : null,
    waterMl,
    waterGoalMl,
    waterReached: waterGoalMl > 0 && waterMl >= waterGoalMl,
  };
}
