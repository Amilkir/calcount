import type { Profile } from "@/generated/prisma/client";
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
  StressLevel,
  ThyroidCondition,
  WorkoutType,
} from "@/generated/prisma/enums";

export interface ProfileFormValues {
  name: string;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  bodyType: BodyType;
  activityLevel: ActivityLevel;
  goal: Goal;

  bodyFatPct: number | null;
  neckCm: number | null;
  waistCm: number | null;
  hipCm: number | null;

  bmrFormula: BmrFormula;
  useBodyTypeAdjustment: boolean;

  adjustmentPct: number | null;
  weeklyRateKg: number | null;
  targetWeightKg: number | null;

  activityMode: ActivityMode;
  jobActivity: JobActivity;
  dailySteps: number | null;
  workoutsPerWeek: number | null;
  workoutMinutes: number | null;
  workoutType: WorkoutType;

  physiologicalState: PhysiologicalState;
  thyroidCondition: ThyroidCondition;

  macroPreset: MacroPreset;
  proteinPerKg: number | null;

  sleepHours: number | null;
  stressLevel: StressLevel | null;
  climate: Climate;

  adaptiveTdee: boolean;
}

export const DEFAULT_PROFILE_VALUES: ProfileFormValues = {
  name: "",
  sex: "MALE",
  age: 30,
  heightCm: 170,
  weightKg: 70,
  bodyType: "MESOMORPH",
  activityLevel: "MODERATE",
  goal: "DEFICIT",

  bodyFatPct: null,
  neckCm: null,
  waistCm: null,
  hipCm: null,

  bmrFormula: "AUTO",
  useBodyTypeAdjustment: false,

  adjustmentPct: null,
  weeklyRateKg: null,
  targetWeightKg: null,

  activityMode: "SIMPLE",
  jobActivity: "SEDENTARY",
  dailySteps: null,
  workoutsPerWeek: null,
  workoutMinutes: null,
  workoutType: "STRENGTH",

  physiologicalState: "NONE",
  thyroidCondition: "NONE",

  macroPreset: "BALANCED",
  proteinPerKg: null,

  sleepHours: null,
  stressLevel: null,
  climate: "TEMPERATE",

  adaptiveTdee: false,
};

export function profileToFormValues(profile: Profile): ProfileFormValues {
  const values = { ...DEFAULT_PROFILE_VALUES };
  for (const key of Object.keys(values) as (keyof ProfileFormValues)[]) {
    (values as Record<string, unknown>)[key] = profile[key as keyof Profile];
  }
  return values;
}
