import { KCAL_PER_KG } from "./calories";
import { addDays } from "./date";

export const ADAPTIVE_WINDOW_DAYS = 28;
const MIN_LOGS = 4;
const MIN_SPAN_DAYS = 14;
const MIN_COVERAGE = 0.7;

export interface WeightPoint {
  date: string;
  weightKg: number;
}

export interface AdaptiveEstimate {
  observedTdee: number | null;
  reason: string | null;
  slopeKgPerWeek: number | null;
  avgIntake: number | null;
  spanDays: number;
  loggedDays: number;
}

function dayIndex(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}

/**
 * Estima el gasto real (TDEE) a partir de la tendencia del peso y la ingesta
 * registrada: TDEE = ingesta media − (kg/día × 7700).
 */
export function estimateObservedTdee(
  weights: WeightPoint[],
  dailyCalories: Record<string, number>,
  todayKey: string
): AdaptiveEstimate {
  const empty = (reason: string, spanDays = 0, loggedDays = 0): AdaptiveEstimate => ({
    observedTdee: null,
    reason,
    slopeKgPerWeek: null,
    avgIntake: null,
    spanDays,
    loggedDays,
  });

  const windowStart = addDays(todayKey, -ADAPTIVE_WINDOW_DAYS);
  const points = weights
    .filter((w) => w.date >= windowStart && w.date <= todayKey)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (points.length < MIN_LOGS) {
    return empty(`Registra al menos ${MIN_LOGS} pesos en los últimos ${ADAPTIVE_WINDOW_DAYS} días.`);
  }

  const first = points[0].date;
  const last = points[points.length - 1].date;
  const span = dayIndex(last) - dayIndex(first);
  if (span < MIN_SPAN_DAYS) {
    return empty(`Los registros de peso deben abarcar al menos ${MIN_SPAN_DAYS} días.`, span);
  }

  const loggedDates = Object.keys(dailyCalories).filter(
    (d) => d >= first && d <= last && dailyCalories[d] > 0
  );
  const coverage = loggedDates.length / (span + 1);
  if (coverage < MIN_COVERAGE) {
    return empty(
      `Registra tus comidas al menos el ${Math.round(MIN_COVERAGE * 100)} % de los días del período.`,
      span,
      loggedDates.length
    );
  }

  // Regresión lineal del peso contra el día.
  const xs = points.map((p) => dayIndex(p.date) - dayIndex(first));
  const ys = points.map((p) => p.weightKg);
  const n = points.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  const sxx = xs.reduce((a, x) => a + (x - meanX) ** 2, 0);
  const sxy = xs.reduce((a, x, i) => a + (x - meanX) * (ys[i] - meanY), 0);
  const slopePerDay = sxx === 0 ? 0 : sxy / sxx;

  const avgIntake =
    loggedDates.reduce((sum, d) => sum + dailyCalories[d], 0) / loggedDates.length;
  const tdee = avgIntake - slopePerDay * KCAL_PER_KG;

  return {
    observedTdee: Math.round(tdee),
    reason: null,
    slopeKgPerWeek: Math.round(slopePerDay * 7 * 100) / 100,
    avgIntake: Math.round(avgIntake),
    spanDays: span,
    loggedDays: loggedDates.length,
  };
}
