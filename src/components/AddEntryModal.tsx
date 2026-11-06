"use client";

import { CheckIcon, CloseIcon } from "./icons";
import Link from "next/link";
import type { Remaining } from "@/lib/autofill";
import AutofillPanel from "./AutofillPanel";
import { useMemo, useState } from "react";
import type { Food } from "@/lib/types";
import { SERVING_UNIT_LABELS } from "@/lib/labels";
import { foodMacrosPerServing } from "@/lib/macros";

// La API acepta hasta 20 alimentos por envío.
const MAX_PLATE = 20;
import {
  entryCalories,
  templateCalories,
  type MealTemplateWithItems,
} from "@/lib/meals";

export type NewEntryPayload =
  | { kind: "food"; foodId: string; quantity: number }
  | { kind: "free"; description: string; calories: number }
  | { kind: "meal"; mealTemplateId: string; items: { itemId: string; quantity: number }[] }
  | { kind: "batch"; foods: { foodId: string; quantity: number }[] };

export default function AddEntryModal({
  foods,
  meals,
  remaining,
  mealLabel,
  onClose,
  onSubmit,
}: {
  foods: Food[];
  meals: MealTemplateWithItems[];
  remaining: Remaining;
  mealLabel: string;
  onClose: () => void;
  onSubmit: (payload: NewEntryPayload) => Promise<void>;
}) {
  const [mode, setMode] = useState<"food" | "meal" | "autofill" | "free">("food");
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  // El plato: varios alimentos con su cantidad. null = campo vacío (no se puede agregar aún).
  const [plate, setPlate] = useState<{ foodId: string; quantity: number | null }[]>([]);
  const [description, setDescription] = useState("");
  const [freeCalories, setFreeCalories] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return foods;
    return foods.filter(
      (f) => f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)
    );
  }, [foods, search]);

  const plateRows = plate
    .map((row) => {
      const food = foods.find((f) => f.id === row.foodId);
      if (!food) return null;
      const servings = row.quantity ? (food.servingUnit === "UNIT" ? row.quantity : row.quantity / 100) : 0;
      const per = foodMacrosPerServing(food);
      return {
        ...row,
        food,
        calories: per.calories * servings,
        protein: per.protein * servings,
        carbs: per.carbs * servings,
        fat: per.fat * servings,
      };
    })
    .filter((r) => r !== null);
  const plateTotals = plateRows.reduce(
    (t, r) => ({
      calories: t.calories + r.calories,
      protein: t.protein + r.protein,
      carbs: t.carbs + r.carbs,
      fat: t.fat + r.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  const plateInvalid =
    plateRows.length === 0 || plateRows.some((r) => r.quantity == null || r.quantity <= 0);

  function addToPlate(food: Food) {
    if (plate.some((r) => r.foodId === food.id) || plate.length >= MAX_PLATE) return;
    setPlate((prev) => [...prev, { foodId: food.id, quantity: food.servingUnit === "UNIT" ? 1 : 100 }]);
  }

  async function handleSubmitFood(e: React.FormEvent) {
    e.preventDefault();
    if (plateInvalid) return;
    setSubmitting(true);
    await onSubmit({
      kind: "batch",
      foods: plateRows.map((r) => ({ foodId: r.foodId, quantity: r.quantity as number })),
    });
    setSubmitting(false);
  }

  const selectedMeal = meals.find((m) => m.id === selectedMealId) ?? null;
  // Cantidades de esta carga (parten de las de la plantilla) y alimentos desmarcados.
  const [mealQuantities, setMealQuantities] = useState<Record<string, number | null>>({});
  const [mealExcluded, setMealExcluded] = useState<Set<string>>(new Set());

  function selectMeal(meal: MealTemplateWithItems) {
    setSelectedMealId(meal.id);
    setMealQuantities(Object.fromEntries(meal.items.map((i) => [i.id, i.quantity])));
    setMealExcluded(new Set());
  }

  const mealSelection = (selectedMeal?.items ?? [])
    .filter((item) => !mealExcluded.has(item.id))
    .map((item) => ({ item, quantity: mealQuantities[item.id] ?? null }));
  const mealInvalid =
    mealSelection.length === 0 || mealSelection.some((s) => s.quantity == null || s.quantity <= 0);
  const mealTotal = mealSelection.reduce(
    (sum, s) => sum + (s.quantity ? entryCalories(s.item.food, s.quantity) : 0),
    0
  );

  async function handleSubmitMeal(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMeal || mealInvalid) return;
    setSubmitting(true);
    await onSubmit({
      kind: "meal",
      mealTemplateId: selectedMeal.id,
      items: mealSelection.map((s) => ({ itemId: s.item.id, quantity: s.quantity as number })),
    });
    setSubmitting(false);
  }

  const freeInvalid = !description.trim() || freeCalories == null || freeCalories <= 0;

  async function handleSubmitFree(e: React.FormEvent) {
    e.preventDefault();
    if (freeInvalid || freeCalories == null) return;
    setSubmitting(true);
    await onSubmit({ kind: "free", description: description.trim(), calories: freeCalories });
    setSubmitting(false);
  }

  return (
    // El borde superior queda fijo y el modal crece hacia abajo según la pestaña, así las
    // pestañas no se mueven bajo el cursor. Solo se cierra con la X o al agregar.
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[6vh] pb-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Agregar a ${mealLabel}`}
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Agregar a {mealLabel}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600"
            aria-label="Cerrar"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="mt-4 flex gap-1 rounded-full bg-neutral-100 p-1 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setMode("food")}
            className={`flex-1 rounded-full py-1.5 ${
              mode === "food" ? "bg-white shadow-sm text-brand-700" : "text-neutral-500"
            }`}
          >
            Alimento
          </button>
          <button
            type="button"
            onClick={() => setMode("meal")}
            className={`flex-1 rounded-full py-1.5 ${
              mode === "meal" ? "bg-white shadow-sm text-brand-700" : "text-neutral-500"
            }`}
          >
            Comidas
          </button>
          <button
            type="button"
            onClick={() => setMode("autofill")}
            className={`flex-1 rounded-full py-1.5 ${
              mode === "autofill" ? "bg-white shadow-sm text-brand-700" : "text-neutral-500"
            }`}
          >
            Completar
          </button>
          <button
            type="button"
            onClick={() => setMode("free")}
            className={`flex-1 rounded-full py-1.5 ${
              mode === "free" ? "bg-white shadow-sm text-brand-700" : "text-neutral-500"
            }`}
          >
            Libre
          </button>
        </div>

        {mode === "autofill" ? (
          <AutofillPanel
            foods={foods}
            remaining={remaining}
            onSubmit={(items) => onSubmit({ kind: "batch", foods: items })}
          />
        ) : mode === "meal" ? (
          !selectedMeal ? (
            <div className="mt-4 max-h-80 overflow-y-auto rounded-lg border border-neutral-100">
              {meals.length === 0 && (
                <p className="p-4 text-sm text-neutral-500">
                  No tienes comidas guardadas. Créalas en{" "}
                  <Link href="/foods" className="font-semibold text-brand-700 hover:underline">
                    Alimentos → Comidas
                  </Link>
                  .
                </p>
              )}
              {meals.map((meal) => (
                <button
                  type="button"
                  key={meal.id}
                  onClick={() => selectMeal(meal)}
                  className="flex w-full items-center gap-3 border-b border-neutral-100 px-3 py-2 text-left last:border-none hover:bg-neutral-50"
                >
                  <span className="text-xl">{meal.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-neutral-800">{meal.name}</span>
                    <span className="block truncate text-xs text-neutral-500">
                      {meal.items.map((i) => i.food.name).join(", ")}
                    </span>
                  </span>
                  <span className="whitespace-nowrap text-xs text-neutral-500">
                    {Math.round(templateCalories(meal))} kcal
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmitMeal} className="mt-4 flex flex-col gap-4">
              <div className="flex items-center gap-3 rounded-lg bg-neutral-50 p-3">
                <span className="text-2xl">{selectedMeal.icon}</span>
                <p className="flex-1 text-sm font-medium">{selectedMeal.name}</p>
                <button
                  type="button"
                  onClick={() => setSelectedMealId(null)}
                  className="text-xs font-semibold text-brand-700 hover:underline"
                >
                  Cambiar
                </button>
              </div>

              <p className="text-xs text-neutral-500">
                Ajusta las cantidades de hoy o desmarca lo que no comiste. La comida guardada no cambia.
              </p>

              <ul className="flex max-h-72 flex-col divide-y divide-neutral-100 overflow-y-auto text-sm">
                {selectedMeal.items.map((item) => {
                  const included = !mealExcluded.has(item.id);
                  const qty = mealQuantities[item.id] ?? null;
                  return (
                    <li key={item.id} className="flex items-center gap-2 py-1.5">
                      <input
                        type="checkbox"
                        checked={included}
                        onChange={(e) =>
                          setMealExcluded((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.delete(item.id);
                            else next.add(item.id);
                            return next;
                          })
                        }
                        aria-label={`Incluir ${item.food.name}`}
                        className="h-4 w-4 shrink-0 accent-brand-600"
                      />
                      <span
                        className={`min-w-0 flex-1 truncate ${included ? "text-neutral-700" : "text-neutral-400 line-through"}`}
                      >
                        {item.food.icon} {item.food.name}
                      </span>
                      <input
                        type="number"
                        min={0.1}
                        step="any"
                        value={qty ?? ""}
                        disabled={!included}
                        onChange={(e) =>
                          setMealQuantities((prev) => ({
                            ...prev,
                            [item.id]: e.target.value === "" ? null : Number(e.target.value),
                          }))
                        }
                        aria-label={`Cantidad de ${item.food.name}`}
                        className="w-20 rounded-lg border border-neutral-300 px-2 py-1 disabled:opacity-50"
                        required={included}
                      />
                      <span className="w-4 text-neutral-500">
                        {item.food.servingUnit === "UNIT" ? "u" : "g"}
                      </span>
                      <span className="w-16 whitespace-nowrap text-right text-neutral-500">
                        {included && qty ? `${Math.round(entryCalories(item.food, qty))} kcal` : "–"}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <p className="text-sm text-neutral-600">
                Total:{" "}
                <span className="font-semibold text-neutral-900">{Math.round(mealTotal)} kcal</span>
              </p>

              <button type="submit" disabled={submitting || mealInvalid} className="btn-primary">
                {submitting
                  ? "Agregando..."
                  : `Agregar ${mealSelection.length} ${mealSelection.length === 1 ? "alimento" : "alimentos"}`}
              </button>
            </form>
          )
        ) : mode === "food" ? (
          <form onSubmit={handleSubmitFood} className="mt-4 flex flex-col gap-3">
            <input
              autoFocus
              type="text"
              placeholder="Buscar alimento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar alimento"
              className="rounded-lg border border-neutral-300 px-3 py-2"
            />
            {/* Tocar un alimento lo suma al plato; los que ya están se marcan. */}
            <div
              className={`overflow-y-auto rounded-lg border border-neutral-100 ${
                plateRows.length > 0 ? "max-h-48" : "max-h-72"
              }`}
            >
              {filtered.length === 0 && (
                <p className="p-4 text-sm text-neutral-400">No se encontraron alimentos.</p>
              )}
              {filtered.map((food) => {
                const inPlate = plate.some((r) => r.foodId === food.id);
                return (
                  <button
                    type="button"
                    key={food.id}
                    onClick={() => addToPlate(food)}
                    disabled={inPlate}
                    aria-label={inPlate ? `${food.name} (ya en el plato)` : `Sumar ${food.name}`}
                    className={`flex w-full items-center gap-3 border-b border-neutral-100 px-3 py-2 text-left last:border-none ${
                      inPlate ? "cursor-default bg-lagoon-50" : "hover:bg-neutral-50"
                    }`}
                  >
                    <span className="text-xl">{food.icon}</span>
                    <span className="flex-1">
                      <span className="block text-sm font-medium text-neutral-800">{food.name}</span>
                      <span className="block text-xs text-neutral-400">{food.category}</span>
                    </span>
                    {inPlate ? (
                      <CheckIcon className="shrink-0 text-lagoon-700" />
                    ) : (
                      <span className="whitespace-nowrap text-xs text-neutral-500">
                        {food.calories} kcal {SERVING_UNIT_LABELS[food.servingUnit]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {plateRows.length === 0 ? (
              <p className="text-xs text-neutral-500">
                Toca los alimentos que vas a comer; puedes sumar varios y ajustar cada cantidad antes de
                agregarlos.
              </p>
            ) : (
              <div className="flex flex-col rounded-lg border border-neutral-200">
                <ul className="flex flex-col divide-y divide-neutral-100 px-3 text-sm">
                  {plateRows.map((row) => (
                    <li key={row.foodId} className="flex items-center gap-2 py-2">
                      <span className="min-w-0 flex-1 truncate text-neutral-800">
                        {row.food.icon} {row.food.name}
                      </span>
                      <input
                        type="number"
                        min={row.food.servingUnit === "UNIT" ? 0.5 : 1}
                        step="any"
                        inputMode="decimal"
                        value={row.quantity ?? ""}
                        onChange={(e) => {
                          const value = e.target.value === "" ? null : Number(e.target.value);
                          setPlate((prev) =>
                            prev.map((r) => (r.foodId === row.foodId ? { ...r, quantity: value } : r))
                          );
                        }}
                        aria-label={`Cantidad de ${row.food.name}`}
                        className="w-20 rounded-lg border border-neutral-300 px-2 py-1"
                      />
                      <span className="w-4 text-neutral-500">
                        {row.food.servingUnit === "UNIT" ? "u" : "g"}
                      </span>
                      <span className="w-16 whitespace-nowrap text-right tabular-nums text-neutral-500">
                        {row.quantity ? `${Math.round(row.calories)} kcal` : "–"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPlate((prev) => prev.filter((r) => r.foodId !== row.foodId))}
                        aria-label={`Quitar ${row.food.name}`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-danger-50 hover:text-danger-600"
                      >
                        <CloseIcon />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-neutral-200 bg-neutral-50 px-3 py-2 text-sm">
                  <span className="font-semibold text-neutral-900">
                    Total {Math.round(plateTotals.calories)} kcal
                  </span>
                  <span className="text-xs text-neutral-500">
                    P {Math.round(plateTotals.protein)} g · C {Math.round(plateTotals.carbs)} g · G{" "}
                    {Math.round(plateTotals.fat)} g
                  </span>
                </div>
              </div>
            )}

            <button type="submit" disabled={submitting || plateInvalid} className="btn-primary">
              {submitting
                ? "Agregando..."
                : plateRows.length > 1
                  ? `Agregar ${plateRows.length} alimentos`
                  : "Agregar"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmitFree} className="mt-4 flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-neutral-700">Descripción</span>
              <input
                autoFocus
                type="text"
                placeholder="Ej. Pizza, pollo frito, galletas..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-lg border border-neutral-300 px-3 py-2"
                required
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-neutral-700">Calorías</span>
              <input
                type="number"
                min={1}
                step={1}
                value={freeCalories ?? ""}
                onChange={(e) =>
                  setFreeCalories(e.target.value === "" ? null : Number(e.target.value))
                }
                className="rounded-lg border border-neutral-300 px-3 py-2"
                required
              />
            </label>

            <button
              type="submit"
              disabled={submitting || freeInvalid}
              className="btn-primary"
            >
              {submitting ? "Agregando..." : "Agregar"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
