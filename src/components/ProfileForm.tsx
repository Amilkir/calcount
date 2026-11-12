"use client";

import { AlertIcon, CheckIcon, CloseIcon } from "./icons";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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
import {
  ACTIVITY_LEVEL_LABELS,
  ACTIVITY_MODE_DESCRIPTIONS,
  ACTIVITY_MODE_LABELS,
  BMR_FORMULA_DESCRIPTIONS,
  BMR_FORMULA_LABELS,
  BODY_TYPE_LABELS,
  CLIMATE_LABELS,
  GOAL_LABELS,
  JOB_ACTIVITY_LABELS,
  MACRO_PRESET_DESCRIPTIONS,
  MACRO_PRESET_LABELS,
  PHYSIOLOGICAL_STATE_LABELS,
  SEX_LABELS,
  STRESS_LABELS,
  THYROID_LABELS,
  WORKOUT_TYPE_LABELS,
} from "@/lib/labels";
import { calculateCalorieTargets, targetForGoal } from "@/lib/calories";
import { SUPPLEMENTS, SUPPLEMENT_LABELS, type Supplement } from "@/lib/supplements";
import SportIcon from "./SportIcon";
import {
  DEFAULT_SPORT_MINUTES,
  MAX_SPORTS,
  MAX_SPORT_MINUTES,
  SPORTS,
  SPORT_LABELS,
  sportCreditKcal,
  type Sport,
  type SportPlan,
} from "@/lib/sports";

/** Fila de deporte del formulario; "" es una fila nueva sin deporte elegido todavía. */
type SportRow = Omit<SportPlan, "sport"> & { sport: Sport | "" };

const newSportRow = (): SportRow => ({ sport: "", minutes: DEFAULT_SPORT_MINUTES, perWeek: 1 });
import {
  DEFAULT_PROFILE_VALUES,
  type ProfileFormValues,
} from "@/lib/profile-form";

export type { ProfileFormValues };

const INPUT_CLASS = "rounded-lg border border-neutral-300 px-3 py-2";

function Field({
  label,
  hint,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      {children}
      {hint && <span className="text-xs text-neutral-500">{hint}</span>}
    </label>
  );
}

function NumberField({
  label,
  hint,
  value,
  onChange,
  optional = false,
  ...inputProps
}: {
  label: string;
  hint?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  optional?: boolean;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}) {
  return (
    <Field label={optional ? `${label} (opcional)` : label} hint={hint}>
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === "" ? null : Number(raw));
        }}
        className={INPUT_CLASS}
        required={!optional}
        {...inputProps}
      />
    </Field>
  );
}

function SelectField<T extends string>({
  label,
  hint,
  value,
  onChange,
  options,
  labels,
  className,
}: {
  label: string;
  hint?: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly T[];
  labels: Record<T, string>;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={INPUT_CLASS}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {labels[o]}
          </option>
        ))}
      </select>
    </Field>
  );
}

