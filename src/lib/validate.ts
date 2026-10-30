export function isEnumValue<T extends Record<string, string>>(
  enumObj: T,
  value: unknown
): value is T[keyof T] {
  return typeof value === "string" && Object.values(enumObj).includes(value);
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

const MACRO_FIELDS = ["protein", "carbs", "fat"] as const;

/** Valida los macros opcionales de un alimento (gramos por porción; null los borra). */
export function parseMacros(
  body: unknown
):
  | { ok: true; data: Partial<Record<(typeof MACRO_FIELDS)[number], number | null>> }
  | { ok: false; error: string } {
  const input = (body ?? {}) as Record<string, unknown>;
  const data: Partial<Record<(typeof MACRO_FIELDS)[number], number | null>> = {};
  for (const field of MACRO_FIELDS) {
    const value = input[field];
    if (value === undefined) continue;
    if (value === null) {
      data[field] = null;
    } else if (isFiniteNumber(value) && value >= 0) {
      data[field] = value;
    } else {
      return { ok: false, error: "Macronutrientes inválidos." };
    }
  }
  return { ok: true, data };
}
