"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Food } from "@/lib/types";
import { FoodType, ServingUnit } from "@/generated/prisma/enums";
import { FOOD_TYPE_LABELS, SERVING_UNIT_LABELS } from "@/lib/labels";

const EMPTY_FORM = {
  name: "",
  category: "",
  icon: "🍽️",
  servingUnit: "GRAMS_100" as (typeof ServingUnit)[keyof typeof ServingUnit],
  foodType: "CARBOHIDRATOS" as (typeof FoodType)[keyof typeof FoodType],
  calories: 100,
  protein: null as number | null,
  carbs: null as number | null,
  fat: null as number | null,
};

const MACRO_INPUTS = [
  { key: "protein", label: "Proteína (g)" },
  { key: "carbs", label: "Carbohidratos (g)" },
  { key: "fat", label: "Grasa (g)" },
] as const;

export default function FoodsManager({ foods }: { foods: Food[] }) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.category.trim() || form.calories <= 0) {
      setError("Completa nombre, categoría y unas calorías válidas.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/foods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "No se pudo agregar el alimento.");
      return;
    }

    setForm(EMPTY_FORM);
    setShowForm(false);
    router.refresh();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}" de la base de datos de alimentos?`)) return;
    const res = await fetch(`/api/foods/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      alert("No se pudo eliminar el alimento.");
    }
  }

  const byCategory = foods.reduce<Record<string, Food[]>>((acc, food) => {
    (acc[food.category] ??= []).push(food);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Alimentos</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary"
        >
          {showForm ? "Cancelar" : "+ Nuevo alimento"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm sm:grid-cols-2"
        >
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-neutral-700">Nombre</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-lg border border-neutral-300 px-3 py-2"
              required
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-neutral-700">Categoría</span>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="Ej. Vegetales"
              className="rounded-lg border border-neutral-300 px-3 py-2"
              required
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-neutral-700">Ícono (emoji)</span>
            <input
              type="text"
              value={form.icon}
              onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
              className="rounded-lg border border-neutral-300 px-3 py-2"
              maxLength={4}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-neutral-700">Unidad de porción</span>
            <select
              value={form.servingUnit}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  servingUnit: e.target.value as typeof form.servingUnit,
                }))
              }
              className="rounded-lg border border-neutral-300 px-3 py-2"
            >
              {Object.values(ServingUnit).map((unit) => (
                <option key={unit} value={unit}>
                  {SERVING_UNIT_LABELS[unit]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-neutral-700">Tipo de alimento</span>
            <select
              value={form.foodType}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  foodType: e.target.value as typeof form.foodType,
                }))
              }
              className="rounded-lg border border-neutral-300 px-3 py-2"
            >
              {Object.values(FoodType).map((type) => (
                <option key={type} value={type}>
                  {FOOD_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-sm font-medium text-neutral-700">
              Calorías ({SERVING_UNIT_LABELS[form.servingUnit]})
            </span>
            <input
              type="number"
              min={0}
              step={0.1}
              value={form.calories}
              onChange={(e) => setForm((f) => ({ ...f, calories: Number(e.target.value) }))}
              className="rounded-lg border border-neutral-300 px-3 py-2"
              required
            />
          </label>

          <div className="grid gap-4 sm:col-span-2 sm:grid-cols-3">
            {MACRO_INPUTS.map(({ key, label }) => (
              <label key={key} className="flex flex-col gap-1">
                <span className="text-sm font-medium text-neutral-700">
                  {label} (opcional)
                </span>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={form[key] ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      [key]: e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                  className="rounded-lg border border-neutral-300 px-3 py-2"
                />
              </label>
            ))}
            <p className="text-xs text-neutral-500 sm:col-span-3">
              Por {SERVING_UNIT_LABELS[form.servingUnit]}. Con los macros, el panel del día calcula tus gramos reales.
            </p>
          </div>

          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary self-start sm:col-span-2"
          >
            {submitting ? "Guardando..." : "Guardar alimento"}
          </button>
        </form>
      )}

      <div className="flex flex-col gap-6">
        {Object.entries(byCategory).map(([category, items]) => (
          <div key={category}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
              {category}
            </h2>
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 text-neutral-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Alimento</th>
                    <th className="px-4 py-2 font-medium">Tipo</th>
                    <th className="px-4 py-2 font-medium">Calorías</th>
                    <th className="px-4 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {items.map((food) => (
                    <tr key={food.id}>
                      <td className="flex items-center gap-2 px-4 py-2">
                        <span className="text-lg">{food.icon}</span>
                        <span>{food.name}</span>
                      </td>
                      <td className="px-4 py-2 text-neutral-600">
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                          {FOOD_TYPE_LABELS[food.foodType]}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-neutral-600">
                        {food.calories} kcal {SERVING_UNIT_LABELS[food.servingUnit]}
                        {food.protein != null && (
                          <span className="block text-xs text-neutral-400">
                            P {food.protein} · C {food.carbs ?? 0} · G {food.fat ?? 0}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {food.userId ? (
                          <button
                            onClick={() => handleDelete(food.id, food.name)}
                            className="p-2 text-xs font-medium text-red-600 hover:underline"
                          >
                            Eliminar
                          </button>
                        ) : (
                          <span className="p-2 text-xs text-neutral-400">Catálogo</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
