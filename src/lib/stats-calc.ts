// Cálculos de la vista de Estadísticas a partir de los días que devuelve la API.
import type { MealSlot } from "@/generated/prisma/enums";
import { KCAL_PER_KG } from "./calories";
import { ON_TARGET_PCT, type StatsDay, type WeightPoint } from "./stats-types";

export type MacroKey = "protein" | "carbs" | "fat";
export const MACRO_KEYS: MacroKey[] = ["protein", "carbs", "fat"];
export const MACRO_TARGET: Record<MacroKey, "proteinG" | "carbsG" | "fatG"> = {
  protein: "proteinG",
  carbs: "carbsG",
  fat: "fatG",
};
export const MACRO_KCAL: Record<MacroKey, number> = { protein: 4, carbs: 4, fat: 9 };
export const MACRO_NAMES: Record<MacroKey, string> = {
  protein: "Proteína",
  carbs: "Carbohidratos",
  fat: "Grasa",
};
export const MACRO_COLORS: Record<MacroKey | "cheat", string> = {
  protein: "var(--color-protein)",
  carbs: "var(--color-carbs)",
  fat: "var(--color-fat)",
  cheat: "var(--color-macro-other)",
};

export const fmt = (n: number, digits = 0) =>
  n.toLocaleString("es", { maximumFractionDigits: digits, minimumFractionDigits: digits });
