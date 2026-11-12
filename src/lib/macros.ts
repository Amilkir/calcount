import type { FoodEntryWithFood } from "./types";

export type PredominantMacro = "CARBOHIDRATOS" | "PROTEINAS" | "GRASAS" | "CHEAT_MEAL";

export function formatFreeDescription(description: string, macro: PredominantMacro): string {
  const clean = description.replace(/\s*\[(PROTEINAS|CARBOHIDRATOS|GRASAS|CHEAT_MEAL)\]\s*$/i, "").trim();
  return `${clean} [${macro}]`;
}

export function parseFreeDescription(raw: string | null | undefined): {
  description: string;
  macro: PredominantMacro;
} {
  if (!raw) return { description: "", macro: "CHEAT_MEAL" };
  const match = raw.match(/^(.*?)(?:\s*\[(PROTEINAS|CARBOHIDRATOS|GRASAS|CHEAT_MEAL)\])?$/i);
  if (!match) return { description: raw.trim(), macro: "CHEAT_MEAL" };
  const description = (match[1] ?? "").trim() || raw.trim();
  const macroTag = match[2]?.toUpperCase() as PredominantMacro | undefined;
  return {
    description,
    macro:
      macroTag && ["PROTEINAS", "CARBOHIDRATOS", "GRASAS", "CHEAT_MEAL"].includes(macroTag)
        ? macroTag
        : "CHEAT_MEAL",
  };
}

export interface MacroGrams {
  protein: number;
  carbs: number;
  fat: number;
}

export interface DayMacros extends MacroGrams {
  /** Calorías de Cheat Meal / registros libres sin macro predominante asignado. */
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
  // Porciones de una comida porcionable: los macros quedaron guardados al cargarla.
  if (entry.portions != null) {
    return {
      protein: entry.protein ?? 0,
      carbs: entry.carbs ?? 0,
      fat: entry.fat ?? 0,
      kind: "exact",
    };
  }

  const food = entry.food;
  if (!food) {
    const { macro } = parseFreeDescription(entry.freeDescription);
    const kcal = entry.calories;
    if (macro === "PROTEINAS") {
      return { protein: kcal / 4, carbs: 0, fat: 0, kind: "estimated" };
    }
    if (macro === "CARBOHIDRATOS") {
      return { protein: 0, carbs: kcal / 4, fat: 0, kind: "estimated" };
    }
    if (macro === "GRASAS") {
      return { protein: 0, carbs: 0, fat: kcal / 9, kind: "estimated" };
    }
    return { protein: 0, carbs: 0, fat: 0, kind: "other" };
  }

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

/**
 * Calorías y macros de una porción del alimento (100 g o 1 unidad). Si no tiene
 * macros guardados se estiman por su tipo, igual que en el resumen del día.
 */
export function foodMacrosPerServing(
  food: NonNullable<FoodEntryWithFood["food"]>
): MacroGrams & { calories: number; estimated: boolean } {
  if (hasMacros(food)) {
    return {
      calories: food.calories,
      protein: food.protein ?? 0,
      carbs: food.carbs ?? 0,
      fat: food.fat ?? 0,
      estimated: false,
    };
  }
  const kcal = food.calories;
  return {
    calories: kcal,
    protein: food.foodType === "PROTEINAS" ? kcal / 4 : 0,
    carbs: food.foodType === "CARBOHIDRATOS" ? kcal / 4 : 0,
    fat: food.foodType === "GRASAS" ? kcal / 9 : 0,
    estimated: true,
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
