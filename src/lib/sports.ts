// Deportes de alta intensidad, separados del entrenamiento regular (gimnasio, rutina).
// No suman a la meta base del perfil: se suman el día que se marcan como hechos.
// Se guardan como JSON en Profile.sports (plan) y DailyLog.sportsDone (lo hecho cada día).
import type { Goal } from "@/generated/prisma/enums";

export const SPORTS = [
  "FOOTBALL",
  "BASKETBALL",
  "PADEL",
  "TENNIS",
  "RUNNING",
  "CYCLING",
  "SWIMMING",
  "VOLLEYBALL",
  "RUGBY",
  "OTHER",
] as const;

export type Sport = (typeof SPORTS)[number];

export const SPORT_LABELS: Record<Sport, string> = {
  FOOTBALL: "Fútbol",
  BASKETBALL: "Básquet",
  PADEL: "Pádel",
  TENNIS: "Tenis",
  RUNNING: "Running",
  CYCLING: "Ciclismo",
  SWIMMING: "Natación",
  VOLLEYBALL: "Vóley",
  RUGBY: "Rugby",
  OTHER: "Otro deporte",
};

// Equivalente metabólico (MET) típico de un partido o sesión (Compendium of Physical Activities).
const SPORT_MET: Record<Sport, number> = {
  FOOTBALL: 7,
  BASKETBALL: 6.5,
  PADEL: 6,
  TENNIS: 7.3,
  RUNNING: 9.8,
  CYCLING: 7.5,
  SWIMMING: 7,
  VOLLEYBALL: 4,
  RUGBY: 8.3,
  OTHER: 6,
};

/**
 * Parte de las kcal del deporte que se suma a la meta del día. Las estimaciones por MET
 * suelen inflar el gasto, así que en déficit se suma menos para no comerse el déficit.
 */
export const SPORT_CREDIT: Record<Goal, number> = {
  DEFICIT: 0.65,
  MAINTENANCE: 0.95,
  SURPLUS: 1,
};

export const MAX_SPORTS = 5;
export const MAX_SPORT_MINUTES = 300;
export const DEFAULT_SPORT_MINUTES = 60;

/** Un deporte del perfil: duración típica y frecuencia (la frecuencia es orientativa). */
export interface SportPlan {
  sport: Sport;
  minutes: number;
  perWeek: number;
}

/** Un deporte hecho un día, con las kcal que se sumaron a la meta (ya ajustadas). */
export interface SportDone {
  sport: Sport;
  minutes: number;
  kcal: number;
}

export function isSport(value: unknown): value is Sport {
  return typeof value === "string" && (SPORTS as readonly string[]).includes(value);
}

const validMinutes = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= MAX_SPORT_MINUTES;
const validPerWeek = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 14;

/** Kcal netas de un deporte (se resta 1 MET de reposo para no duplicar el metabolismo basal). */
export function sportBurnKcal(sport: Sport, minutes: number, weightKg: number): number {
  return (minutes * (SPORT_MET[sport] - 1) * 3.5 * weightKg) / 200;
}

/** Kcal que se suman a la meta del día por haber hecho el deporte. */
export function sportCreditKcal(
  sport: Sport,
  minutes: number,
  weightKg: number,
  goal: Goal
): number {
  return Math.round(sportBurnKcal(sport, minutes, weightKg) * SPORT_CREDIT[goal]);
}

/** Gasto diario promedio de los deportes del perfil (sin ajustar por objetivo). */
export function averageDailySportKcal(plan: SportPlan[], weightKg: number): number {
  return plan.reduce((sum, p) => sum + (sportBurnKcal(p.sport, p.minutes, weightKg) * p.perWeek) / 7, 0);
}

/** Valida la lista de deportes del perfil: claves conocidas, sin repetir y con datos válidos. */
export function parseSportPlan(value: unknown): SportPlan[] | null {
  if (!Array.isArray(value) || value.length > MAX_SPORTS) return null;
  const seen = new Set<Sport>();
  const plan: SportPlan[] = [];
  for (const raw of value) {
    const { sport, minutes, perWeek } = (raw ?? {}) as Record<string, unknown>;
    if (!isSport(sport) || seen.has(sport) || !validMinutes(minutes) || !validPerWeek(perWeek)) {
      return null;
    }
    seen.add(sport);
    plan.push({ sport, minutes, perWeek });
  }
  return plan;
}

/** Valida los deportes marcados en un día: [{ sport, minutes }], sin repetir. */
export function parseSportsDoneInput(value: unknown): { sport: Sport; minutes: number }[] | null {
  if (!Array.isArray(value) || value.length > SPORTS.length) return null;
  const seen = new Set<Sport>();
  const done: { sport: Sport; minutes: number }[] = [];
  for (const raw of value) {
    const { sport, minutes } = (raw ?? {}) as Record<string, unknown>;
    if (!isSport(sport) || seen.has(sport) || !validMinutes(minutes)) return null;
    seen.add(sport);
    done.push({ sport, minutes });
  }
  return done;
}

const readJson = (json: string | null | undefined): unknown[] => {
  try {
    const parsed: unknown = JSON.parse(json ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/** Lee los deportes del perfil (JSON o lista), ignorando valores corruptos o desconocidos. */
export function decodeSportPlan(value: string | SportPlan[] | null | undefined): SportPlan[] {
  const list = Array.isArray(value) ? value : readJson(value);
  const seen = new Set<Sport>();
  return list.flatMap((raw) => {
    const { sport, minutes, perWeek } = (raw ?? {}) as Record<string, unknown>;
    if (!isSport(sport) || seen.has(sport) || !validMinutes(minutes) || !validPerWeek(perWeek)) {
      return [];
    }
    seen.add(sport);
    return [{ sport, minutes, perWeek }];
  });
}

/** Lee los deportes hechos en un día. */
export function decodeSportsDone(json: string | null | undefined): SportDone[] {
  return readJson(json).flatMap((raw) => {
    const { sport, minutes, kcal } = (raw ?? {}) as Record<string, unknown>;
    if (!isSport(sport) || !validMinutes(minutes) || typeof kcal !== "number" || kcal < 0) return [];
    return [{ sport, minutes, kcal }];
  });
}

export function sportsBonusKcal(done: SportDone[] | undefined): number {
  return (done ?? []).reduce((sum, d) => sum + d.kcal, 0);
}

export function formatSportPlan(plan: SportPlan[]): string {
  return plan.length
    ? plan.map((p) => `${SPORT_LABELS[p.sport]} (${p.minutes} min, ${p.perWeek}×/sem)`).join(", ")
    : "Ninguno";
}
