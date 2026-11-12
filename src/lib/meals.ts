import type { Food, MealTemplate, MealTemplateItem } from "@/generated/prisma/client";
import { isFiniteNumber, isNonEmptyString } from "./validate";
import { foodMacrosPerServing, type MacroGrams } from "./macros";

/** Porciones que puede rendir una comida porcionable. */
export const MIN_SERVINGS = 2;
export const MAX_SERVINGS = 100;
/** Las porciones consumidas se cargan de a media porción. */
export const PORTION_STEP = 0.5;

export function isValidPortion(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0 && Number.isInteger(value / PORTION_STEP);
}

export function formatPortions(portions: number): string {
  const n = portions.toLocaleString("es", { maximumFractionDigits: 1 });
  return `${n} ${portions === 1 ? "porción" : "porciones"}`;
}

export type MealTemplateWithItems = MealTemplate & {
  items: (MealTemplateItem & { food: Food })[];
};

/** Include de Prisma para traer una comida con sus alimentos en orden. */
export const MEAL_TEMPLATE_INCLUDE = {
  items: { include: { food: true }, orderBy: { position: "asc" } },
} as const;

export const MAX_MEAL_ITEMS = 30;
export const DEFAULT_MEAL_ICON = "🍱";

/** Calorías de una cantidad de alimento (gramos o unidades según su porción). */
export function entryCalories(
  food: Pick<Food, "servingUnit" | "calories">,
  quantity: number
): number {
  return food.servingUnit === "UNIT" ? food.calories * quantity : food.calories * (quantity / 100);
}

export function templateCalories(template: MealTemplateWithItems): number {
  return template.items.reduce((sum, item) => sum + entryCalories(item.food, item.quantity), 0);
}

/** Calorías y macros de toda la receta (macros estimados por tipo si el alimento no los tiene). */
export function templateTotals(
  items: { food: Food; quantity: number }[]
): MacroGrams & { calories: number } {
  return items.reduce(
    (t, { food, quantity }) => {
      const per = foodMacrosPerServing(food);
      const servings = food.servingUnit === "UNIT" ? quantity : quantity / 100;
      return {
        calories: t.calories + per.calories * servings,
        protein: t.protein + per.protein * servings,
        carbs: t.carbs + per.carbs * servings,
        fat: t.fat + per.fat * servings,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

/** Calorías y macros de `portions` porciones de una comida porcionable. */
export function portionTotals(
  template: MealTemplateWithItems & { servings: number },
  portions: number
): MacroGrams & { calories: number } {
  const total = templateTotals(template.items);
  const factor = portions / template.servings;
  return {
    calories: total.calories * factor,
    protein: total.protein * factor,
    carbs: total.carbs * factor,
    fat: total.fat * factor,
  };
}

export function formatQuantity(food: Pick<Food, "servingUnit">, quantity: number): string {
  return food.servingUnit === "UNIT" ? `${quantity} u` : `${quantity} g`;
}

export interface MealTemplateInput {
  name: string;
  icon: string;
  /** null = comida normal (no porcionable). */
  servings: number | null;
  items: { foodId: string; quantity: number }[];
}

export function parseMealTemplateInput(
  body: unknown
): { ok: true; data: MealTemplateInput } | { ok: false; error: string } {
  const input = (body ?? {}) as Record<string, unknown>;
  if (!isNonEmptyString(input.name) || input.name.trim().length > 80) {
    return { ok: false, error: "Ingresa un nombre para la comida." };
  }
  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { ok: false, error: "Agrega al menos un alimento a la comida." };
  }
  if (input.items.length > MAX_MEAL_ITEMS) {
    return { ok: false, error: `Una comida puede tener hasta ${MAX_MEAL_ITEMS} alimentos.` };
  }

  const items: MealTemplateInput["items"] = [];
  for (const raw of input.items) {
    const item = (raw ?? {}) as Record<string, unknown>;
    if (!isNonEmptyString(item.foodId) || !isFiniteNumber(item.quantity) || item.quantity <= 0) {
      return { ok: false, error: "Cada alimento necesita una cantidad válida." };
    }
    items.push({ foodId: item.foodId, quantity: item.quantity });
  }

  const servings = input.servings ?? null;
  if (
    servings !== null &&
    (!Number.isInteger(servings) ||
      (servings as number) < MIN_SERVINGS ||
      (servings as number) > MAX_SERVINGS)
  ) {
    return {
      ok: false,
      error: `Las porciones deben ser un número entero entre ${MIN_SERVINGS} y ${MAX_SERVINGS}.`,
    };
  }

  return {
    ok: true,
    data: {
      name: input.name.trim(),
      icon: isNonEmptyString(input.icon) ? input.icon.trim() : DEFAULT_MEAL_ICON,
      servings: servings as number | null,
      items,
    },
  };
}
