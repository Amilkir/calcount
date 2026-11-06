import { CheckIcon, DropIcon } from "./icons";
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
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white/70 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 font-semibold text-neutral-800">
          <DropIcon className="text-water-500" />
          Hidratación
        </h3>
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
            reached ? "bg-lagoon-100 text-lagoon-700" : "bg-water-50 text-water-700"
          }`}
        >
          {reached ? (
            <>
              <CheckIcon size={12} /> Meta alcanzada
            </>
          ) : (
            `Faltan ${liters(remaining)} L`
          )}
        </span>
      </div>

      <p className="text-2xl font-bold text-water-700">
        {liters(waterMl)}
        <span className="ml-1 text-sm font-normal text-neutral-500">/ {liters(goalMl)} L</span>
      </p>

      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className={`h-full rounded-full transition-all ${reached ? "bg-lagoon-500" : "bg-water-500"}`}
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
                  ? "border-water-500 bg-water-400"
                  : "border-water-200 bg-white hover:bg-water-50"
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
