import type {
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
  ThyroidCondition,
  WorkoutType,
} from "@/generated/prisma/enums";

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
};

const BODY_TYPE_ADJUSTMENT: Record<BodyType, number> = {
  ECTOMORPH: 1.05,
  MESOMORPH: 1.0,
  ENDOMORPH: 0.95,
};

// Multiplicador sobre el BMR según la actividad fuera del ejercicio (trabajo, hogar).
const JOB_MULTIPLIER: Record<JobActivity, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.3,
  MODERATE: 1.4,
  HEAVY: 1.55,
};

// Equivalente metabólico (MET) típico de cada tipo de entrenamiento.
const WORKOUT_MET: Record<WorkoutType, number> = {
  WALKING: 3.5,
  RUNNING: 9.8,
  CYCLING: 7.5,
  STRENGTH: 5,
  HIIT: 8,
  SWIMMING: 7,
  SPORTS: 7,
  OTHER: 5,
};

// Energía extra diaria por estado fisiológico (kcal/día).
const PHYSIOLOGICAL_EXTRA: Record<PhysiologicalState, number> = {
  NONE: 0,
  PREGNANT_T1: 0,
  PREGNANT_T2: 340,
  PREGNANT_T3: 452,
  LACTATING: 330,
};

const THYROID_BMR_FACTOR: Record<ThyroidCondition, number> = {
  NONE: 1,
  HYPOTHYROID: 0.95,
  HYPERTHYROID: 1.05,
};

const PROTEIN_PER_KG: Record<Exclude<MacroPreset, "CUSTOM">, number> = {
  BALANCED: 1.6,
  HIGH_PROTEIN: 2.0,
  LOW_CARB: 1.8,
};

const FAT_PER_KG: Record<MacroPreset, number> = {
  BALANCED: 0.9,
  HIGH_PROTEIN: 0.8,
  LOW_CARB: 1.4,
  CUSTOM: 0.9,
};

export const KCAL_PER_KG = 7700;
export const DEFAULT_DEFICIT_PCT = 20;
export const DEFAULT_SURPLUS_PCT = 10;
const MIN_CALORIES: Record<Sex, number> = { MALE: 1500, FEMALE: 1200 };
const BASELINE_STEPS = 3000;
const KCAL_PER_STEP_PER_KG = 0.00057;
const WATER_ML_PER_KG = 35;
const ADAPTIVE_CLAMP = 0.25;

export interface CalorieInput {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  bodyType: BodyType;
  activityLevel: ActivityLevel;
  goal?: Goal;

  bodyFatPct?: number | null;
  neckCm?: number | null;
  waistCm?: number | null;
  hipCm?: number | null;

  bmrFormula?: BmrFormula;
  useBodyTypeAdjustment?: boolean;

  adjustmentPct?: number | null;
  weeklyRateKg?: number | null;
  targetWeightKg?: number | null;

  activityMode?: ActivityMode;
  jobActivity?: JobActivity;
  dailySteps?: number | null;
  workoutsPerWeek?: number | null;
  workoutMinutes?: number | null;
  workoutType?: WorkoutType;

  physiologicalState?: PhysiologicalState;
  thyroidCondition?: ThyroidCondition;

  macroPreset?: MacroPreset;
  proteinPerKg?: number | null;

  sleepHours?: number | null;
  stressLevel?: "LOW" | "MODERATE" | "HIGH" | null;
  climate?: Climate;

  // TDEE observado a partir del peso real y la ingesta (ver adaptive.ts).
  observedTdee?: number | null;
}

export interface MacroTargets {
  proteinG: number;
  fatG: number;
  carbsG: number;
}

export interface CalorieTargets {
  bmr: number;
  tdee: number;
  maintenanceCalories: number;
  deficitCalories: number;
  surplusCalories: number;
  goalCalories: number;
  bmrFormulaUsed: Exclude<BmrFormula, "AUTO">;
  bodyFatPct: number | null;
  bodyFatSource: "manual" | "estimated" | null;
  leanMassKg: number | null;
  maintenanceSource: "formula" | "adaptive";
  exerciseKcal: number;
  stepsKcal: number;
  extraKcal: number;
  macros: MacroTargets;
  tefKcal: number;
  waterMl: number;
  weeklyChangeKg: number;
  weeksToTarget: number | null;
  warnings: string[];
  notes: string[];
}

export function estimateBodyFatNavy(input: {
  sex: Sex;
  heightCm: number;
  neckCm?: number | null;
  waistCm?: number | null;
  hipCm?: number | null;
}): number | null {
  const { sex, heightCm, neckCm, waistCm, hipCm } = input;
  if (!neckCm || !waistCm || !heightCm) return null;

  let pct: number;
  if (sex === "MALE") {
    if (waistCm <= neckCm) return null;
    pct =
      86.01 * Math.log10(waistCm - neckCm) - 70.041 * Math.log10(heightCm) + 36.76;
  } else {
    if (!hipCm || waistCm + hipCm <= neckCm) return null;
    pct =
      163.205 * Math.log10(waistCm + hipCm - neckCm) -
      97.684 * Math.log10(heightCm) -
      78.387;
  }
  if (!Number.isFinite(pct)) return null;
  return Math.round(Math.min(60, Math.max(3, pct)) * 10) / 10;
}

