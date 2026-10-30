import type { Profile } from "@/generated/prisma/client";
import { prisma } from "./db";
import { getTargetsForProfile } from "./targets";
import {
  ACTIVITY_LEVEL_LABELS,
  ACTIVITY_MODE_LABELS,
  BMR_FORMULA_LABELS,
  BODY_TYPE_LABELS,
  CLIMATE_LABELS,
  GOAL_LABELS,
  JOB_ACTIVITY_LABELS,
  MACRO_PRESET_LABELS,
  PHYSIOLOGICAL_STATE_LABELS,
  SEX_LABELS,
  STRESS_LABELS,
  THYROID_LABELS,
  WORKOUT_TYPE_LABELS,
} from "./labels";

export type ChangeSource = "CREATED" | "EDIT" | "WEIGHT";

export interface ChangeItem {
  field: string;
  label: string;
  from: string;
  to: string;
}

const DASH = "—";
const short = (text: string) => text.split(" (")[0];

const num = (unit?: string) => (v: unknown) =>
  v == null ? DASH : unit ? `${v} ${unit}` : String(v);
const lookup = (labels: Record<string, string>) => (v: unknown) =>
  v == null ? DASH : short(labels[String(v)] ?? String(v));
const bool = (v: unknown) => (v ? "Sí" : "No");

// Campos del perfil que se registran en el historial, con su etiqueta y formato legible.
const FIELDS: Record<string, { label: string; format: (v: unknown) => string }> = {
  name: { label: "Nombre", format: (v) => String(v) },
  sex: { label: "Sexo", format: lookup(SEX_LABELS) },
  age: { label: "Edad", format: num("años") },
  heightCm: { label: "Altura", format: num("cm") },
  weightKg: { label: "Peso", format: num("kg") },
  bodyType: { label: "Tipo de cuerpo", format: lookup(BODY_TYPE_LABELS) },
  activityLevel: { label: "Nivel de actividad", format: lookup(ACTIVITY_LEVEL_LABELS) },
  goal: { label: "Meta", format: lookup(GOAL_LABELS) },
  bodyFatPct: { label: "% de grasa", format: num("%") },
  neckCm: { label: "Cuello", format: num("cm") },
  waistCm: { label: "Cintura", format: num("cm") },
  hipCm: { label: "Cadera", format: num("cm") },
  bmrFormula: { label: "Fórmula de metabolismo basal", format: lookup(BMR_FORMULA_LABELS) },
  useBodyTypeAdjustment: { label: "Ajuste por tipo de cuerpo", format: bool },
  adjustmentPct: { label: "Déficit/superávit", format: num("%") },
  weeklyRateKg: { label: "Ritmo semanal", format: num("kg/sem") },
  targetWeightKg: { label: "Peso objetivo", format: num("kg") },
  activityMode: { label: "Modo de actividad", format: lookup(ACTIVITY_MODE_LABELS) },
  jobActivity: { label: "Actividad diaria", format: lookup(JOB_ACTIVITY_LABELS) },
  dailySteps: { label: "Pasos diarios", format: num() },
  workoutsPerWeek: { label: "Entrenamientos por semana", format: num() },
  workoutMinutes: { label: "Minutos por sesión", format: num("min") },
  workoutType: { label: "Tipo de entrenamiento", format: lookup(WORKOUT_TYPE_LABELS) },
  physiologicalState: { label: "Embarazo / lactancia", format: lookup(PHYSIOLOGICAL_STATE_LABELS) },
  thyroidCondition: { label: "Tiroides", format: lookup(THYROID_LABELS) },
  macroPreset: { label: "Distribución de macros", format: lookup(MACRO_PRESET_LABELS) },
  proteinPerKg: { label: "Proteína", format: num("g/kg") },
  sleepHours: { label: "Horas de sueño", format: num("h") },
  stressLevel: { label: "Nivel de estrés", format: lookup(STRESS_LABELS) },
  climate: { label: "Clima", format: lookup(CLIMATE_LABELS) },
  adaptiveTdee: { label: "Ajuste dinámico", format: bool },
};

export function diffProfiles(before: Profile, after: Profile): ChangeItem[] {
  const items: ChangeItem[] = [];
  for (const [field, { label, format }] of Object.entries(FIELDS)) {
    const a = before[field as keyof Profile];
    const b = after[field as keyof Profile];
    if (a !== b) items.push({ field, label, from: format(a), to: format(b) });
  }
  return items;
}

/**
 * Guarda en el historial qué cambió en el perfil y cómo movió la meta calórica.
 * No registra nada si no hubo cambios (salvo la creación del perfil).
 */
export async function recordProfileChange(args: {
  before: Profile | null;
  after: Profile;
  source: ChangeSource;
  note?: string | null;
}) {
  const { before, after, source } = args;
  const changes = before ? diffProfiles(before, after) : [];
  if (before && changes.length === 0) return;

  const [targetsBefore, targetsAfter] = await Promise.all([
    before ? getTargetsForProfile(before) : null,
    getTargetsForProfile(after),
  ]);

  await prisma.profileChange.create({
    data: {
      profileId: after.id,
      source,
      note: args.note?.trim() || null,
      changes: JSON.stringify(changes),
      goalBefore: targetsBefore?.goalCalories ?? null,
      goalAfter: targetsAfter.goalCalories,
      maintenanceBefore: targetsBefore?.maintenanceCalories ?? null,
      maintenanceAfter: targetsAfter.maintenanceCalories,
    },
  });
}