export const signed = (n: number, digits = 0) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${fmt(Math.abs(n), digits)}`;

/** Desvío de las calorías respecto de la meta (0,12 = 12 % por encima). */
export const deviation = (d: StatsDay) => (d.goal > 0 ? d.calories / d.goal - 1 : 0);

export type DayStatus = "over" | "on" | "under";
export function dayStatus(d: StatsDay): DayStatus {
  const dev = deviation(d);
  return dev > ON_TARGET_PCT ? "over" : dev < -ON_TARGET_PCT ? "under" : "on";
}

const avg = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);

/** Días del rango que ya pasaron o son hoy (los futuros no cuentan para hábitos). */
export const pastDays = (days: StatsDay[], todayKey: string) => days.filter((d) => d.date <= todayKey);

export function summary(days: StatsDay[]) {
  const logged = days.filter((d) => d.logged);
  return {
    logged: logged.length,
    onTarget: logged.filter((d) => dayStatus(d) === "on").length,
    avgCalories: avg(logged.map((d) => d.calories)),
    avgGoal: avg(logged.map((d) => d.goal)),
    avgBalance: avg(logged.map((d) => d.calories - d.goal)),
  };
}

/** Cumplimiento de cada macro: % promedio alcanzado y días dentro del ±10 %. */
export function macroAccuracy(days: StatsDay[]) {
  const logged = days.filter((d) => d.logged);
  const perMacro = MACRO_KEYS.map((key) => {
    const ratios = logged
      .filter((d) => d[MACRO_TARGET[key]] > 0)
      .map((d) => d[key] / d[MACRO_TARGET[key]]);
    return {
      key,
      avgPct: avg(ratios),
      onTarget: ratios.filter((r) => Math.abs(r - 1) <= ON_TARGET_PCT).length,
      avgGrams: avg(logged.map((d) => d[key])),
      avgTarget: avg(logged.map((d) => d[MACRO_TARGET[key]])),
    };
  });
  const allMacrosOn = logged.filter((d) =>
    MACRO_KEYS.every((k) => d[MACRO_TARGET[k]] > 0 && Math.abs(d[k] / d[MACRO_TARGET[k]] - 1) <= ON_TARGET_PCT)
  ).length;
  const caloriesOn = logged.filter((d) => dayStatus(d) === "on").length;
  return { perMacro, logged: logged.length, allMacrosOn, caloriesOn };
}

export type ExcessKey = MacroKey | "cheat";
export const EXCESS_KEYS: ExcessKey[] = ["cheat", "fat", "carbs", "protein"];
export const EXCESS_NAMES: Record<ExcessKey, string> = { ...MACRO_NAMES, cheat: "Cheat meal" };

/**
 * Reparte el exceso de un día entre los macros que superaron su meta y los cheat meals
 * (que no tienen meta). Las partes se escalan para que sumen exactamente el exceso.
 */
export function excessBreakdown(d: StatsDay): { total: number; parts: Record<ExcessKey, number> } {
  const total = Math.max(0, d.calories - d.goal);
  const raw: Record<ExcessKey, number> = {
    protein: Math.max(0, (d.protein - d.proteinG) * MACRO_KCAL.protein),
    carbs: Math.max(0, (d.carbs - d.carbsG) * MACRO_KCAL.carbs),
    fat: Math.max(0, (d.fat - d.fatG) * MACRO_KCAL.fat),
    cheat: d.otherKcal,
  };
  const sum = EXCESS_KEYS.reduce((s, k) => s + raw[k], 0);
  const scale = sum > 0 ? total / sum : 0;
  const parts = Object.fromEntries(EXCESS_KEYS.map((k) => [k, raw[k] * scale])) as Record<ExcessKey, number>;
  return { total, parts };
}

export function excessTotals(days: StatsDay[]) {
  // Mismo criterio que el gráfico de calorías: solo los días "por encima" (más del +10 %).
  const overDays = days.filter((d) => d.logged && dayStatus(d) === "over");
  const totals = Object.fromEntries(EXCESS_KEYS.map((k) => [k, 0])) as Record<ExcessKey, number>;
  let total = 0;
  for (const d of overDays) {
    const b = excessBreakdown(d);
    total += b.total;
    for (const k of EXCESS_KEYS) totals[k] += b.parts[k];
  }
  return { overDays, totals, total };
}

export const SLOT_ORDER: MealSlot[] = ["BREAKFAST", "LUNCH", "SNACK", "DINNER", "EXTRA"];

/** Calorías promedio por comida en los días registrados. */
export function slotAverages(days: StatsDay[]) {
  const logged = days.filter((d) => d.logged);
  const total = logged.reduce((s, d) => s + d.calories, 0);
  return SLOT_ORDER.map((slot) => {
    const sum = logged.reduce((s, d) => s + d.bySlot[slot], 0);
    return { slot, avg: logged.length ? sum / logged.length : 0, share: total > 0 ? sum / total : 0 };
  });
}

/** Tendencia del peso: promedio de los registros de los 7 días previos a cada uno. */
export function weightTrend(points: WeightPoint[]): WeightPoint[] {
  const time = (d: string) => new Date(`${d}T00:00:00`).getTime();
  return points.map((p) => {
    const t = time(p.date);
    const window = points.filter((q) => time(q.date) <= t && time(q.date) > t - 7 * 86_400_000);
    return { date: p.date, weightKg: avg(window.map((q) => q.weightKg)) };
  });
}

/**
 * Peso esperado vs. real entre el primer y el último registro de peso del rango.
 * El esperado sale del balance de los días registrados (consumo − mantenimiento) / 7700.
 */
export function expectedVsReal(days: StatsDay[], weights: WeightPoint[]) {
  const start = days[0]?.date;
  const end = days[days.length - 1]?.date;
  const inRange = weights.filter((w) => start && end && w.date >= start && w.date <= end);
  if (inRange.length < 2) return null;
  const first = inRange[0];
  const last = inRange[inRange.length - 1];
  const between = days.filter((d) => d.date >= first.date && d.date < last.date);
  const logged = between.filter((d) => d.logged);
  const balance = logged.reduce((s, d) => s + (d.calories - d.maintenance), 0);
  return {
    from: first,
    to: last,
    real: last.weightKg - first.weightKg,
    expected: balance / KCAL_PER_KG,
    loggedDays: logged.length,
    totalDays: between.length,
  };
}

/** Etiqueta corta de un día: "lu 10". */
export function shortDay(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.toLocaleDateString("es-ES", { weekday: "short" }).replace(".", "").slice(0, 2);
  return `${weekday} ${d}`;
}

export function longDay(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

/** Máximo "redondo" para un eje (420 → 500, 1 300 → 2 000). */
export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(value));
  return [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= value) ?? value;
}
