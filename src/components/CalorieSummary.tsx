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
    <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-md shadow-brand-600/5">
      <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-neutral-500">Calorías restantes hoy</p>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span
              className={`font-display text-4xl sm:text-5xl font-semibold tabular-nums ${
                over ? "text-danger-600" : "text-lagoon-700"
              }`}
            >
              {remaining}
            </span>
            <span className="text-base sm:text-lg font-normal text-neutral-500">kcal</span>
            {over && (
              <span className="rounded-full bg-danger-50 px-2 py-0.5 text-xs font-semibold text-danger-600">
                excedido
              </span>
            )}
          </div>
        </div>
        <div className="text-right text-xs sm:text-sm text-neutral-500">
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
          className={`h-full rounded-full transition-all ${over ? "bg-danger-500" : "bg-lagoon-500"}`}
          style={{ width: `${over ? 100 : percent}%` }}
        />
      </div>
    </div>
  );
}