export function resolveBodyFat(input: CalorieInput): {
  pct: number | null;
  source: "manual" | "estimated" | null;
} {
  if (input.bodyFatPct != null && input.bodyFatPct > 0) {
    return { pct: input.bodyFatPct, source: "manual" };
  }
  const estimated = estimateBodyFatNavy(input);
  return estimated != null
    ? { pct: estimated, source: "estimated" }
    : { pct: null, source: null };
}

function computeBmr(
  input: CalorieInput,
  bodyFatPct: number | null
): { bmr: number; used: Exclude<BmrFormula, "AUTO">; fallback: boolean } {
  const { sex, age, heightCm, weightKg } = input;
  const requested = input.bmrFormula ?? "AUTO";

  const mifflin = () =>
    sex === "MALE"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  const harris = () =>
    sex === "MALE"
      ? 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age
      : 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * age;
  const katch = (pct: number) => 370 + 21.6 * weightKg * (1 - pct / 100);

  if (requested === "KATCH_MCARDLE" || requested === "AUTO") {
    if (bodyFatPct != null) {
      return { bmr: katch(bodyFatPct), used: "KATCH_MCARDLE", fallback: false };
    }
    return {
      bmr: mifflin(),
      used: "MIFFLIN",
      fallback: requested === "KATCH_MCARDLE",
    };
  }
  if (requested === "HARRIS_BENEDICT") {
    return { bmr: harris(), used: "HARRIS_BENEDICT", fallback: false };
  }
  return { bmr: mifflin(), used: "MIFFLIN", fallback: false };
}

