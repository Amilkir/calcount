import type { Food, MealTemplate, MealTemplateItem } from "@/generated/prisma/client";
import { isFiniteNumber, isNonEmptyString } from "./validate";

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

export function formatQuantity(food: Pick<Food, "servingUnit">, quantity: number): string {
  return food.servingUnit === "UNIT" ? `${quantity} u` : `${quantity} g`;
}

export interface MealTemplateInput {
  name: string;
  icon: string;
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

  return {
    ok: true,
    data: {
      name: input.name.trim(),
      icon: isNonEmptyString(input.icon) ? input.icon.trim() : DEFAULT_MEAL_ICON,
      items,
    },
  };
}
