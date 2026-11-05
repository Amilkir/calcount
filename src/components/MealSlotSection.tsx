"use client";

import { useState } from "react";
import type { FoodEntryWithFood } from "@/lib/types";
import { entryCalories } from "@/lib/meals";

export type EntryUpdate = { quantity: number } | { calories: number };

function EntryRow({
  entry,
  onDelete,
  onUpdate,
}: {
  entry: FoodEntryWithFood;
  onDelete: (id: string) => void;
  onUpdate: (id: string, change: EntryUpdate) => Promise<boolean>;
}) {
  const name = entry.food ? entry.food.name : entry.freeDescription;
  // Alimento: se edita la cantidad. Alimento libre: se editan las calorías.
  const initial = entry.food ? entry.quantity : Math.round(entry.calories);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<number | null>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const unit = entry.food ? (entry.food.servingUnit === "UNIT" ? "u" : "g") : "kcal";
  const valid = value != null && value > 0;
  const previewKcal = entry.food && valid ? entryCalories(entry.food, value) : value ?? 0;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    if (value === initial) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(false);
    const ok = await onUpdate(entry.id, entry.food ? { quantity: value } : { calories: value });
    setSaving(false);
    if (ok) setEditing(false);
    else setError(true);
  }

  if (editing) {
    return (
      <li className="py-1.5 text-sm">
        <form onSubmit={save} className="flex flex-wrap items-center gap-2">
          <span className="flex min-w-0 flex-1 items-center gap-2 text-neutral-700">
            <span className="text-lg">{entry.food ? entry.food.icon : "📝"}</span>
            <span className="truncate">{name}</span>
          </span>
          <span className="flex items-center gap-1">
            <input
              type="number"
              min={0.1}
              step="any"
              value={value ?? ""}
              onChange={(e) => setValue(e.target.value === "" ? null : Number(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setValue(initial);
                  setEditing(false);
                }
              }}
              aria-label={entry.food ? `Cantidad de ${name}` : `Calorías de ${name}`}
              className="w-20 rounded-lg border border-neutral-300 px-2 py-1"
              autoFocus
              required
            />
            <span className="text-neutral-500">{unit}</span>
          </span>
          {entry.food && (
            <span className="w-16 text-right text-neutral-500">{Math.round(previewKcal)} kcal</span>
          )}
          <button
            type="submit"
            disabled={saving || !valid}
            aria-label="Guardar cambio"
            className="flex h-8 w-8 items-center justify-center rounded-full text-emerald-600 hover:bg-emerald-50 disabled:opacity-40"
          >
            ✓
          </button>
          <button
            type="button"
            onClick={() => {
              setValue(initial);
              setError(false);
              setEditing(false);
            }}
            aria-label="Cancelar"
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
          >
            ↺
          </button>
        </form>
        {error && <p className="mt-1 text-xs text-red-600">No se pudo guardar el cambio.</p>}
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-2 py-1.5 text-sm">
      <span className="flex items-center gap-2 text-neutral-700">
        <span className="text-lg">{entry.food ? entry.food.icon : "📝"}</span>
        <span>
          {name}
          {entry.food && (
            <span className="text-neutral-500">
              {" "}
              · {entry.quantity}
              {entry.food.servingUnit === "UNIT" ? " u" : " g"}
            </span>
          )}
        </span>
      </span>
      <span className="flex items-center gap-1 whitespace-nowrap">
        <span className="mr-1 text-neutral-500">{Math.round(entry.calories)} kcal</span>
        <button
          type="button"
          onClick={() => {
            setValue(initial);
            setEditing(true);
          }}
          aria-label={`Editar ${name}`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:text-brand-700"
        >
          ✎
        </button>
        <button
          type="button"
          onClick={() => onDelete(entry.id)}
          aria-label={`Eliminar ${name}`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:text-red-600"
        >
          ✕
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
        <span className="text-sm text-neutral-500">{Math.round(total)} kcal</span>
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
