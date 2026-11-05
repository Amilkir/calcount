// Autocompletado de calorías: dado lo que queda del día y los alimentos disponibles,
// propone cantidades enteras (gramos o unidades) para cada alimento.
import type { Food } from "@/generated/prisma/client";
import { foodMacrosPerServing, type MacroGrams } from "./macros";

export interface Remaining extends MacroGrams {
  calories: number;
}

export interface AutofillItem extends MacroGrams {
  food: Food;
  /** Gramos o unidades, siempre entero. */
  quantity: number;
  calories: number;
}

export interface AutofillOption {
  items: AutofillItem[];
  totals: Remaining;
}

export interface AutofillResult {
  /** Opción 1: completa exactamente las calorías restantes, repartiendo los macros en proporción. */
  exact: AutofillOption;
  /** Opción 2: completa los macros restantes; puede pasarse de calorías. null si no quedan macros. */
  macros: AutofillOption | null;
}

const MACROS = ["protein", "carbs", "fat"] as const;
const KCAL_PER_GRAM: Record<(typeof MACROS)[number], number> = { protein: 4, carbs: 4, fat: 9 };
// Porción de referencia que se usa como "ancla" suave para no proponer cantidades absurdas.
const TYPICAL_GRAMS = 150;
const TYPICAL_UNITS = 2;
const SWEEPS = 800;
// Topes por alimento para que las propuestas sean porciones razonables.
const MAX_GRAMS = 350;
const MAX_UNITS = 8;
const maxSteps = (food: Food) => (food.servingUnit === "UNIT" ? MAX_UNITS : MAX_GRAMS);

/** Valores de un paso de cantidad (1 g o 1 unidad) del alimento. */
function perStep(food: Food): Remaining {
  const serving = foodMacrosPerServing(food);
  const factor = food.servingUnit === "UNIT" ? 1 : 1 / 100;
  return {
    calories: serving.calories * factor,
    protein: serving.protein * factor,
    carbs: serving.carbs * factor,
    fat: serving.fat * factor,
  };
}

/** Mínimos cuadrados con 0 ≤ x ≤ upper, por descenso de coordenadas (n es chico). */
function solveBounded(rows: { coef: number[]; target: number }[], upper: number[]): number[] {
  const n = upper.length;
  const x = new Array<number>(n).fill(0);
  const residual = rows.map((r) => -r.target);
  const colNorm = Array.from({ length: n }, (_, j) =>
    rows.reduce((sum, r) => sum + r.coef[j] * r.coef[j], 0)
  );

  for (let sweep = 0; sweep < SWEEPS; sweep++) {
    for (let j = 0; j < n; j++) {
      if (colNorm[j] === 0) continue;
      const grad = rows.reduce((sum, r, i) => sum + r.coef[j] * residual[i], 0);
      const next = Math.min(upper[j], Math.max(0, x[j] - grad / colNorm[j]));
      const delta = next - x[j];
      if (delta !== 0) {
        rows.forEach((r, i) => (residual[i] += r.coef[j] * delta));
        x[j] = next;
      }
    }
  }
  return x;
}

function buildOption(foods: Food[], steps: Remaining[], quantities: number[]): AutofillOption {
  const items: AutofillItem[] = [];
  const totals: Remaining = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  foods.forEach((food, i) => {
    const quantity = quantities[i];
    if (quantity <= 0) return;
    const s = steps[i];
    const item: AutofillItem = {
      food,
      quantity,
      calories: s.calories * quantity,
      protein: s.protein * quantity,
      carbs: s.carbs * quantity,
      fat: s.fat * quantity,
    };
    items.push(item);
    totals.calories += item.calories;
    totals.protein += item.protein;
    totals.carbs += item.carbs;
    totals.fat += item.fat;
  });
  return { items, totals };
}

const kcalOf = (steps: Remaining[], q: number[]) =>
  q.reduce((sum, qty, i) => sum + steps[i].calories * qty, 0);

/**
 * Ajusta cantidades ya redondeadas para que las calorías den lo más cerca posible del
 * objetivo: primero con el alimento en gramos de mayor cantidad (cambio relativo menor)
 * y luego afina con el de menos kcal por gramo.
 */
