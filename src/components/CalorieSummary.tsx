export default function CalorieSummary({
  consumed,
  goalCalories,
}: {
  consumed: number;
  goalCalories: number;
}) {
  const remaining = Math.round(goalCalories - consumed);
  const percent = goalCalories > 0 ? Math.min(100, Math.round((consumed / goalCalories) * 100)) : 0;
  const over = remaining < 0;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500">Calorías restantes hoy</p>
          <p
            className={`text-4xl font-bold ${over ? "text-red-600" : "text-emerald-700"}`}
          >
            {over ? `${remaining} (excedido)` : remaining}
            <span className="ml-1 text-lg font-normal text-neutral-500">kcal</span>
          </p>
        </div>
        <div className="text-right text-sm text-neutral-500">
          <p>
            Consumido: <span className="font-semibold text-neutral-800">{Math.round(consumed)}</span> kcal
          </p>
          <p>
            Meta: <span className="font-semibold text-neutral-800">{Math.round(goalCalories)}</span> kcal
          </p>
        </div>
      </div>
      <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className={`h-full rounded-full transition-all ${over ? "bg-red-500" : "bg-emerald-500"}`}
          style={{ width: `${over ? 100 : percent}%` }}
        />
      </div>
    </div>
  );
}
