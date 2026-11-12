"use client";

import { AlertIcon, CheckIcon, CloseIcon } from "./icons";
import { useMemo, useState } from "react";
import type { Food } from "@/lib/types";
import { suggestPortions, type AutofillOption, type Remaining } from "@/lib/autofill";
import FoodPicker from "./FoodPicker";

const MAX_FOODS = 6;
// Elegir 1 equivale a "usar todo lo que queda", así que el desplegable arranca en 2.
const MEALS_LEFT_OPTIONS = [2, 3, 4, 5];

const MACRO_LABELS = [
  { key: "protein", label: "P" },
  { key: "carbs", label: "C" },
  { key: "fat", label: "G" },
] as const;

function MacroLine({ values, targets }: { values: Remaining; targets?: Remaining }) {
  return (
    <span className="flex flex-wrap gap-x-3 text-xs text-neutral-500">
      {MACRO_LABELS.map(({ key, label }) => (
        <span key={key}>
          {label} {Math.round(values[key])}
          {targets && ` / ${Math.round(Math.max(0, targets[key]))}`} g
        </span>
      ))}
    </span>
  );
}

function OptionCard({
  title,
  description,
  option,
  remaining,
  notice,
  submitting,
  onAdd,
}: {
  title: string;
  description: string;
  option: AutofillOption;
  remaining: Remaining;
  notice: React.ReactNode;
  submitting: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-3">
      <div>
        <p className="text-sm font-semibold text-neutral-800">{title}</p>
        <p className="text-xs text-neutral-500">{description}</p>
      </div>
      {option.items.length === 0 ? (
        <p className="text-sm text-neutral-500">Con estos alimentos no hay una combinación útil.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-neutral-100 text-sm">
          {option.items.map((item) => (
            <li key={item.food.id} className="flex justify-between gap-2 py-1">
              <span className="text-neutral-700">
                {item.food.icon} {item.food.name}
                <span className="font-semibold text-neutral-900">
                  {" "}
                  · {item.quantity} {item.food.servingUnit === "UNIT" ? "u" : "g"}
                </span>
              </span>
              <span className="whitespace-nowrap text-neutral-500">{Math.round(item.calories)} kcal</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-0.5 border-t border-neutral-100 pt-2">
        <span className="text-sm">
          Total: <span className="font-semibold">{Math.round(option.totals.calories)} kcal</span>
          <span className="text-neutral-500"> / {Math.round(remaining.calories)} disponibles</span>
        </span>
        <MacroLine values={option.totals} targets={remaining} />
      </div>
      {notice}
      <button
        type="button"
        onClick={onAdd}
        disabled={submitting || option.items.length === 0}
        className="btn-secondary"
      >
        {submitting ? "Agregando..." : "Agregar esta opción"}
      </button>
    </div>
  );
}

export default function AutofillPanel({
  foods,
  remaining,
  onSubmit,
}: {
  foods: Food[];
  remaining: Remaining;
  onSubmit: (items: { foodId: string; quantity: number }[]) => Promise<void>;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  // Comidas que quedan en el día (incluida esta). null = usar todo lo que queda.
  const [mealsLeft, setMealsLeft] = useState<number | null>(null);

  const selectedFoods = useMemo(
    () =>
      selectedIds
        .map((id) => foods.find((f) => f.id === id))
        .filter((f): f is Food => f != null),
    [foods, selectedIds]
  );
  // Lo que queda del día sin macros negativos (si ya te pasaste de uno, no cuenta como faltante).
  const dayRemaining = useMemo<Remaining>(
    () => ({
      calories: remaining.calories,
      protein: Math.max(0, remaining.protein),
      carbs: Math.max(0, remaining.carbs),
      fat: Math.max(0, remaining.fat),
    }),
    [remaining]
  );
  // Objetivo de esta comida: todo lo que queda, o una parte igual si se eligió cuántas comidas faltan.
  const target = useMemo<Remaining>(() => {
    if (!mealsLeft) return dayRemaining;
    return {
      calories: dayRemaining.calories / mealsLeft,
      protein: dayRemaining.protein / mealsLeft,
      carbs: dayRemaining.carbs / mealsLeft,
      fat: dayRemaining.fat / mealsLeft,
    };
  }, [dayRemaining, mealsLeft]);
  const result = useMemo(() => suggestPortions(selectedFoods, target), [selectedFoods, target]);
  const available = useMemo(
    () => foods.filter((f) => !selectedIds.includes(f.id)),
    [foods, selectedIds]
  );

  async function add(option: AutofillOption) {
    setSubmitting(true);
    await onSubmit(option.items.map((i) => ({ foodId: i.food.id, quantity: i.quantity })));
    setSubmitting(false);
  }

  if (remaining.calories <= 0) {
    return (
      <p className="mt-4 rounded-lg bg-neutral-50 p-4 text-sm text-neutral-600">
        Ya completaste tus calorías del día, así que no queda nada para autocompletar.
      </p>
    );
  }

  const exactGap = result ? Math.round(result.exact.totals.calories - target.calories) : 0;
  const macroExcess = result?.macros
    ? Math.round(result.macros.totals.calories - target.calories)
    : 0;
  const goalLabel = mealsLeft ? "lo asignado a esta comida" : "tu meta del día";

  return (
    <div className="mt-4 flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">
          ¿Cuántas comidas te quedan hoy? <span className="font-normal text-neutral-500">(opcional, incluida esta)</span>
        </span>
        <select
          value={mealsLeft ?? ""}
          onChange={(e) => setMealsLeft(e.target.value === "" ? null : Number(e.target.value))}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Usar todo lo que queda</option>
          {MEALS_LEFT_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n} comidas
            </option>
          ))}
        </select>
      </label>

      <div className="rounded-lg bg-brand-50 p-3 text-sm text-brand-900">
        <p>
          Te quedan <span className="font-semibold">{Math.round(dayRemaining.calories)} kcal</span> para
          completar el día.
        </p>
        {mealsLeft ? (
          <>
            <MacroLine values={dayRemaining} />
            <p className="mt-2 border-t border-brand-100 pt-2">
              Para esta comida (1 de {mealsLeft}):{" "}
              <span className="font-semibold">{Math.round(target.calories)} kcal</span>
            </p>
            <MacroLine values={target} />
          </>
        ) : (
          <MacroLine values={dayRemaining} />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-700">¿Qué alimentos tienes disponibles?</span>
        {selectedFoods.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {selectedFoods.map((food) => (
              <li
                key={food.id}
                className="flex items-center gap-1 rounded-full bg-neutral-100 py-1 pl-3 pr-1 text-sm"
              >
                {food.icon} {food.name}
                <button
                  type="button"
                  onClick={() => setSelectedIds((ids) => ids.filter((id) => id !== food.id))}
                  aria-label={`Quitar ${food.name}`}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-neutral-500 hover:bg-white hover:text-danger-600"
                >
                  <CloseIcon />
                </button>
              </li>
            ))}
          </ul>
        )}
        {selectedIds.length < MAX_FOODS && (
          <FoodPicker
            foods={available}
            value=""
            label="Agregar alimento disponible"
            inline
            onChange={(food) => setSelectedIds((ids) => [...ids, food.id])}
          />
        )}
      </div>

      {result && (
        <div className="flex max-h-[45vh] flex-col gap-3 overflow-y-auto">
          <OptionCard
            title="Opción 1 · Calorías exactas"
            description={
              mealsLeft
                ? "Completa justo las calorías de esta comida, repartiendo los macros en la proporción que te falta."
                : "Completa justo las calorías que te quedan, repartiendo los macros en la proporción que te falta."
            }
            option={result.exact}
            remaining={target}
            submitting={submitting}
            onAdd={() => add(result.exact)}
            notice={
              exactGap !== 0 && (
                <p className="text-xs text-neutral-500">
                  Con cantidades enteras es lo más cerca posible ({exactGap > 0 ? "+" : ""}
                  {exactGap} kcal).
                </p>
              )
            }
          />
          {result.macros ? (
            <OptionCard
              title="Opción 2 · Completar macros"
              description={
                mealsLeft
                  ? "Busca cubrir la parte de proteína, carbohidratos y grasa que le toca a esta comida."
                  : "Busca cubrir la proteína, los carbohidratos y la grasa que te faltan hoy."
              }
              option={result.macros}
              remaining={target}
              submitting={submitting}
              onAdd={() => add(result.macros!)}
              notice={
                macroExcess > 0 ? (
                  <p className="flex items-start gap-1.5 rounded-lg bg-sun-50 p-2 text-xs text-sun-800">
                    <AlertIcon size={14} className="mt-px shrink-0" />
                    <span>Con esta opción te pasas por <span className="font-semibold">{macroExcess} kcal</span>{" "}
                    de {goalLabel}.</span>
                  </p>
                ) : (
                  <p className="flex items-start gap-1.5 rounded-lg bg-lagoon-50 p-2 text-xs text-lagoon-800">
                    <CheckIcon size={14} className="mt-px shrink-0" />
                    No superas {goalLabel}{macroExcess < 0 ? ` (te quedan ${-macroExcess} kcal)` : ""}.
                  </p>
                )
              }
            />
          ) : (
            <p className="rounded-lg bg-neutral-50 p-3 text-xs text-neutral-600">
              Ya cubriste tus macros del día; solo aplica la opción de calorías exactas.
            </p>
          )}
          <p className="text-xs text-neutral-500">
            Las cantidades son de alimento tal como está cargado (por ejemplo, arroz cocido). Si algún
            macro no se completa, es porque los alimentos elegidos no lo aportan.
          </p>
        </div>
      )}
    </div>
  );
}
