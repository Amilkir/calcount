// Suplementos disponibles. Se guardan como JSON (array de claves) en Profile.supplements
// y en DailyLog.supplementsPlanned / supplementsTaken.
export const SUPPLEMENTS = [
  "CREATINE",
  "OMEGA_3",
  "MULTIVITAMIN",
  "VITAMIN_C",
  "COLLAGEN",
  "INOSITOL",
  "MAGNESIUM",
  "MELATONIN",
] as const;

export type Supplement = (typeof SUPPLEMENTS)[number];

export const SUPPLEMENT_LABELS: Record<Supplement, string> = {
  CREATINE: "Creatina",
  OMEGA_3: "Omega 3",
  MULTIVITAMIN: "Multivitamínico",
  VITAMIN_C: "Vitamina C",
  COLLAGEN: "Colágeno",
  INOSITOL: "Inositol",
  MAGNESIUM: "Magnesio",
  MELATONIN: "Melatonina",
};

export function isSupplement(value: unknown): value is Supplement {
  return typeof value === "string" && (SUPPLEMENTS as readonly string[]).includes(value);
}

/** Valida una lista de suplementos: solo claves conocidas y sin repetir. */
export function parseSupplementList(value: unknown): Supplement[] | null {
  if (!Array.isArray(value) || !value.every(isSupplement)) return null;
  return [...new Set(value)];
}

/** Lee la lista guardada como JSON, ignorando valores corruptos o desconocidos. */
export function decodeSupplements(json: string | null | undefined): Supplement[] {
  try {
    const parsed: unknown = JSON.parse(json ?? "[]");
    return Array.isArray(parsed) ? [...new Set(parsed.filter(isSupplement))] : [];
  } catch {
    return [];
  }
}

export function formatSupplements(list: Supplement[]): string {
  return list.length ? list.map((s) => SUPPLEMENT_LABELS[s]).join(", ") : "Ninguno";
}
