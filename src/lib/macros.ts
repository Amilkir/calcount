import type { FoodEntryWithFood } from "./types";

export interface MacroGrams {
  protein: number;
  carbs: number;
  fat: number;
}

export interface DayMacros extends MacroGrams {
  /** Calorías de registros sin alimento asociado (no se pueden repartir en macros). */
  otherKcal: number;
  /** Gramos que provienen de una estimación por tipo de alimento, no de datos reales. */
  estimated: boolean;
}

const hasMacros = (food: NonNullable<FoodEntryWithFood["food"]>) =>
  food.protein != null || food.carbs != null || food.fat != null;

/** Gramos de cada macro de un registro: reales si el alimento los tiene, estimados por tipo si no. */
export function entryMacros(entry: FoodEntryWithFood): MacroGrams & {
  kind: "exact" | "estimated" | "other";
} {
  const food = entry.food;
  if (!food) return { protein: 0, carbs: 0, fat: 0, kind: "other" };

  if (hasMacros(food)) {
    const factor = food.calories > 0 ? entry.calories / food.calories : 0;
    return {
      protein: (food.protein ?? 0) * factor,
      carbs: (food.carbs ?? 0) * factor,
      fat: (food.fat ?? 0) * factor,
      kind: "exact",
    };
  }

  const kcal = entry.calories;
  return {
    protein: food.foodType === "PROTEINAS" ? kcal / 4 : 0,
    carbs: food.foodType === "CARBOHIDRATOS" ? kcal / 4 : 0,
    fat: food.foodType === "GRASAS" ? kcal / 9 : 0,
    kind: "estimated",
  };
}

export function sumDayMacros(entries: FoodEntryWithFood[]): DayMacros {
  const total: DayMacros = { protein: 0, carbs: 0, fat: 0, otherKcal: 0, estimated: false };
  for (const entry of entries) {
    const m = entryMacros(entry);
    total.protein += m.protein;
    total.carbs += m.carbs;
    total.fat += m.fat;
    if (m.kind === "other") total.otherKcal += entry.calories;
    if (m.kind === "estimated") total.estimated = true;
  }
  return total;
}
