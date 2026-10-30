import type {
  ActivityLevel,
  ActivityMode,
  BmrFormula,
  BodyType,
  Climate,
  FoodType,
  Goal,
  JobActivity,
  MacroPreset,
  MealSlot,
  PhysiologicalState,
  Sex,
  ServingUnit,
  StressLevel,
  ThyroidCondition,
  WorkoutType,
} from "@/generated/prisma/client";

export const SEX_LABELS: Record<Sex, string> = {
  MALE: "Masculino",
  FEMALE: "Femenino",
};

export const BODY_TYPE_LABELS: Record<BodyType, string> = {
  ECTOMORPH: "Ectomorfo",
  MESOMORPH: "Mesomorfo",
  ENDOMORPH: "Endomorfo",
};

export const ACTIVITY_LEVEL_LABELS: Record<ActivityLevel, string> = {
  SEDENTARY: "Sedentario (poco o ningún ejercicio)",
  LIGHT: "Ligero (ejercicio 1-3 días/semana)",
  MODERATE: "Moderado (ejercicio 3-5 días/semana)",
  ACTIVE: "Activo (ejercicio 6-7 días/semana)",
  VERY_ACTIVE: "Muy activo (ejercicio intenso a diario)",
};

export const GOAL_LABELS: Record<Goal, string> = {
  MAINTENANCE: "Mantenimiento",
  DEFICIT: "Déficit (reducción de grasa)",
  SURPLUS: "Superávit (aumento de masa)",
};

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  BREAKFAST: "Desayuno",
  LUNCH: "Almuerzo",
  DINNER: "Cena",
  SNACK: "Merienda",
  EXTRA: "Adicional",
};

export const MEAL_SLOT_ORDER: MealSlot[] = [
  "BREAKFAST",
  "LUNCH",
  "DINNER",
  "SNACK",
  "EXTRA",
];

export const SERVING_UNIT_LABELS: Record<ServingUnit, string> = {
  GRAMS_100: "por 100 g",
  UNIT: "por unidad",
};

export const FOOD_TYPE_LABELS: Record<FoodType, string> = {
  CARBOHIDRATOS: "Carbohidratos",
  GRASAS: "Grasas",
  PROTEINAS: "Proteínas",
};

export const BMR_FORMULA_LABELS: Record<BmrFormula, string> = {
  AUTO: "Automática (Katch-McArdle si hay % de grasa)",
  MIFFLIN: "Mifflin-St Jeor",
  HARRIS_BENEDICT: "Harris-Benedict revisada",
  KATCH_MCARDLE: "Katch-McArdle (requiere % de grasa)",
};

export const ACTIVITY_MODE_LABELS: Record<ActivityMode, string> = {
  SIMPLE: "Simple (nivel de actividad)",
  DETAILED: "Detallada (pasos y entrenamientos)",
};

export const JOB_ACTIVITY_LABELS: Record<JobActivity, string> = {
  SEDENTARY: "Sedentaria (escritorio, poco movimiento)",
  LIGHT: "Ligera (de pie o caminando a ratos)",
  MODERATE: "Moderada (de pie casi todo el día)",
  HEAVY: "Pesada (trabajo físico)",
};

export const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  WALKING: "Caminata",
  RUNNING: "Correr",
  CYCLING: "Ciclismo",
  STRENGTH: "Pesas / fuerza",
  HIIT: "HIIT / funcional",
  SWIMMING: "Natación",
  SPORTS: "Deportes de equipo",
  OTHER: "Otro",
};

export const PHYSIOLOGICAL_STATE_LABELS: Record<PhysiologicalState, string> = {
  NONE: "Ninguno",
  PREGNANT_T1: "Embarazo, 1.er trimestre",
  PREGNANT_T2: "Embarazo, 2.º trimestre",
  PREGNANT_T3: "Embarazo, 3.er trimestre",
  LACTATING: "Lactancia",
};

export const THYROID_LABELS: Record<ThyroidCondition, string> = {
  NONE: "Ninguna",
  HYPOTHYROID: "Hipotiroidismo",
  HYPERTHYROID: "Hipertiroidismo",
};

export const MACRO_PRESET_LABELS: Record<MacroPreset, string> = {
  BALANCED: "Balanceada (1.6 g proteína/kg)",
  HIGH_PROTEIN: "Alta en proteína (2.0 g/kg)",
  LOW_CARB: "Baja en carbohidratos (1.8 g/kg, más grasa)",
  CUSTOM: "Personalizada",
};

export const CLIMATE_LABELS: Record<Climate, string> = {
  TEMPERATE: "Templado",
  HOT: "Caluroso",
  COLD: "Frío",
};

export const STRESS_LABELS: Record<StressLevel, string> = {
  LOW: "Bajo",
  MODERATE: "Moderado",
  HIGH: "Alto",
};

// Explicaciones breves de cada método de cálculo, para mostrarlas junto a los selectores.
export const BMR_FORMULA_DESCRIPTIONS: Record<BmrFormula, string> = {
  AUTO: "Elige por ti: usa Katch-McArdle si hay % de grasa (ingresado o estimado con cuello y cintura) y, si no, Mifflin-St Jeor.",
  MIFFLIN:
    "Estima las calorías que gastas en reposo a partir de tu peso, altura, edad y sexo. Es la más usada y precisa para la población general, y no necesita % de grasa.",
  HARRIS_BENEDICT:
    "Usa los mismos datos (peso, altura, edad y sexo) con coeficientes revisados en 1984. Es más antigua y suele dar valores algo más altos que Mifflin-St Jeor.",
  KATCH_MCARDLE:
    "Parte de tu masa magra (el peso sin grasa), por eso es la más precisa si conoces tu % de grasa, sobre todo si entrenas fuerza. Sin ese dato se usa Mifflin-St Jeor.",
};

export const ACTIVITY_MODE_DESCRIPTIONS: Record<ActivityMode, string> = {
  SIMPLE:
    "Multiplica tu metabolismo basal por un factor según cuántos días entrenas por semana (de 1,2 a 1,9). Es rápido, pero aproximado.",
  DETAILED:
    "Suma por separado tu actividad diaria, los pasos por encima de 3 000 y las calorías de tus entrenamientos según tipo, duración y frecuencia. Más preciso si conoces esos datos.",
};

export const MACRO_PRESET_DESCRIPTIONS: Record<MacroPreset, string> = {
  BALANCED: "Fija la proteína en 1,6 g y la grasa en 0,9 g por kg de peso; el resto de las calorías van a carbohidratos.",
  HIGH_PROTEIN: "Fija la proteína en 2,0 g y la grasa en 0,8 g por kg; útil para ganar o conservar masa muscular.",
  LOW_CARB: "Fija la proteína en 1,8 g y sube la grasa a 1,4 g por kg, dejando menos calorías para carbohidratos.",
  CUSTOM: "Tú eliges los gramos de proteína por kg; la grasa se mantiene en 0,9 g por kg y el resto son carbohidratos.",
};
