/** Minúsculas y sin tildes: "Atún" y "atun" quedan iguales para buscar. */
export function normalizeText(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/** Orden alfabético en español, sin distinguir tildes ni mayúsculas. */
export function compareEs(a: string, b: string): number {
  return a.localeCompare(b, "es", { sensitivity: "base" });
}

export function sortByNameEs<T extends { name: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => compareEs(a.name, b.name));
}