function fitCalories(foods: Food[], steps: Remaining[], q: number[], target: number): number[] {
  const result = [...q];
  const clamp = (i: number, v: number) => Math.min(maxSteps(foods[i]), Math.max(0, v));

  // Búsqueda local de ±1 paso: resuelve los casos con alimentos por unidad.
  for (let improved = true; improved; ) {
    improved = false;
    const current = Math.abs(target - kcalOf(steps, result));
    let best = { i: -1, v: 0, gap: current };
    result.forEach((qty, i) => {
      for (const v of [qty - 1, qty + 1]) {
        if (v !== clamp(i, v)) continue;
        const gap = Math.abs(target - kcalOf(steps, result) + steps[i].calories * (qty - v));
        if (gap < best.gap - 1e-9) best = { i, v, gap };
      }
    });
    if (best.i >= 0) {
      result[best.i] = best.v;
      improved = true;
    }
  }

  const grams = foods
    .map((food, i) => ({ i, food }))
    .filter(({ food, i }) => food.servingUnit === "GRAMS_100" && steps[i].calories > 0);
  if (grams.length === 0) return result;

  const byQuantity = [...grams].sort((a, b) => result[b.i] - result[a.i]);
  const byFineness = [...grams].sort((a, b) => steps[a.i].calories - steps[b.i].calories);

  for (const { i } of [byQuantity[0], byFineness[0]]) {
    const diff = target - kcalOf(steps, result);
    result[i] = clamp(i, result[i] + Math.round(diff / steps[i].calories));
  }
  return result;
}

export function suggestPortions(foods: Food[], remaining: Remaining): AutofillResult | null {
  if (foods.length === 0 || remaining.calories <= 0) return null;

  const n = foods.length;
  const steps = foods.map(perStep);
  const upper = foods.map(maxSteps);
  const macroTargets = MACROS.map((m) => Math.max(0, remaining[m]));
  const macroKcal = MACROS.reduce((sum, m, k) => sum + macroTargets[k] * KCAL_PER_GRAM[m], 0);

  // Ancla suave: una porción típica, o menos si con eso ya se superan las calorías.
  const anchor = foods.map((food, i) => {
    const typical = food.servingUnit === "UNIT" ? TYPICAL_UNITS : TYPICAL_GRAMS;
    const evenShare = steps[i].calories > 0 ? remaining.calories / n / steps[i].calories : typical;
    return Math.max(1, Math.min(typical, evenShare));
  });
  const anchorRows = (weight: number) =>
    foods.map((_, j) => ({
      coef: foods.map((__, i) => (i === j ? weight / anchor[j] : 0)),
      target: weight,
    }));

  const macroRows = (targets: number[]) =>
    MACROS.map((m, k) => {
      const w = 1 / Math.max(targets[k], 5);
      return { coef: steps.map((s) => s[m] * w), target: targets[k] * w };
    });

  // --- Opción 1: calorías exactas, macros en la proporción que queda ---
  const scale = macroKcal > 0 ? remaining.calories / macroKcal : 0;
  const scaledTargets = macroTargets.map((t) => t * scale);
  const calorieWeight = 20 / remaining.calories;
  const exactRows = [
    { coef: steps.map((s) => s.calories * calorieWeight), target: 20 },
    ...(macroKcal > 0 ? macroRows(scaledTargets) : []),
    ...anchorRows(0.3),
  ];
  const exactRaw = solveBounded(exactRows, upper).map((v) => Math.round(v));
  const exact = buildOption(foods, steps, fitCalories(foods, steps, exactRaw, remaining.calories));

  // --- Opción 2: completar los macros que quedan, sin límite de calorías ---
  let macros: AutofillOption | null = null;
  if (macroKcal > 0) {
    const macroRaw = solveBounded([...macroRows(macroTargets), ...anchorRows(0.1)], upper);
    macros = buildOption(
      foods,
      steps,
      macroRaw.map((v) => Math.round(v))
    );
  }

  return { exact, macros };
}
