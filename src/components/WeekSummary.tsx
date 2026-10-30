function dayLabel(dateKey: string): { weekday: string; day: number } {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = date.toLocaleDateString("es-ES", { weekday: "short" }).replace(".", "");
  return { weekday, day };
}

export default function WeekSummary({
  weekDates,
  dailyTotals,
  goalCalories,
  selectedDate,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
}: {
  weekDates: string[];
  dailyTotals: Record<string, number>;
  goalCalories: number;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onPrevWeek}
          aria-label="Semana anterior"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-neutral-500 hover:bg-brand-50 hover:text-brand-700"
        >
          ◀
        </button>
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Resumen semanal
        </p>
        <button
          type="button"
          onClick={onNextWeek}
          aria-label="Semana siguiente"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-neutral-500 hover:bg-brand-50 hover:text-brand-700"
        >
          ▶
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1.5 sm:gap-2">
        {weekDates.map((dateKey) => {
          const { weekday, day } = dayLabel(dateKey);
          const calories = dailyTotals[dateKey];
          const hasEntries = calories !== undefined && calories > 0;
          const over = hasEntries && calories > goalCalories;
          const isSelected = dateKey === selectedDate;

          return (
            <button
              type="button"
              key={dateKey}
              onClick={() => onSelectDate(dateKey)}
              className={`flex flex-col items-center gap-1 rounded-2xl border px-1 py-2.5 text-center transition-colors ${
                isSelected
                  ? "border-brand-600 bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-md shadow-brand-600/30"
                  : "border-neutral-200 bg-white hover:border-brand-300 hover:bg-brand-50"
              }`}
            >
              <span
                className={`text-[10px] font-medium uppercase ${
                  isSelected ? "text-brand-100" : "text-neutral-500"
                }`}
              >
                {weekday}
              </span>
              <span className={`text-sm font-semibold ${isSelected ? "text-white" : "text-neutral-800"}`}>
                {day}
              </span>
              <span
                className={`text-[11px] font-medium ${
                  !hasEntries
                    ? isSelected
                      ? "text-brand-100"
                      : "text-neutral-500"
                    : over
                    ? isSelected
                      ? "text-red-300"
                      : "text-red-600"
                    : isSelected
                    ? "text-emerald-300"
                    : "text-emerald-600"
                }`}
              >
                {hasEntries ? Math.round(calories) : "–"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
