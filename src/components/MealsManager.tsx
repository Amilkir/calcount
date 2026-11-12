"use client";

import { CloseIcon } from "./icons";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Food } from "@/lib/types";
import {
  DEFAULT_MEAL_ICON,
  MAX_MEAL_ITEMS,
  MAX_SERVINGS,
  MIN_SERVINGS,
  entryCalories,
  formatQuantity,
  templateCalories,
  type MealTemplateWithItems,
} from "@/lib/meals";
import FoodPicker from "./FoodPicker";

const INPUT_CLASS = "rounded-lg border border-neutral-300 px-3 py-2 text-sm";

// "" = fila nueva sin alimento elegido; null = cantidad vacía.
interface ItemRow {
  foodId: string;
  quantity: number | null;
}

interface MealForm {
  id: string | null;
  name: string;
  icon: string;
  portionable: boolean;
  /** Porciones que rinde la receta; null = campo vacío. */
  servings: number | null;
  items: ItemRow[];
}

const EMPTY_FORM: MealForm = {
  id: null,
  name: "",
  icon: DEFAULT_MEAL_ICON,
  portionable: false,
  servings: null,
  items: [{ foodId: "", quantity: null }],
};

const validServings = (n: number | null) =>
  n != null && Number.isInteger(n) && n >= MIN_SERVINGS && n <= MAX_SERVINGS;

