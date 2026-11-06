"use client";

import { AlertIcon, CheckIcon, CloseIcon } from "./icons";
import { useMemo, useState } from "react";
import type { Food } from "@/lib/types";
import { suggestPortions, type AutofillOption, type Remaining } from "@/lib/autofill";
import FoodPicker from "./FoodPicker";

const MAX_FOODS = 6;

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

  const selectedFoods = useMemo(
    () =>
      selectedIds
        .map((id) => foods.find((f) => f.id === id))
        .filter((f): f is Food => f != null),
    [foods, selectedIds]
  );
  const result = useMemo(() => suggestPortions(selectedFoods, remaining), [selectedFoods, remaining]);
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

  const exactGap = result ? Math.round(result.exact.totals.calories - remaining.calories) : 0;
  const macroExcess = result?.macros
    ? Math.round(result.macros.totals.calories - remaining.calories)
    : 0;

  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="rounded-lg bg-brand-50 p-3 text-sm text-brand-900">
        <p>
          Te quedan <span className="font-semibold">{Math.round(remaining.calories)} kcal</span> para
          completar el día.
        </p>
        <MacroLine values={{ ...remaining, protein: Math.max(0, remaining.protein), carbs: Math.max(0, remaining.carbs), fat: Math.max(0, remaining.fat) }} />
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
            description="Completa justo las calorías que te quedan, repartiendo los macros en la proporción que te falta."
            option={result.exact}
            remaining={remaining}
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
              description="Busca cubrir la proteína, los carbohidratos y la grasa que te faltan hoy."
              option={result.macros}
              remaining={remaining}
              submitting={submitting}
              onAdd={() => add(result.macros!)}
              notice={
                macroExcess > 0 ? (
                  <p className="flex items-start gap-1.5 rounded-lg bg-sun-50 p-2 text-xs text-sun-800">
                    <AlertIcon size={14} className="mt-px shrink-0" />
                    <span>Con esta opción te pasas por <span className="font-semibold">{macroExcess} kcal</span>{" "}
                    de tu meta del día.</span>
                  </p>
                ) : (
                  <p className="flex items-start gap-1.5 rounded-lg bg-lagoon-50 p-2 text-xs text-lagoon-800">
                    <CheckIcon size={14} className="mt-px shrink-0" />
                    No superas tus calorías{macroExcess < 0 ? ` (te quedan ${-macroExcess} kcal)` : ""}.
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
