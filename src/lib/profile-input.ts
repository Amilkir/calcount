import {
  ActivityLevel,
  ActivityMode,
  BmrFormula,
  BodyType,
  Climate,
  Goal,
  JobActivity,
  MacroPreset,
  PhysiologicalState,
  Sex,
  StressLevel,
  ThyroidCondition,
  WorkoutType,
} from "@/generated/prisma/enums";
import { isEnumValue, isFiniteNumber, isNonEmptyString } from "./validate";

type Rule =
  | { kind: "enum"; values: Record<string, string>; label: string; nullable?: boolean }
  | { kind: "number"; min: number; max: number; label: string; integer?: boolean; nullable?: boolean }
  | { kind: "boolean"; label: string };

const REQUIRED_FIELDS = [
  "name",
  "sex",
  "age",
  "heightCm",
  "weightKg",
  "bodyType",
  "activityLevel",
  "goal",
] as const;

const RULES: Record<string, Rule> = {
  sex: { kind: "enum", values: Sex, label: "Sexo" },
  bodyType: { kind: "enum", values: BodyType, label: "Tipo de cuerpo" },
  activityLevel: { kind: "enum", values: ActivityLevel, label: "Nivel de actividad" },
  goal: { kind: "enum", values: Goal, label: "Meta" },
  bmrFormula: { kind: "enum", values: BmrFormula, label: "Fórmula de BMR" },
  activityMode: { kind: "enum", values: ActivityMode, label: "Modo de actividad" },
  jobActivity: { kind: "enum", values: JobActivity, label: "Actividad diaria" },
  workoutType: { kind: "enum", values: WorkoutType, label: "Tipo de entrenamiento" },
  physiologicalState: { kind: "enum", values: PhysiologicalState, label: "Estado fisiológico" },
  thyroidCondition: { kind: "enum", values: ThyroidCondition, label: "Condición de tiroides" },
  macroPreset: { kind: "enum", values: MacroPreset, label: "Distribución de macros" },
  climate: { kind: "enum", values: Climate, label: "Clima" },
  stressLevel: { kind: "enum", values: StressLevel, label: "Nivel de estrés", nullable: true },

  age: { kind: "number", min: 1, max: 120, integer: true, label: "Edad" },
  heightCm: { kind: "number", min: 50, max: 250, label: "Altura" },
  weightKg: { kind: "number", min: 20, max: 400, label: "Peso" },
  bodyFatPct: { kind: "number", min: 3, max: 60, label: "% de grasa", nullable: true },
  neckCm: { kind: "number", min: 10, max: 80, label: "Cuello", nullable: true },
  waistCm: { kind: "number", min: 30, max: 250, label: "Cintura", nullable: true },
  hipCm: { kind: "number", min: 30, max: 250, label: "Cadera", nullable: true },
  adjustmentPct: { kind: "number", min: 1, max: 50, label: "Porcentaje de ajuste", nullable: true },
  weeklyRateKg: { kind: "number", min: 0.05, max: 1.5, label: "Ritmo semanal", nullable: true },
  targetWeightKg: { kind: "number", min: 20, max: 400, label: "Peso objetivo", nullable: true },
  dailySteps: { kind: "number", min: 0, max: 60000, integer: true, label: "Pasos diarios", nullable: true },
  workoutsPerWeek: { kind: "number", min: 0, max: 14, integer: true, label: "Entrenamientos por semana", nullable: true },
  workoutMinutes: { kind: "number", min: 0, max: 300, integer: true, label: "Duración del entrenamiento", nullable: true },
  proteinPerKg: { kind: "number", min: 0.8, max: 3.5, label: "Proteína por kg", nullable: true },
  sleepHours: { kind: "number", min: 0, max: 24, label: "Horas de sueño", nullable: true },

  useBodyTypeAdjustment: { kind: "boolean", label: "Ajuste por tipo de cuerpo" },
  adaptiveTdee: { kind: "boolean", label: "Ajuste dinámico" },
};

export type ProfileInputResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; error: string };

/**
 * Valida el cuerpo de una petición de perfil. En modo `create` exige los campos
 * básicos; en modo `update` solo valida los campos presentes.
 */
export function parseProfileInput(
  body: unknown,
  mode: "create" | "update"
): ProfileInputResult {
  const input = (body ?? {}) as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if (mode === "create") {
    const missing = REQUIRED_FIELDS.some(
      (field) => input[field] === undefined || input[field] === null
    );
    if (missing) {
      return { ok: false, error: "Datos de perfil inválidos o incompletos." };
    }
  }

  if (input.name !== undefined) {
    if (!isNonEmptyString(input.name)) {
      return { ok: false, error: "Nombre inválido." };
    }
    data.name = input.name.trim();
  }

  for (const [field, rule] of Object.entries(RULES)) {
    const value = input[field];
    if (value === undefined) continue;

    if (value === null) {
      if (rule.kind !== "boolean" && rule.nullable) {
        data[field] = null;
        continue;
      }
      return { ok: false, error: `${rule.label} inválido.` };
    }

    if (rule.kind === "enum") {
      if (!isEnumValue(rule.values, value)) {
        return { ok: false, error: `${rule.label} inválido.` };
      }
    } else if (rule.kind === "number") {
      if (
        !isFiniteNumber(value) ||
        value < rule.min ||
        value > rule.max ||
        (rule.integer && !Number.isInteger(value))
      ) {
        return { ok: false, error: `${rule.label} inválido.` };
      }
    } else if (typeof value !== "boolean") {
      return { ok: false, error: `${rule.label} inválido.` };
    }
    data[field] = value;
  }

  return { ok: true, data };
}
