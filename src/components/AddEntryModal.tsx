"use client";

import { useMemo, useState } from "react";
import type { Food } from "@/lib/types";
import { SERVING_UNIT_LABELS } from "@/lib/labels";

export type NewEntryPayload =
  | { kind: "food"; foodId: string; quantity: number }
  | { kind: "free"; description: string; calories: number };

export default function AddEntryModal({
  foods,
  mealLabel,
  onClose,
  onSubmit,
}: {
  foods: Food[];
  mealLabel: string;
  onClose: () => void;
  onSubmit: (payload: NewEntryPayload) => Promise<void>;
}) {
  const [mode, setMode] = useState<"food" | "free">("food");
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
            onClick={() => setMode("free")}
            className={`flex-1 rounded-full py-1.5 ${
              mode === "free" ? "bg-white shadow-sm text-brand-700" : "text-neutral-500"
            }`}
          >
            Alimento libre
          </button>
        </div>

        {mode === "food" ? (
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