export function calculateCalorieTargets(input: CalorieInput): CalorieTargets {
  const { sex, weightKg, activityLevel, bodyType } = input;
  const warnings: string[] = [];
  const notes: string[] = [];

  const bodyFat = resolveBodyFat(input);
  const { bmr: rawBmr, used, fallback } = computeBmr(input, bodyFat.pct);
  if (fallback) {
    warnings.push(
      "Katch-McArdle requiere % de grasa (o medidas de cuello y cintura); se usó Mifflin-St Jeor."
    );
  }

  const thyroid = input.thyroidCondition ?? "NONE";
  const bmr = rawBmr * THYROID_BMR_FACTOR[thyroid];
  if (thyroid !== "NONE") {
    notes.push(
      "El ajuste por tiroides es una aproximación (±5 % del BMR). Consulta a tu médico."
    );
  }

  // --- Gasto energético total ---
  let tdee: number;
  let stepsKcal = 0;
  let exerciseKcal = 0;
  if (input.activityMode === "DETAILED") {
    const job = JOB_MULTIPLIER[input.jobActivity ?? "SEDENTARY"];
    const steps = Math.min(input.dailySteps ?? 0, 30000);
    stepsKcal =
      Math.max(0, steps - BASELINE_STEPS) * KCAL_PER_STEP_PER_KG * weightKg;
    const sessions = input.workoutsPerWeek ?? 0;
    const minutes = input.workoutMinutes ?? 0;
    const met = WORKOUT_MET[input.workoutType ?? "STRENGTH"];
    // Se resta 1 MET (reposo) para no duplicar el BMR.
    exerciseKcal =
      ((sessions * minutes) / 7) * ((met - 1) * 3.5 * weightKg) / 200;
    tdee = bmr * job + stepsKcal + exerciseKcal;
  } else {
    tdee = bmr * ACTIVITY_MULTIPLIER[activityLevel];
  }

  // --- Mantenimiento ---
  const useBodyType = input.useBodyTypeAdjustment ?? true;
  const state = input.physiologicalState ?? "NONE";
  const extraKcal = sex === "FEMALE" ? PHYSIOLOGICAL_EXTRA[state] : 0;
  const pregnantOrLactating = sex === "FEMALE" && state !== "NONE";

  const formulaMaintenance =
    tdee * (useBodyType ? BODY_TYPE_ADJUSTMENT[bodyType] : 1) + extraKcal;

  let maintenance = formulaMaintenance;
  let maintenanceSource: "formula" | "adaptive" = "formula";
  if (input.observedTdee != null && Number.isFinite(input.observedTdee)) {
    maintenance = Math.min(
      formulaMaintenance * (1 + ADAPTIVE_CLAMP),
      Math.max(formulaMaintenance * (1 - ADAPTIVE_CLAMP), input.observedTdee)
    );
    maintenanceSource = "adaptive";
  }

  // --- Déficit / superávit ---
  const rate = input.weeklyRateKg != null && input.weeklyRateKg > 0 ? input.weeklyRateKg : null;
  const dailyRateKcal = rate != null ? (rate * KCAL_PER_KG) / 7 : null;
  const pct = input.adjustmentPct != null && input.adjustmentPct > 0 ? input.adjustmentPct : null;

  let deficit =
    dailyRateKcal != null
      ? maintenance - dailyRateKcal
      : maintenance * (1 - (pct ?? DEFAULT_DEFICIT_PCT) / 100);
  const surplus =
    dailyRateKcal != null
      ? maintenance + dailyRateKcal
      : maintenance * (1 + (pct ?? DEFAULT_SURPLUS_PCT) / 100);

  const goal = input.goal ?? "MAINTENANCE";
  const floor = Math.min(MIN_CALORIES[sex], maintenance);
  if (pregnantOrLactating) {
    deficit = maintenance;
    if (goal === "DEFICIT") {
      warnings.push(
        "No se recomienda un déficit calórico durante el embarazo o la lactancia; se usa la meta de mantenimiento."
      );
    }
  } else if (deficit < floor) {
    deficit = floor;
    if (goal === "DEFICIT") {
      warnings.push(
        `El déficit se limitó a ${Math.round(floor)} kcal, el mínimo recomendado sin supervisión médica.`
      );
    }
  }
  if (goal === "DEFICIT" && !pregnantOrLactating && deficit < bmr) {
    warnings.push(
      "La meta queda por debajo de tu metabolismo basal; evita sostenerla por mucho tiempo."
    );
  }

  const goalCalories =
    goal === "DEFICIT" ? deficit : goal === "SURPLUS" ? surplus : maintenance;

  // --- Progreso estimado ---
  const weeklyChangeKg = ((goalCalories - maintenance) * 7) / KCAL_PER_KG;
  let weeksToTarget: number | null = null;
  if (input.targetWeightKg != null && input.targetWeightKg > 0) {
    const delta = input.targetWeightKg - weightKg;
    if (Math.abs(delta) < 0.05) {
      weeksToTarget = 0;
    } else if (weeklyChangeKg !== 0 && Math.sign(delta) === Math.sign(weeklyChangeKg)) {
      weeksToTarget = Math.abs(delta / weeklyChangeKg);
    } else {
      warnings.push(
        "Tu peso objetivo no coincide con la meta elegida (déficit, mantenimiento o superávit)."
      );
    }
  }

  // --- Macronutrientes ---
  const preset = input.macroPreset ?? "BALANCED";
  const proteinPerKg =
    preset === "CUSTOM"
      ? input.proteinPerKg && input.proteinPerKg > 0
        ? input.proteinPerKg
        : PROTEIN_PER_KG.BALANCED
      : PROTEIN_PER_KG[preset];
  const proteinG = proteinPerKg * weightKg;
  const fatG = FAT_PER_KG[preset] * weightKg;
  let carbsG = (goalCalories - proteinG * 4 - fatG * 9) / 4;
  if (carbsG < 0) {
    carbsG = 0;
    warnings.push(
      "Con esta meta calórica la proteína y la grasa objetivo superan las calorías; reduce la proteína por kg."
    );
  }
  const tefKcal = proteinG * 4 * 0.25 + carbsG * 4 * 0.07 + fatG * 9 * 0.02;

  // --- Hidratación ---
  const exerciseHoursPerDay =
    ((input.workoutsPerWeek ?? 0) * (input.workoutMinutes ?? 0)) / 7 / 60;
  let water =
    weightKg * WATER_ML_PER_KG +
    exerciseHoursPerDay * 500 +
    (input.climate === "HOT" ? 500 : 0);
  if (sex === "FEMALE") {
    if (state === "LACTATING") water += 700;
    else if (state !== "NONE") water += 300;
  }

  // --- Estilo de vida ---
  if (input.sleepHours != null && input.sleepHours > 0 && input.sleepHours < 6) {
    notes.push(
      "Dormir menos de 6 h aumenta el hambre y reduce la pérdida de grasa; intenta acercarte a 7-9 h."
    );
  }
  if (input.stressLevel === "HIGH") {
    notes.push(
      "El estrés alto suele aumentar el apetito emocional; considera pausas activas y vigila los picoteos."
    );
  }

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    maintenanceCalories: Math.round(maintenance),
    deficitCalories: Math.round(deficit),
    surplusCalories: Math.round(surplus),
    goalCalories: Math.round(goalCalories),
    bmrFormulaUsed: used,
    bodyFatPct: bodyFat.pct,
    bodyFatSource: bodyFat.source,
    leanMassKg:
      bodyFat.pct != null
        ? Math.round(weightKg * (1 - bodyFat.pct / 100) * 10) / 10
        : null,
    maintenanceSource,
    exerciseKcal: Math.round(exerciseKcal),
    stepsKcal: Math.round(stepsKcal),
    extraKcal,
    macros: {
      proteinG: Math.round(proteinG),
      fatG: Math.round(fatG),
      carbsG: Math.round(carbsG),
    },
    tefKcal: Math.round(tefKcal),
    waterMl: Math.round(water / 50) * 50,
    weeklyChangeKg: Math.round(weeklyChangeKg * 100) / 100,
    weeksToTarget: weeksToTarget != null ? Math.round(weeksToTarget * 10) / 10 : null,
    warnings,
    notes,
  };
}

export function targetForGoal(targets: CalorieTargets, goal: Goal): number {
  if (goal === "DEFICIT") return targets.deficitCalories;
  if (goal === "SURPLUS") return targets.surplusCalories;
  return targets.maintenanceCalories;
}
