import type { FoodEntryWithFood } from "@/lib/types";

export default function MealSlotSection({
  label,
  entries,
  onAdd,
  onDelete,
}: {
  label: string;
  entries: FoodEntryWithFood[];
  onAdd: () => void;
  onDelete: (id: string) => void;
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
            <li key={entry.id} className="flex items-center justify-between gap-2 py-1.5 text-sm">
              <span className="flex items-center gap-2 text-neutral-700">
                <span className="text-lg">{entry.food ? entry.food.icon : "📝"}</span>
                <span>
                  {entry.food ? entry.food.name : entry.freeDescription}
                  {entry.food && (
                    <span className="text-neutral-500">
                      {" "}
                      · {entry.quantity}
                      {entry.food.servingUnit === "UNIT" ? " u" : " g"}
                    </span>
                  )}
                </span>
              </span>
              <span className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-neutral-500">{Math.round(entry.calories)} kcal</span>
                <button
                  onClick={() => onDelete(entry.id)}
                  aria-label={`Eliminar ${entry.food ? entry.food.name : entry.freeDescription}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:text-red-600"
                >
                  ✕
                </button>
              </span>
            </li>
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
