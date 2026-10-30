import type { CalorieTargets } from "@/lib/calories";
import { sumDayMacros } from "@/lib/macros";
import type { FoodEntryWithFood } from "@/lib/types";

const BARS = [
  { key: "protein", goalKey: "proteinG", label: "Proteína", color: "#ff5d7a" },
  { key: "carbs", goalKey: "carbsG", label: "Carbohidratos", color: "#4c8df6" },
  { key: "fat", goalKey: "fatG", label: "Grasa", color: "#ffb020" },
] as const;

export default function TargetsPanel({
  targets,
  entries,
}: {
  targets: CalorieTargets;
  entries: FoodEntryWithFood[];
}) {
  const day = sumDayMacros(entries);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        Macros objetivo del día
      </p>

      <div className="flex flex-col gap-3">
        {BARS.map((bar) => {
          const goal = targets.macros[bar.goalKey];
          const consumed = Math.round(day[bar.key]);
          const percent = goal > 0 ? Math.min(100, (consumed / goal) * 100) : 0;
          return (
            <div key={bar.key}>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-700">{bar.label}</span>
                <span className="text-neutral-500">
                  {consumed} / {goal} g
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${percent}%`, backgroundColor: bar.color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {(day.estimated || day.otherKcal > 0) && (
        <p className="text-xs text-neutral-500">
          {day.estimated && "Algunos alimentos no tienen macros guardados y se estimaron por su tipo. "}
          {day.otherKcal > 0 &&
            `${Math.round(day.otherKcal)} kcal de registros libres no se cuentan en los macros.`}
        </p>
      )}

      <dl className="grid grid-cols-2 gap-3 border-t border-neutral-100 pt-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-neutral-500">Metabolismo basal</dt>
          <dd className="font-semibold text-neutral-800">{targets.bmr} kcal</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">
            Mantenimiento{targets.maintenanceSource === "adaptive" ? " (ajustado)" : ""}
          </dt>
          <dd className="font-semibold text-neutral-800">{targets.maintenanceCalories} kcal</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">Agua recomendada</dt>
          <dd className="font-semibold text-neutral-800">
            {(targets.waterMl / 1000).toFixed(2)} L
          </dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">Ritmo estimado</dt>
          <dd className="font-semibold text-neutral-800">
            {targets.weeklyChangeKg > 0 ? "+" : ""}
            {targets.weeklyChangeKg} kg/sem
          </dd>
        </div>
      </dl>

      {targets.weeksToTarget != null && targets.weeksToTarget > 0 && (
        <p className="text-sm text-neutral-600">
          Peso objetivo en ~{targets.weeksToTarget} semanas a este ritmo.
        </p>
      )}

      {targets.warnings.map((w) => (
        <p key={w} className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
          ⚠ {w}
        </p>
      ))}
      {targets.notes.map((n) => (
        <p key={n} className="text-xs text-neutral-500">
          {n}
        </p>
      ))}
    </div>
  );
}
