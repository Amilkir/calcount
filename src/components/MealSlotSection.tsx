"use client";

import { CheckIcon, CloseIcon, PencilIcon } from "./icons";
import { useState } from "react";
import type { FoodEntryWithFood } from "@/lib/types";
import { PORTION_STEP, entryCalories, formatPortions, isValidPortion } from "@/lib/meals";
import {
  formatFreeDescription,
  parseFreeDescription,
  type PredominantMacro,
} from "@/lib/macros";

export type EntryUpdate =
  | { quantity: number }
  | { portions: number }
  | { calories: number; freeDescription?: string };

const MACRO_BADGES: Record<
  PredominantMacro,
  { label: string; className: string }
> = {
  PROTEINAS: { label: "Proteínas", className: "bg-red-50 text-red-700 border-red-200" },
  CARBOHIDRATOS: { label: "Carbos", className: "bg-blue-50 text-blue-700 border-blue-200" },
  GRASAS: { label: "Grasas", className: "bg-amber-50 text-amber-800 border-amber-200" },
  CHEAT_MEAL: { label: "Cheat Meal", className: "bg-neutral-100 text-neutral-600 border-neutral-200" },
};

function EntryRow({
  entry,
  onDelete,
  onUpdate,
}: {
  entry: FoodEntryWithFood;
  onDelete: (id: string) => void;
  onUpdate: (id: string, change: EntryUpdate) => Promise<boolean>;
}) {
  const isFood = entry.food != null;
  // Porciones de una comida porcionable: un solo registro con el nombre de la comida.
  const isPortion = entry.portions != null;
  const { description: freeDesc, macro: initialMacro } = parseFreeDescription(entry.freeDescription);
  const name = isFood ? entry.food!.name : isPortion ? (entry.freeDescription ?? "") : freeDesc;
  const icon = entry.food ? entry.food.icon : isPortion ? (entry.icon ?? "🍽️") : "📝";

  // Alimento: se edita la cantidad. Porcionable: las porciones. Libre: las calorías y el macro.
  const initial = isFood ? entry.quantity : isPortion ? entry.portions : Math.round(entry.calories);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<number | null>(initial);
  const [editMacro, setEditMacro] = useState<PredominantMacro>(initialMacro);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const unit = isFood ? (entry.food!.servingUnit === "UNIT" ? "u" : "g") : isPortion ? "porc." : "kcal";
  const valid = isPortion ? isValidPortion(value) : value != null && value > 0;
  const previewKcal =
    isFood && valid
      ? entryCalories(entry.food!, value!)
      : isPortion && valid
        ? (entry.calories * value!) / entry.portions!
        : value ?? 0;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    if (value === initial && (isFood || isPortion || editMacro === initialMacro)) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(false);
    const change: EntryUpdate = isFood
      ? { quantity: value! }
      : isPortion
        ? { portions: value! }
        : {
          calories: value!,
          freeDescription: formatFreeDescription(freeDesc, editMacro),
        };

    const ok = await onUpdate(entry.id, change);
    setSaving(false);
    if (ok) setEditing(false);
    else setError(true);
  }

  if (editing) {
    return (
      <li className="py-2 text-sm">
        <form onSubmit={save} className="flex flex-wrap items-center gap-2">
          <span className="flex min-w-0 flex-1 items-center gap-2 text-neutral-700">
            <span className="text-lg shrink-0">{icon}</span>
            <span className="truncate font-medium">{name}</span>
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {!isFood && !isPortion && (
              <select
                value={editMacro}
                onChange={(e) => setEditMacro(e.target.value as PredominantMacro)}
                className="rounded-lg border border-neutral-300 px-2 py-1 text-xs"
                aria-label="Tipo o macro predominante"
              >
                <option value="CARBOHIDRATOS">Carbohidratos</option>
                <option value="PROTEINAS">Proteínas</option>
                <option value="GRASAS">Grasas</option>
                <option value="CHEAT_MEAL">Cheat Meal</option>
              </select>
            )}
            <span className="flex items-center gap-1">
              <input
                type="number"
                min={isPortion ? PORTION_STEP : 0.1}
                step={isPortion ? PORTION_STEP : "any"}
                value={value ?? ""}
                onChange={(e) => setValue(e.target.value === "" ? null : Number(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setValue(initial);
                    setEditMacro(initialMacro);
                    setEditing(false);
                  }
                }}
                aria-label={
                  entry.food
                    ? `Cantidad de ${name}`
                    : isPortion
                      ? `Porciones de ${name}`
                      : `Calorías de ${name}`
                }
                className="w-16 sm:w-20 rounded-lg border border-neutral-300 px-2 py-1 text-sm"
                autoFocus
                required
              />
              <span className="text-xs text-neutral-500">{unit}</span>
            </span>
            {(entry.food || isPortion) && (
              <span className="w-14 text-right text-xs sm:text-sm text-neutral-500">
                {Math.round(previewKcal)} kcal
              </span>
            )}
            <button
              type="submit"
              disabled={saving || !valid}
              aria-label="Guardar cambio"
              className="flex h-8 w-8 items-center justify-center rounded-full text-lagoon-600 hover:bg-lagoon-50 disabled:opacity-40"
            >
              <CheckIcon />
            </button>
            <button
              type="button"
              onClick={() => {
                setValue(initial);
                setEditMacro(initialMacro);
                setError(false);
                setEditing(false);
              }}
              aria-label="Cancelar"
              className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
            >
              ↺
            </button>
          </div>
        </form>
        {error && <p className="mt-1 text-xs text-danger-600">No se pudo guardar el cambio.</p>}
      </li>
    );
  }

  const badge = !isFood && !isPortion ? MACRO_BADGES[initialMacro] : null;

  return (
    <li className="flex items-center justify-between gap-2 py-1.5 text-sm">
      <span className="flex min-w-0 flex-1 items-center gap-2 text-neutral-700">
        <span className="text-lg shrink-0">{icon}</span>
        <span className="truncate">
          {name}
          {isPortion && (
            <span className="text-neutral-500"> · {formatPortions(entry.portions!)}</span>
          )}
          {entry.food && (
            <span className="text-neutral-500">
              {" "}
              · {entry.quantity}
              {entry.food.servingUnit === "UNIT" ? " u" : " g"}
            </span>
          )}
        </span>
        {badge && (
          <span
            className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${badge.className}`}
          >
            {badge.label}
          </span>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-1 whitespace-nowrap">
        <span className="mr-1 text-xs sm:text-sm text-neutral-500 tabular-nums">
          {Math.round(entry.calories)} kcal
        </span>
        <button
          type="button"
          onClick={() => {
            setValue(initial);
            setEditMacro(initialMacro);
            setEditing(true);
          }}
          aria-label={`Editar ${name}`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:text-brand-700"
        >
          <PencilIcon size={14} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(entry.id)}
          aria-label={`Eliminar ${name}`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:text-danger-600"
        >
          <CloseIcon />
        </button>
      </span>
    </li>
  );
}

export default function MealSlotSection({
  label,
  entries,
  onAdd,
  onDelete,
  onUpdate,
}: {
  label: string;
  entries: FoodEntryWithFood[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, change: EntryUpdate) => Promise<boolean>;
}) {
  const total = entries.reduce((sum, e) => sum + e.calories, 0);

  return (
    <div className="flex flex-col rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-neutral-800">{label}</h3>
        <span className="text-sm font-medium text-neutral-500">{Math.round(total)} kcal</span>
      </div>

      {entries.length > 0 && (
        <ul className="mt-2 flex flex-col divide-y divide-neutral-100">
          {entries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} onDelete={onDelete} onUpdate={onUpdate} />
          ))}
        </ul>
      )}

      <button
        onClick={onAdd}
        className="mt-3 inline-flex min-h-11 items-center self-start text-sm font-semibold text-brand-700 hover:underline"
      >
        + Agregar alimento
      </button>
    </div>
  );
}