export default function MealsManager({
  foods,
  meals,
}: {
  foods: Food[];
  meals: MealTemplateWithItems[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<MealForm | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const foodsById = useMemo(() => new Map(foods.map((f) => [f.id, f])), [foods]);

  const incomplete =
    form != null &&
    (!form.name.trim() ||
      form.items.length === 0 ||
      form.items.some((i) => i.foodId === "" || i.quantity == null || i.quantity <= 0) ||
      (form.portionable && !validServings(form.servings)));

  const formCalories = (form?.items ?? []).reduce((sum, item) => {
    const food = foodsById.get(item.foodId);
    return food && item.quantity ? sum + entryCalories(food, item.quantity) : sum;
  }, 0);

  function updateItem(index: number, change: Partial<ItemRow>) {
    setForm((f) =>
      f && { ...f, items: f.items.map((item, i) => (i === index ? { ...item, ...change } : item)) }
    );
  }

  function startEdit(meal: MealTemplateWithItems) {
    setError(null);
    setForm({
      id: meal.id,
      name: meal.name,
      icon: meal.icon,
      portionable: meal.servings != null,
      servings: meal.servings,
      items: meal.items.map((i) => ({ foodId: i.foodId, quantity: i.quantity })),
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setError(null);
    if (incomplete) {
      setError(
        form.portionable && !validServings(form.servings)
          ? `Indica cuántas porciones rinde (un número entero entre ${MIN_SERVINGS} y ${MAX_SERVINGS}).`
          : "Completa el nombre y elige un alimento y una cantidad en cada fila."
      );
      return;
    }

    setSubmitting(true);
    const res = await fetch(form.id ? `/api/meals/${form.id}` : "/api/meals", {
      method: form.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        icon: form.icon,
        servings: form.portionable ? form.servings : null,
        items: form.items,
      }),
    }).catch(() => null);
    setSubmitting(false);

    if (!res?.ok) {
      const data = await res?.json().catch(() => null);
      setError(data?.error ?? "No se pudo guardar la comida.");
      return;
    }
    setForm(null);
    router.refresh();
  }

  async function handleDelete(meal: MealTemplateWithItems) {
    if (!confirm(`¿Eliminar la comida "${meal.name}"? Lo que ya registraste en tus días no cambia.`)) {
      return;
    }
    const res = await fetch(`/api/meals/${meal.id}`, { method: "DELETE" });
    if (res.ok) {
      if (form?.id === meal.id) setForm(null);
      router.refresh();
    } else {
      alert("No se pudo eliminar la comida.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs sm:text-sm text-neutral-500">
          Guarda lo que comes seguido para cargarlo de una vez desde el panel del día.
        </p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setForm(form ? null : EMPTY_FORM);
          }}
          className="btn-primary shrink-0"
        >
          {form ? "Cancelar" : "+ Nueva comida"}
        </button>
      </div>

      {form && (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-sm"
        >
          <h2 className="font-semibold text-neutral-800">
            {form.id ? "Editar comida" : "Nueva comida"}
          </h2>

          <div className="grid gap-3 sm:gap-4 sm:grid-cols-[1fr_8rem]">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-neutral-700">Nombre</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej. Desayuno típico"
                maxLength={80}
                className={INPUT_CLASS}
                required
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-neutral-700">Ícono (emoji)</span>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                maxLength={4}
                className={INPUT_CLASS}
              />
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-neutral-700">Alimentos</span>
            {form.items.map((item, index) => {
              const food = foodsById.get(item.foodId);
              return (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-neutral-100 p-2 sm:border-none sm:p-0"
                >
                  <FoodPicker
                    foods={foods}
                    value={item.foodId}
                    label={`Alimento ${index + 1}`}
                    onChange={(next) =>
                      updateItem(index, {
                        foodId: next.id,
                        // Se propone una porción típica si no había cantidad; se puede editar.
                        quantity: item.quantity ?? (next.servingUnit === "UNIT" ? 1 : 100),
                      })
                    }
                    className="w-full sm:min-w-0 sm:flex-1 sm:basis-48"
                  />
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <label className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0.1}
                        step="any"
                        value={item.quantity ?? ""}
                        onChange={(e) =>
                          updateItem(index, {
                            quantity: e.target.value === "" ? null : Number(e.target.value),
                          })
                        }
                        aria-label={`Cantidad del alimento ${index + 1}`}
                        className={`${INPUT_CLASS} w-20 sm:w-24`}
                        required
                      />
                      <span className="w-5 sm:w-6 text-xs sm:text-sm text-neutral-500">
                        {food?.servingUnit === "UNIT" ? "u" : "g"}
                      </span>
                    </label>
                    <span className="w-14 sm:w-16 text-right text-xs sm:text-sm text-neutral-500 tabular-nums">
                      {food && item.quantity ? `${Math.round(entryCalories(food, item.quantity))} kcal` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== index) })}
                      aria-label={`Quitar alimento ${index + 1}`}
                      className="flex h-9 w-9 sm:min-h-11 sm:min-w-11 items-center justify-center rounded-full text-neutral-500 hover:bg-danger-50 hover:text-danger-600"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                </div>
              );
            })}
            {form.items.length < MAX_MEAL_ITEMS && (
              <button
                type="button"
                onClick={() =>
                  setForm({ ...form, items: [...form.items, { foodId: "", quantity: null }] })
                }
                className="btn-secondary self-start"
              >
                + Añadir alimento
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-neutral-100 bg-neutral-50 p-3">
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
              <input
                type="checkbox"
                checked={form.portionable}
                onChange={(e) => setForm({ ...form, portionable: e.target.checked })}
                className="h-4 w-4 shrink-0 accent-brand-600"
              />
              ¿Es una comida porcionable?
            </label>
            <p className="text-xs text-neutral-500">
              Para recetas que rinden varias porciones (por ejemplo, 6 pancakes). Al cargarla solo
              indicas cuántas porciones comiste.
            </p>
            {form.portionable && (
              <label className="flex flex-wrap items-center gap-2 text-sm text-neutral-700">
                ¿Cuántas porciones rinde?
                <input
                  type="number"
                  min={MIN_SERVINGS}
                  max={MAX_SERVINGS}
                  step={1}
                  inputMode="numeric"
                  value={form.servings ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      servings: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  className={`${INPUT_CLASS} w-20`}
                  required
                />
              </label>
            )}
          </div>

          <p className="text-sm text-neutral-600">
            Total: <span className="font-semibold text-neutral-900">{Math.round(formCalories)} kcal</span>
            {form.portionable && validServings(form.servings) && (
              <span>
                {" "}
                · <span className="font-semibold text-neutral-900">
                  {Math.round(formCalories / form.servings!)} kcal
                </span>{" "}
                por porción
              </span>
            )}
          </p>

          {error && <p className="text-sm text-danger-600">{error}</p>}

          <button type="submit" disabled={submitting || incomplete} className="btn-primary self-start">
            {submitting ? "Guardando..." : form.id ? "Guardar cambios" : "Guardar comida"}
          </button>
        </form>
      )}

      {meals.length === 0 && !form ? (
        <p className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
          Todavía no tienes comidas guardadas. Crea una, por ejemplo «Desayuno típico» con 3 huevos,
          2 fajitas y 50 g de palta.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {meals.map((meal) => (
            <div
              key={meal.id}
              className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 font-semibold text-neutral-800 truncate">
                  <span className="text-xl shrink-0">{meal.icon}</span>
                  <span className="truncate">{meal.name}</span>
                </h3>
                <span className="shrink-0 whitespace-nowrap text-xs sm:text-sm font-semibold text-neutral-600">
                  {Math.round(templateCalories(meal))} kcal
                </span>
              </div>
              {meal.servings != null && (
                <p className="self-start rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-800">
                  Rinde {meal.servings} porciones ·{" "}
                  {Math.round(templateCalories(meal) / meal.servings)} kcal por porción
                </p>
              )}
              <ul className="flex flex-col divide-y divide-neutral-100 text-sm">
                {meal.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-2 py-1 text-xs sm:text-sm">
                    <span className="text-neutral-700 truncate">
                      {item.food.icon} {item.food.name}
                      <span className="text-neutral-500"> · {formatQuantity(item.food, item.quantity)}</span>
                    </span>
                    <span className="shrink-0 whitespace-nowrap text-neutral-500">
                      {Math.round(entryCalories(item.food, item.quantity))} kcal
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-3 pt-1 border-t border-neutral-50">
                <button
                  type="button"
                  onClick={() => startEdit(meal)}
                  className="p-1 text-xs font-semibold text-brand-700 hover:underline"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(meal)}
                  className="p-1 text-xs font-medium text-danger-600 hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