function CheckboxField({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2 sm:col-span-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4"
      />
      <span className="flex flex-col">
        <span className="text-sm font-medium text-neutral-700">{label}</span>
        {hint && <span className="text-xs text-neutral-500">{hint}</span>}
      </span>
    </label>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-base font-semibold text-neutral-900">{title}</legend>
      {description && <p className="-mt-1 text-xs text-neutral-500">{description}</p>}
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export default function ProfileForm({
  mode,
  profileId,
  initialValues,
}: {
  mode: "create" | "edit";
  profileId?: string;
  initialValues?: ProfileFormValues;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ProfileFormValues>(
    initialValues ?? DEFAULT_PROFILE_VALUES
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [takesSupplements, setTakesSupplements] = useState(
    () => (initialValues?.supplements.length ?? 0) > 0
  );
  // Filas del formulario; "" es una fila nueva sin suplemento elegido todavía.
  const [supplementRows, setSupplementRowsState] = useState<(Supplement | "")[]>(
    () => initialValues?.supplements ?? []
  );
  const pendingSupplement = supplementRows.includes("");

  function setSupplementRows(rows: (Supplement | "")[]) {
    setSupplementRowsState(rows);
    update(
      "supplements",
      rows.filter((s): s is Supplement => s !== "")
    );
  }

  const [playsSports, setPlaysSports] = useState(() => (initialValues?.sports.length ?? 0) > 0);
  const [sportRows, setSportRowsState] = useState<SportRow[]>(() => initialValues?.sports ?? []);
  const pendingSport = sportRows.some((r) => r.sport === "");

  function setSportRows(rows: SportRow[]) {
    setSportRowsState(rows);
    update(
      "sports",
      rows.filter((r): r is SportPlan => r.sport !== "")
    );
  }

  function updateSport(index: number, change: Partial<SportRow>) {
    setSportRows(sportRows.map((row, i) => (i === index ? { ...row, ...change } : row)));
  }

  const targets = useMemo(() => calculateCalorieTargets(values), [values]);
  const isEdit = mode === "edit";
  const dirty = !isEdit || JSON.stringify(values) !== JSON.stringify(initialValues);
  // Meta del perfil tal como está guardado, para mostrar cuánto cambia con lo que se edita.
  const savedGoal = useMemo(
    () =>
      isEdit && initialValues
        ? targetForGoal(calculateCalorieTargets(initialValues), initialValues.goal)
        : null,
    [isEdit, initialValues]
  );

  function update<K extends keyof ProfileFormValues>(
    key: K,
    value: ProfileFormValues[K]
  ) {
    setSaved(false);
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!values.name.trim()) {
      setError("Ingresa un nombre para el perfil.");
      return;
    }
    if (pendingSupplement) {
      setError("Elige un suplemento en cada fila o quita las que estén vacías.");
      return;
    }
    if (pendingSport) {
      setError("Elige un deporte en cada fila o quita las que estén vacías.");
      return;
    }
    if (
      sportRows.some(
        (s) =>
          !Number.isInteger(s.minutes) ||
          s.minutes < 1 ||
          s.minutes > MAX_SPORT_MINUTES ||
          !Number.isInteger(s.perWeek) ||
          s.perWeek < 1 ||
          s.perWeek > 14
      )
    ) {
      setError("Indica los minutos y las veces por semana de cada deporte.");
      return;
    }

    const payload: ProfileFormValues = {
      ...values,
      physiologicalState: values.sex === "FEMALE" ? values.physiologicalState : "NONE",
      hipCm: values.sex === "FEMALE" ? values.hipCm : null,
    };

    setSubmitting(true);
    try {
      const url = mode === "create" ? "/api/profiles" : `/api/profiles/${profileId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { ...payload, changeNote: note } : payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Ocurrió un error al guardar el perfil.");
        setSubmitting(false);
        return;
      }
      const result = await res.json();
      if (isEdit) {
        setNote("");
        setSaved(true);
        setSubmitting(false);
        router.refresh();
        return;
      }
      router.push(`/profiles/${result.id}`);
      router.refresh();
    } catch {
      setError("Ocurrió un error al guardar el perfil.");
      setSubmitting(false);
    }
  }

  const isFemale = values.sex === "FEMALE";
  const hasGoalAdjustment = values.goal !== "MAINTENANCE";
  const goalCalories = targetForGoal(targets, values.goal);
  const bodyFatNeedsMore = values.bodyFatPct == null && targets.bodyFatPct == null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <Section title="Datos básicos">
        <Field label="Nombre" className="sm:col-span-2">
          <input
            type="text"
            value={values.name}
            onChange={(e) => update("name", e.target.value)}
            className={INPUT_CLASS}
            placeholder="Ej. María"
            required
          />
        </Field>

        <SelectField
          label="Sexo"
          value={values.sex}
          onChange={(v) => update("sex", v)}
          options={Object.values(Sex)}
          labels={SEX_LABELS}
        />

        <NumberField
          label="Edad (años)"
          value={values.age}
          onChange={(v) => update("age", v ?? 0)}
          min={1}
          max={120}
        />
        <NumberField
          label="Altura (cm)"
          value={values.heightCm}
          onChange={(v) => update("heightCm", v ?? 0)}
          min={50}
          max={250}
        />
        <NumberField
          label="Peso (kg)"
          value={values.weightKg}
          onChange={(v) => update("weightKg", v ?? 0)}
          min={20}
          max={400}
          step={0.1}
        />
      </Section>

      <Section
        title="Composición corporal"
        description="Todo es opcional. Si no tienes cómo medir el % de grasa, déjalo vacío: se usará la fórmula estándar. Con cuello y cintura (y cadera en mujeres) se puede estimar con una cinta métrica."
      >
        <NumberField
          label="% de grasa corporal"
          value={values.bodyFatPct}
          onChange={(v) => update("bodyFatPct", v)}
          optional
          min={3}
          max={60}
          step={0.1}
          placeholder="Ej. 22"
          hint="Si lo ingresas, tiene prioridad sobre la estimación por medidas."
        />
        <NumberField
          label="Cuello (cm)"
          value={values.neckCm}
          onChange={(v) => update("neckCm", v)}
          optional
          min={10}
          max={80}
          step={0.1}
        />
        <NumberField
          label="Cintura (cm)"
          value={values.waistCm}
          onChange={(v) => update("waistCm", v)}
          optional
          min={30}
          max={250}
          step={0.1}
          hint="Mídela a la altura del ombligo."
        />
        {isFemale && (
          <NumberField
            label="Cadera (cm)"
            value={values.hipCm}
            onChange={(v) => update("hipCm", v)}
            optional
            min={30}
            max={250}
            step={0.1}
          />
        )}
        <p className="text-sm text-neutral-600 sm:col-span-2">
          {targets.bodyFatPct != null ? (
            <>
              % de grasa usado:{" "}
              <span className="font-semibold">{targets.bodyFatPct} %</span>{" "}
              ({targets.bodyFatSource === "manual" ? "ingresado" : "estimado por medidas"})
              {targets.leanMassKg != null && <> · masa magra: {targets.leanMassKg} kg</>}
            </>
          ) : (
            bodyFatNeedsMore && "Sin % de grasa: se usará Mifflin-St Jeor."
          )}
        </p>
      </Section>

      <Section title="Actividad">
        <SelectField
          label="Cómo medir tu actividad"
          value={values.activityMode}
          onChange={(v) => update("activityMode", v)}
          options={Object.values(ActivityMode)}
          labels={ACTIVITY_MODE_LABELS}
          hint={ACTIVITY_MODE_DESCRIPTIONS[values.activityMode]}
          className="sm:col-span-2"
        />
        {values.activityMode === "SIMPLE" ? (
          <SelectField
            label="Nivel de actividad"
            value={values.activityLevel}
            onChange={(v) => update("activityLevel", v)}
            options={Object.values(ActivityLevel)}
            labels={ACTIVITY_LEVEL_LABELS}
            className="sm:col-span-2"
          />
        ) : (
          <>
            <SelectField
              label="Actividad diaria (fuera del ejercicio)"
              value={values.jobActivity}
              onChange={(v) => update("jobActivity", v)}
              options={Object.values(JobActivity)}
              labels={JOB_ACTIVITY_LABELS}
              className="sm:col-span-2"
            />
            <NumberField
              label="Pasos diarios"
              value={values.dailySteps}
              onChange={(v) => update("dailySteps", v)}
              optional
              min={0}
              max={60000}
              step={500}
              hint="Se cuentan los pasos por encima de 3 000."
            />
            <SelectField
              label="Tipo de entrenamiento"
              value={values.workoutType}
              onChange={(v) => update("workoutType", v)}
              options={Object.values(WorkoutType)}
              labels={WORKOUT_TYPE_LABELS}
            />
            <NumberField
              label="Entrenamientos por semana"
              value={values.workoutsPerWeek}
              onChange={(v) => update("workoutsPerWeek", v)}
              optional
              min={0}
              max={14}
            />
            <NumberField
              label="Minutos por sesión"
              value={values.workoutMinutes}
              onChange={(v) => update("workoutMinutes", v)}
              optional
              min={0}
              max={300}
              step={5}
            />
          </>
        )}
      </Section>

      <Section
        title="Deportes"
        description="Deportes intensos que practicas aparte de tu entrenamiento regular. No se suman a tu meta base: en «Hoy» marcas si jugaste y ese día se suma lo que gastaste."
      >
        <CheckboxField
          label="Practico algún deporte (fútbol, pádel, running…)"
          checked={playsSports}
          onChange={(checked) => {
            setPlaysSports(checked);
            setSportRows(checked ? [newSportRow()] : []);
          }}
        />
        {playsSports && (
          <div className="flex flex-col gap-2 sm:col-span-2">
            {sportRows.map((row, index) => (
              <div
                key={index}
                className="flex flex-col gap-2 rounded-lg border border-neutral-100 p-2 sm:flex-row sm:items-center sm:border-none sm:p-0"
              >
                <div className="flex items-center gap-2 sm:flex-1">
                  {row.sport ? (
                    <SportIcon sport={row.sport} size={20} />
                  ) : (
                    <span className="h-[34px] w-[34px] shrink-0 rounded-lg border border-dashed border-neutral-300" />
                  )}
                  <select
                    value={row.sport}
                    aria-label={`Deporte ${index + 1}`}
                    onChange={(e) => updateSport(index, { sport: e.target.value as Sport })}
                    className={`${INPUT_CLASS} min-w-0 flex-1 ${row.sport === "" ? "text-neutral-500" : ""}`}
                    required
                  >
                    <option value="" disabled>
                      Seleccione…
                    </option>
                    {SPORTS.filter(
                      (s) => s === row.sport || !sportRows.some((r) => r.sport === s)
                    ).map((s) => (
                      <option key={s} value={s}>
                        {SPORT_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-sm text-neutral-600">
                    <input
                      type="number"
                      min={1}
                      max={MAX_SPORT_MINUTES}
                      step={1}
                      value={row.minutes || ""}
                      onChange={(e) => updateSport(index, { minutes: Number(e.target.value) })}
                      aria-label={`Minutos por sesión del deporte ${index + 1}`}
                      className={`${INPUT_CLASS} w-20`}
                      required
                    />
                    min
                  </label>
                  <label className="flex items-center gap-1 text-sm text-neutral-600">
                    <input
                      type="number"
                      min={1}
                      max={14}
                      step={1}
                      value={row.perWeek || ""}
                      onChange={(e) => updateSport(index, { perWeek: Number(e.target.value) })}
                      aria-label={`Veces por semana del deporte ${index + 1}`}
                      className={`${INPUT_CLASS} w-16`}
                      required
                    />
                    ×/sem
                  </label>
                  <span className="ml-auto whitespace-nowrap text-xs text-neutral-500 sm:w-24 sm:text-right">
                    {row.sport !== "" &&
                      row.minutes > 0 &&
                      `+${sportCreditKcal(row.sport, row.minutes, values.weightKg, values.goal)} kcal`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = sportRows.filter((_, i) => i !== index);
                      setSportRows(next);
                      if (next.length === 0) setPlaysSports(false);
                    }}
                    aria-label={`Quitar deporte ${index + 1}`}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-neutral-500 hover:bg-danger-50 hover:text-danger-600"
                  >
                    <CloseIcon />
                  </button>
                </div>
              </div>
            ))}
            <p className="text-xs text-neutral-500">
              Las kcal son lo que se suma a tu meta el día que lo marcas
              {values.goal === "DEFICIT"
                ? " (el 65 % del gasto estimado, para no comerte el déficit)"
                : values.goal === "MAINTENANCE"
                  ? " (el 95 % del gasto estimado)"
                  : ""}
              .
            </p>
            {pendingSport && (
              <p className="text-xs text-sun-700">
                Elige un deporte en cada fila (o quítala) para poder guardar.
              </p>
            )}
            {sportRows.length < MAX_SPORTS && (
              <button
                type="button"
                onClick={() => setSportRows([...sportRows, newSportRow()])}
                disabled={pendingSport}
                className="btn-secondary self-start"
              >
                + Añadir deporte
              </button>
            )}
          </div>
        )}
      </Section>

      <Section title="Objetivo">
        <SelectField
          label="Meta"
          value={values.goal}
          onChange={(v) => {
            update("goal", v);
            update("adjustmentPct", null);
          }}
          options={Object.values(Goal)}
          labels={GOAL_LABELS}
        />
        <NumberField
          label="Peso objetivo (kg)"
          value={values.targetWeightKg}
          onChange={(v) => update("targetWeightKg", v)}
          optional
          min={20}
          max={400}
          step={0.1}
        />
        {hasGoalAdjustment && (
          <>
            <NumberField
              label={values.goal === "DEFICIT" ? "Déficit (%)" : "Superávit (%)"}
              value={values.adjustmentPct}
              onChange={(v) => update("adjustmentPct", v)}
              optional
              min={1}
              max={50}
              placeholder={values.goal === "DEFICIT" ? "20" : "10"}
              hint="Si lo dejas vacío se usa el valor por defecto."
            />
            <NumberField
              label="Ritmo semanal (kg/semana)"
              value={values.weeklyRateKg}
              onChange={(v) => update("weeklyRateKg", v)}
              optional
              min={0.05}
              max={1.5}
              step={0.05}
              placeholder="Ej. 0.5"
              hint="Si lo indicas, reemplaza al porcentaje."
            />
          </>
        )}
      </Section>

      <Section title="Metabolismo y salud" description="Ajustes avanzados; los valores por defecto funcionan bien para la mayoría.">
        <SelectField
          label="Fórmula de metabolismo basal"
          value={values.bmrFormula}
          onChange={(v) => update("bmrFormula", v)}
          options={Object.values(BmrFormula)}
          labels={BMR_FORMULA_LABELS}
          hint={BMR_FORMULA_DESCRIPTIONS[values.bmrFormula]}
          className="sm:col-span-2"
        />
        {isFemale && (
          <SelectField
            label="Embarazo / lactancia"
            value={values.physiologicalState}
            onChange={(v) => update("physiologicalState", v)}
            options={Object.values(PhysiologicalState)}
            labels={PHYSIOLOGICAL_STATE_LABELS}
          />
        )}
        <SelectField
          label="Condición de tiroides"
          value={values.thyroidCondition}
          onChange={(v) => update("thyroidCondition", v)}
          options={Object.values(ThyroidCondition)}
          labels={THYROID_LABELS}
        />
        <CheckboxField
          label="Aplicar ajuste por tipo de cuerpo (±5 %)"
          hint="Tiene poco respaldo científico; actívalo solo si quieres conservar este ajuste."
          checked={values.useBodyTypeAdjustment}
          onChange={(v) => update("useBodyTypeAdjustment", v)}
        />
        {values.useBodyTypeAdjustment && (
          <SelectField
            label="Tipo de cuerpo"
            value={values.bodyType}
            onChange={(v) => update("bodyType", v)}
            options={Object.values(BodyType)}
            labels={BODY_TYPE_LABELS}
          />
        )}
      </Section>

      <Section title="Macronutrientes e hidratación">
        <SelectField
          label="Distribución de macros"
          value={values.macroPreset}
          onChange={(v) => update("macroPreset", v)}
          options={Object.values(MacroPreset)}
          labels={MACRO_PRESET_LABELS}
          hint={MACRO_PRESET_DESCRIPTIONS[values.macroPreset]}
        />
        {values.macroPreset === "CUSTOM" && (
          <NumberField
            label="Proteína (g por kg)"
            value={values.proteinPerKg}
            onChange={(v) => update("proteinPerKg", v)}
            min={0.8}
            max={3.5}
            step={0.1}
          />
        )}
        <SelectField
          label="Clima"
          value={values.climate}
          onChange={(v) => update("climate", v)}
          options={Object.values(Climate)}
          labels={CLIMATE_LABELS}
        />
      </Section>

      <Section title="Estilo de vida" description="Opcional; solo genera recomendaciones, no cambia las calorías.">
        <NumberField
          label="Horas de sueño por noche"
          value={values.sleepHours}
          onChange={(v) => update("sleepHours", v)}
          optional
          min={0}
          max={24}
          step={0.5}
        />
        <Field label="Nivel de estrés (opcional)">
          <select
            value={values.stressLevel ?? ""}
            onChange={(e) =>
              update("stressLevel", e.target.value === "" ? null : (e.target.value as StressLevel))
            }
            className={INPUT_CLASS}
          >
            <option value="">Sin indicar</option>
            {Object.values(StressLevel).map((s) => (
              <option key={s} value={s}>
                {STRESS_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      <Section
        title="Suplementos"
        description="Los suplementos que agregues aparecerán cada día en el panel para marcar si los tomaste."
      >
        <CheckboxField
          label="Tomo suplementos de forma recurrente"
          checked={takesSupplements}
          onChange={(checked) => {
            setTakesSupplements(checked);
            setSupplementRows(checked ? [""] : []);
          }}
        />
        {takesSupplements && (
          <div className="flex flex-col gap-2 sm:col-span-2">
            {supplementRows.map((supplement, index) => (
              <div key={index} className="flex items-center gap-2">
                <select
                  value={supplement}
                  aria-label={`Suplemento ${index + 1}`}
                  onChange={(e) => {
                    const next = [...supplementRows];
                    next[index] = e.target.value as Supplement;
                    setSupplementRows(next);
                  }}
                  className={`${INPUT_CLASS} flex-1 ${supplement === "" ? "text-neutral-500" : ""}`}
                  required
                >
                  <option value="" disabled>
                    Seleccione…
                  </option>
                  {SUPPLEMENTS.filter(
                    (s) => s === supplement || !supplementRows.includes(s)
                  ).map((s) => (
                    <option key={s} value={s}>
                      {SUPPLEMENT_LABELS[s]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setSupplementRows(supplementRows.filter((_, i) => i !== index))}
                  aria-label={`Quitar suplemento ${index + 1}`}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-neutral-500 hover:bg-danger-50 hover:text-danger-600"
                >
                  <CloseIcon />
                </button>
              </div>
            ))}
            {pendingSupplement && (
              <p className="text-xs text-sun-700">
                Elige un suplemento en cada fila (o quítala) para poder guardar.
              </p>
            )}
            {supplementRows.length < SUPPLEMENTS.length ? (
              <button
                type="button"
                onClick={() => setSupplementRows([...supplementRows, ""])}
                disabled={pendingSupplement}
                className="btn-secondary self-start"
              >
                + Añadir suplemento
              </button>
            ) : (
              <p className="text-xs text-neutral-500">Ya agregaste todos los suplementos disponibles.</p>
            )}
          </div>
        )}
      </Section>

      <Section title="Ajuste dinámico">
        <CheckboxField
          label="Ajustar mi gasto según mi peso real"
          hint="Con registros de peso y comidas de las últimas 4 semanas, la app estima tu gasto real y corrige el mantenimiento (máx. ±25 % respecto a la fórmula). Registra tu peso desde el panel del perfil."
          checked={values.adaptiveTdee}
          onChange={(v) => update("adaptiveTdee", v)}
        />
      </Section>

      <div className="flex flex-col gap-1 rounded-xl bg-lagoon-50 p-4 text-sm text-lagoon-900">
        <p className="font-medium">Calorías calculadas con estos datos:</p>
        <p>
          Metabolismo basal: {targets.bmr} kcal ·{" "}
          {BMR_FORMULA_LABELS[targets.bmrFormulaUsed].split(" (")[0]}
        </p>
        <p>Gasto total (TDEE): {targets.tdee} kcal/día</p>
        <p>Mantenimiento: {targets.maintenanceCalories} kcal/día</p>
        <p>Déficit (pérdida de grasa): {targets.deficitCalories} kcal/día</p>
        <p>Superávit (aumento de masa): {targets.surplusCalories} kcal/día</p>
        <p className="mt-1 font-semibold">
          Meta seleccionada: {goalCalories} kcal/día
          {savedGoal != null && savedGoal !== goalCalories && (
            <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-lagoon-700">
              {goalCalories > savedGoal ? "+" : ""}
              {goalCalories - savedGoal} kcal vs. tu perfil guardado ({savedGoal})
            </span>
          )}
        </p>
        <p>
          Macros objetivo: {targets.macros.proteinG} g proteína · {targets.macros.carbsG} g
          carbohidratos · {targets.macros.fatG} g grasa
        </p>
        <p>Agua recomendada: {(targets.waterMl / 1000).toFixed(2)} L/día</p>
        {targets.weeklyChangeKg !== 0 && (
          <p>
            Cambio estimado: {targets.weeklyChangeKg > 0 ? "+" : ""}
            {targets.weeklyChangeKg} kg/semana
            {targets.weeksToTarget != null &&
              targets.weeksToTarget > 0 &&
              ` · peso objetivo en ~${targets.weeksToTarget} semanas`}
          </p>
        )}
        {targets.warnings.map((w) => (
          <p key={w} className="mt-1 flex items-start gap-1.5 text-sun-800">
            <AlertIcon size={14} className="mt-0.5 shrink-0" />
            {w}
          </p>
        ))}
        {targets.notes.map((n) => (
          <p key={n} className="text-lagoon-700">
            {n}
          </p>
        ))}
      </div>

      {isEdit && (
        <Field
          label="¿Qué cambió y por qué? (opcional)"
          hint="Queda anotado en el historial junto con el efecto en tus calorías. Ej.: «Empecé a entrenar 4 días» o «Duermo peor por trabajo»."
        >
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={2}
            className={INPUT_CLASS}
          />
        </Field>
      )}

      {error && <p className="text-sm text-danger-600">{error}</p>}
      {saved && (
        <p className="flex items-center gap-1.5 text-sm font-semibold text-lagoon-700">
          <CheckIcon className="shrink-0" />
          Cambios guardados. Mira el efecto en la pestaña Historial.
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !dirty || pendingSupplement || pendingSport}
        className="btn-primary self-start"
      >
        {submitting
          ? "Guardando..."
          : mode === "create"
            ? "Crear perfil"
            : dirty
              ? "Guardar cambios"
              : "Sin cambios"}
      </button>
    </form>
  );
}
