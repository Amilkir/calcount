// Tipos de las estadísticas, compartidos entre la API y la vista (sin dependencias del servidor).
import type { MealSlot } from "@/generated/prisma/enums";
import type { SportDone } from "./sports";

export interface StatsDay {
  date: string;
  /** Si hay alimentos registrados ese día. Los días sin registro no cuentan en los promedios. */
  logged: boolean;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Kcal de cheat meals y registros libres sin macro asignado. */
  otherKcal: number;
  bySlot: Record<MealSlot, number>;
  /** Meta del día: la vigente entonces más lo sumado por deporte. */
  goal: number;
  /** Metas de macros del día (los carbohidratos incluyen el extra por deporte). */
  proteinG: number;
  carbsG: number;
  fatG: number;
  /** Mantenimiento vigente ese día (más el deporte), para el peso esperado. */
  maintenance: number;
  sports: SportDone[];
  sportKcal: number;
  waterReached: boolean;
  /** null si ese día no había suplementos que tomar. */
  supplementsDone: boolean | null;
}

export interface WeightPoint {
  date: string;
  weightKg: number;
}

export interface StatsResponse {
  startDate: string;
  endDate: string;
  days: StatsDay[];
  /** Todos los registros de peso, desde el primero. */
  weights: WeightPoint[];
  showWeightChart: boolean;
  /** Si el perfil tiene suplementos o deportes (para mostrar u ocultar esos hábitos). */
  hasSupplements: boolean;
  hasSports: boolean;
}

/** Margen alrededor de la meta que se considera "en meta". */
export const ON_TARGET_PCT = 0.1;
export const MAX_RANGE_DAYS = 366;
