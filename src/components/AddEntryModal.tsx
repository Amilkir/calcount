"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Food } from "@/lib/types";
import { SERVING_UNIT_LABELS } from "@/lib/labels";
import {
  entryCalories,
  templateCalories,
  type MealTemplateWithItems,
} from "@/lib/meals";

export type NewEntryPayload =
  | { kind: "food"; foodId: string; quantity: number }
  | { kind: "free"; description: string; calories: number }
  | { kind: "meal"; mealTemplateId: string; items: { itemId: string; quantity: number }[] };

export default function AddEntryModal({
  foods,
  meals,
  mealLabel,
  onClose,
  onSubmit,
}: {
  foods: Food[];
  meals: MealTemplateWithItems[];
  mealLabel: string;
  onClose: () => void;
  onSubmit: (payload: NewEntryPayload) => Promise<void>;
}) {
  const [mode, setMode] = useState<"food" | "meal" | "free">("food");
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(100);
  const [description, setDescription] = useState("");
  const [freeCalories, setFreeCalories] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return foods;
    return foods.filter(
      (f) => f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)
    );
  }, [foods, search]);

  const selectedFood = foods.find((f) => f.id === selectedFoodId) ?? null;

  const previewCalories = selectedFood
    ? selectedFood.servingUnit === "UNIT"
      ? selectedFood.calories * quantity
      : selectedFood.calories * (quantity / 100)
    : 0;

  async function handleSubmitFood(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFood || quantity <= 0) return;
    setSubmitting(true);
    await onSubmit({ kind: "food", foodId: selectedFood.id, quantity });
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

  async function handleSubmitFree(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || freeCalories <= 0) return;
    setSubmitting(true);
    await onSubmit({ kind: "free", description: description.trim(), calories: freeCalories });
    setSubmitting(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Agregar a {mealLabel}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600"
            aria-label="Cerrar"
          >
            ✕
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
            onClick={() => setMode("free")}
            className={`flex-1 rounded-full py-1.5 ${
              mode === "free" ? "bg-white shadow-sm text-brand-700" : "text-neutral-500"
            }`}
          >
            Alimento libre
          </button>
        </div>

        {mode === "meal" ? (
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
          !selectedFood ? (
            <div className="mt-4 flex flex-col gap-3">
              <input
                autoFocus
                type="text"
                placeholder="Buscar alimento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-lg border border-neutral-300 px-3 py-2"
              />
              <div className="max-h-72 overflow-y-auto rounded-lg border border-neutral-100">
                {filtered.length === 0 && (
                  <p className="p-4 text-sm text-neutral-400">
                    No se encontraron alimentos.
                  </p>
                )}
                {filtered.map((food) => (
                  <button
                    type="button"
                    key={food.id}
                    onClick={() => {
                      setSelectedFoodId(food.id);
                      setQuantity(food.servingUnit === "UNIT" ? 1 : 100);
                    }}
                    className="flex w-full items-center gap-3 border-b border-neutral-100 px-3 py-2 text-left last:border-none hover:bg-neutral-50"
                  >
                    <span className="text-xl">{food.icon}</span>
                    <span className="flex-1">
                      <span className="block text-sm font-medium text-neutral-800">
                        {food.name}
                      </span>
                      <span className="block text-xs text-neutral-400">{food.category}</span>
                    </span>
                    <span className="whitespace-nowrap text-xs text-neutral-500">
                      {food.calories} kcal {SERVING_UNIT_LABELS[food.servingUnit]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitFood} className="mt-4 flex flex-col gap-4">
              <div className="flex items-center gap-3 rounded-lg bg-neutral-50 p-3">
                <span className="text-2xl">{selectedFood.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{selectedFood.name}</p>
                  <p className="text-xs text-neutral-500">
                    {selectedFood.calories} kcal {SERVING_UNIT_LABELS[selectedFood.servingUnit]}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFoodId(null)}
                  className="text-xs font-semibold text-brand-700 hover:underline"
                >
                  Cambiar
                </button>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-neutral-700">
                  Cantidad {selectedFood.servingUnit === "UNIT" ? "(unidades)" : "(gramos)"}
                </span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="rounded-lg border border-neutral-300 px-3 py-2"
                  required
                  autoFocus
                />
              </label>

              <p className="text-sm text-neutral-600">
                Calorías estimadas:{" "}
                <span className="font-semibold text-neutral-900">
                  {Math.round(previewCalories)} kcal
                </span>
              </p>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? "Agregando..." : "Agregar"}
              </button>
            </form>
          )
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
                value={freeCalories}
                onChange={(e) => setFreeCalories(Number(e.target.value))}
                className="rounded-lg border border-neutral-300 px-3 py-2"
                required
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
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
