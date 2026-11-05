const GLASS_ML = 250;
const MAX_GLASSES = 16;

const liters = (ml: number) => (ml / 1000).toFixed(2);

export default function HydrationCard({
  waterMl,
  goalMl,
  onChange,
}: {
  waterMl: number;
  goalMl: number;
  onChange: (waterMl: number) => void;
}) {
  const reached = goalMl > 0 && waterMl >= goalMl;
  const percent = goalMl > 0 ? Math.min(100, (waterMl / goalMl) * 100) : 0;
  const glasses = Math.min(MAX_GLASSES, Math.max(1, Math.ceil(goalMl / GLASS_ML)));
  const filled = Math.floor(waterMl / GLASS_ML);
  const remaining = Math.max(0, goalMl - waterMl);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-neutral-800">💧 Hidratación</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            reached ? "bg-emerald-100 text-emerald-700" : "bg-sky-50 text-sky-700"
          }`}
        >
          {reached ? "✓ Meta alcanzada" : `Faltan ${liters(remaining)} L`}
        </span>
      </div>

      <p className="text-2xl font-bold text-sky-700">
        {liters(waterMl)}
        <span className="ml-1 text-sm font-normal text-neutral-500">/ {liters(goalMl)} L</span>
      </p>

      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className={`h-full rounded-full transition-all ${reached ? "bg-emerald-500" : "bg-sky-500"}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Cada vaso son 250 ml: tocar un vaso fija el total hasta él; tocar el último lleno lo vacía. */}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Vasos de agua">
        {Array.from({ length: glasses }, (_, i) => {
          const isFilled = i < filled;
          return (
            <button
              type="button"
              key={i}
              onClick={() => onChange(i + 1 === filled ? i * GLASS_ML : (i + 1) * GLASS_ML)}
              aria-label={`${i + 1} ${i === 0 ? "vaso" : "vasos"} (${(i + 1) * GLASS_ML} ml)`}
              aria-pressed={isFilled}
              className={`h-9 w-7 rounded-b-lg rounded-t-sm border-2 transition-colors ${
                isFilled
                  ? "border-sky-500 bg-sky-400"
                  : "border-sky-200 bg-white hover:bg-sky-50"
              }`}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, waterMl - GLASS_ML))}
          disabled={waterMl === 0}
          className="btn-secondary"
        >
          − 250 ml
        </button>
        <button type="button" onClick={() => onChange(waterMl + GLASS_ML)} className="btn-secondary">
          + Vaso (250 ml)
        </button>
        <button type="button" onClick={() => onChange(waterMl + 500)} className="btn-secondary">
          + Botella (500 ml)
        </button>
      </div>
    </div>
  );
}
