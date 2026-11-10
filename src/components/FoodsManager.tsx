"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Food } from "@/lib/types";
import { FoodType, ServingUnit } from "@/generated/prisma/enums";
import { FOOD_TYPE_LABELS, SERVING_UNIT_LABELS } from "@/lib/labels";

const CANONICAL_CATEGORIES = [
  "Aceites y grasas",
  "Bebidas vegetales",
  "Carnes",
  "Cereales y granos",
  "Encurtidos",
  "Frutas",
  "Frutos secos",
  "Huevos y lácteos",
  "Leguminosas",
  "Pescados y mariscos",
  "Suplementos",
  "Tubérculos",
  "Vegetales",
  "Sin Categoría",
];

const MACRO_INPUTS = [
  { key: "protein", label: "Proteína (g)" },
  { key: "carbs", label: "Carbohidratos (g)" },
  { key: "fat", label: "Grasa (g)" },
] as const;

export default function FoodsManager({ foods }: { foods: Food[] }) {
  const router = useRouter();

  const availableCategories = useMemo(() => {
    const set = new Set<string>(CANONICAL_CATEGORIES);
    foods.forEach((f) => {
      if (f.category?.trim()) set.add(f.category.trim());
    });
    return Array.from(set).sort((a, b) => {
      if (a === "Sin Categoría") return 1;
      if (b === "Sin Categoría") return -1;
      return a.localeCompare(b, "es");
    });
  }, [foods]);

  const defaultCategory = availableCategories[0] ?? "Carnes";

  const emptyForm = {
    name: "",
    category: defaultCategory,
    icon: "🍽️",
    servingUnit: "GRAMS_100" as (typeof ServingUnit)[keyof typeof ServingUnit],
    foodType: "CARBOHIDRATOS" as (typeof FoodType)[keyof typeof FoodType],
    calories: null as number | null,
    protein: null as number | null,
    carbs: null as number | null,
    fat: null as number | null,
  };

  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Estado para editar un alimento propio
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const isFormCaloriesInvalid = form.calories == null || form.calories <= 0;
  const formInvalid = !form.name.trim() || !form.category.trim() || isFormCaloriesInvalid;

  const isEditCaloriesInvalid = editForm.calories == null || editForm.calories <= 0;
  const editInvalid = !editForm.name.trim() || !editForm.category.trim() || isEditCaloriesInvalid;

  function startEdit(food: Food) {
    setEditError(null);
    setEditingFood(food);
    setEditForm({
      name: food.name,
      category: food.category || "Sin Categoría",
      icon: food.icon,
      servingUnit: food.servingUnit,
      foodType: food.foodType,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
    });
    // Si el form de nuevo alimento estaba abierto, lo cerramos para no confundir
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (formInvalid) {
      setError("Completa nombre, categoría y unas calorías válidas mayores a 0.");
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

    setForm({ ...emptyForm, category: defaultCategory });
    setShowForm(false);
    router.refresh();
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingFood) return;
    setEditError(null);

    if (editInvalid) {
      setEditError("Completa nombre, categoría y unas calorías válidas mayores a 0.");
      return;
    }

    setEditSubmitting(true);
    const res = await fetch(`/api/foods/${editingFood.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setEditError(data?.error ?? "No se pudo actualizar el alimento.");
      return;
    }

    setEditingFood(null);
    router.refresh();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}" de la base de datos de alimentos?`)) return;
    const res = await fetch(`/api/foods/${id}`, { method: "DELETE" });
    if (res.ok) {
      if (editingFood?.id === id) setEditingFood(null);
      router.refresh();
    } else {
      alert("No se pudo eliminar el alimento.");
    }
  }

  const byCategory = foods.reduce<Record<string, Food[]>>((acc, food) => {
    const cat = food.category?.trim() ? food.category.trim() : "Sin Categoría";
    (acc[cat] ??= []).push(food);
    return acc;
  }, {});

  // Ordenar categorías para que "Sin Categoría" quede al principio para reasignar fácilmente
  const sortedCategories = Object.keys(byCategory).sort((a, b) => {
    if (a === "Sin Categoría") return -1;
    if (b === "Sin Categoría") return 1;
    return a.localeCompare(b, "es");
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs sm:text-sm text-neutral-500">Catálogo y alimentos propios.</p>
        <button
          onClick={() => {
            setShowForm((v) => !v);
            if (editingFood) setEditingFood(null);
          }}
          className="btn-primary"
        >
          {showForm ? "Cancelar" : "+ Nuevo alimento"}
        </button>
      </div>

      {/* Formulario de Nuevo Alimento */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-sm sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <h2 className="font-semibold text-neutral-800">Nuevo alimento</h2>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-neutral-700">Nombre</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ej. Batido de proteínas"
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              required
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-neutral-700">Categoría</span>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              required
            >
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-neutral-700">Ícono (emoji)</span>
            <input
              type="text"
              value={form.icon}
              onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
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
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
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
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
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
              min={0.1}
              step={0.1}
              value={form.calories ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  calories: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              placeholder="Ej. 120"
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              required
            />
          </label>

          <div className="grid gap-3 sm:gap-4 sm:col-span-2 sm:grid-cols-3">
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
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />
              </label>
            ))}
            <p className="text-xs text-neutral-500 sm:col-span-3">
              Por {SERVING_UNIT_LABELS[form.servingUnit]}. Con los macros, el panel del día calcula tus gramos reales.
            </p>
          </div>

          {error && <p className="text-sm text-danger-600 sm:col-span-2">{error}</p>}

          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={submitting || formInvalid}
              className="btn-primary"
            >
              {submitting ? "Guardando..." : "Guardar alimento"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Formulario de Edición de Alimento */}
      {editingFood && (
        <form
          onSubmit={handleEditSubmit}
          className="grid gap-4 rounded-xl border border-brand-200 bg-brand-50/40 p-4 sm:p-5 shadow-sm sm:grid-cols-2"
        >
          <div className="flex items-center justify-between sm:col-span-2">
            <h2 className="font-semibold text-neutral-800">
              Editar «{editingFood.name}»
            </h2>
            <button
              type="button"
              onClick={() => setEditingFood(null)}
              className="text-xs font-semibold text-neutral-500 hover:text-neutral-800"
            >
              Cancelar
            </button>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-neutral-700">Nombre</span>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              required
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-neutral-700">Categoría</span>
            <select
              value={editForm.category}
              onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              required
            >
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-neutral-700">Ícono (emoji)</span>
            <input
              type="text"
              value={editForm.icon}
              onChange={(e) => setEditForm((f) => ({ ...f, icon: e.target.value }))}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              maxLength={4}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-neutral-700">Unidad de porción</span>
            <select
              value={editForm.servingUnit}
              onChange={(e) =>
                setEditForm((f) => ({
                  ...f,
                  servingUnit: e.target.value as typeof editForm.servingUnit,
                }))
              }
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
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
              value={editForm.foodType}
              onChange={(e) =>
                setEditForm((f) => ({
                  ...f,
                  foodType: e.target.value as typeof editForm.foodType,
                }))
              }
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
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
              Calorías ({SERVING_UNIT_LABELS[editForm.servingUnit]})
            </span>
            <input
              type="number"
              min={0.1}
              step={0.1}
              value={editForm.calories ?? ""}
              onChange={(e) =>
                setEditForm((f) => ({
                  ...f,
                  calories: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              placeholder="Ej. 120"
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              required
            />
          </label>

          <div className="grid gap-3 sm:gap-4 sm:col-span-2 sm:grid-cols-3">
            {MACRO_INPUTS.map(({ key, label }) => (
              <label key={key} className="flex flex-col gap-1">
                <span className="text-sm font-medium text-neutral-700">
                  {label} (opcional)
                </span>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={editForm[key] ?? ""}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      [key]: e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />
              </label>
            ))}
          </div>

          {editError && <p className="text-sm text-danger-600 sm:col-span-2">{editError}</p>}

          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={editSubmitting || editInvalid}
              className="btn-primary"
            >
              {editSubmitting ? "Guardando..." : "Guardar cambios"}
            </button>
            <button
              type="button"
              onClick={() => setEditingFood(null)}
              className="btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Listado de alimentos por categoría */}
      <div className="flex flex-col gap-6">
        {sortedCategories.map((category) => {
          const items = byCategory[category];
          const isSinCategoria = category === "Sin Categoría";

          return (
            <div key={category}>
              <div className="mb-2 flex items-center justify-between">
                <h2
                  className={`text-xs sm:text-sm font-semibold uppercase tracking-wide ${
                    isSinCategoria ? "text-amber-700" : "text-neutral-500"
                  }`}
                >
                  {category}
                  {isSinCategoria && (
                    <span className="ml-2 font-normal lowercase text-xs text-amber-600">
                      (puedes editarlos para asignarle una categoría)
                    </span>
                  )}
                </h2>
                <span className="text-xs text-neutral-400">
                  {items.length} {items.length === 1 ? "alimento" : "alimentos"}
                </span>
              </div>

              {/* Vista para pantallas móviles (cards) */}
              <div className="flex flex-col divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white shadow-sm sm:hidden">
                {items.map((food) => (
                  <div key={food.id} className="flex flex-col gap-2 p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl shrink-0">{food.icon}</span>
                        <span className="font-semibold text-neutral-800 truncate">{food.name}</span>
                      </div>
                      <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                        {FOOD_TYPE_LABELS[food.foodType]}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
                      <span>
                        <strong className="font-semibold text-neutral-800">{food.calories} kcal</strong>{" "}
                        {SERVING_UNIT_LABELS[food.servingUnit]}
                      </span>
                      {food.protein != null && (
                        <span className="text-neutral-400">
                          P {food.protein} · C {food.carbs ?? 0} · G {food.fat ?? 0}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-neutral-50">
                      {food.userId ? (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(food)}
                            className="px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(food.id, food.name)}
                            className="px-2.5 py-1 text-xs font-medium text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                          >
                            Eliminar
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-neutral-400">Catálogo global</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Vista para pantallas medianas y grandes (tabla) */}
              <div className="hidden sm:block overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-50 text-neutral-500">
                    <tr>
                      <th className="px-4 py-2 font-medium">Alimento</th>
                      <th className="px-4 py-2 font-medium">Tipo</th>
                      <th className="px-4 py-2 font-medium">Calorías</th>
                      <th className="px-4 py-2 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {items.map((food) => (
                      <tr key={food.id} className="hover:bg-neutral-50/50">
                        <td className="flex items-center gap-2 px-4 py-2.5">
                          <span className="text-lg shrink-0">{food.icon}</span>
                          <span className="font-medium text-neutral-800">{food.name}</span>
                        </td>
                        <td className="px-4 py-2.5 text-neutral-600">
                          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                            {FOOD_TYPE_LABELS[food.foodType]}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-neutral-600">
                          <span className="font-medium text-neutral-800">{food.calories} kcal</span>{" "}
                          <span className="text-neutral-500">{SERVING_UNIT_LABELS[food.servingUnit]}</span>
                          {food.protein != null && (
                            <span className="block text-xs text-neutral-400">
                              P {food.protein} · C {food.carbs ?? 0} · G {food.fat ?? 0}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          {food.userId ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => startEdit(food)}
                                className="px-2 py-1 text-xs font-semibold text-brand-700 hover:underline"
                              >
                                Editar
                              </button>
                              <span className="text-neutral-300">·</span>
                              <button
                                type="button"
                                onClick={() => handleDelete(food.id, food.name)}
                                className="px-2 py-1 text-xs font-medium text-danger-600 hover:underline"
                              >
                                Eliminar
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-neutral-400">Catálogo</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
