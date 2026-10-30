import { FOOD_TYPE_LABELS } from "@/lib/labels";
import type { FoodEntryWithFood } from "@/lib/types";
import { entryMacros } from "@/lib/macros";

type MacroKey = "CARBOHIDRATOS" | "PROTEINAS" | "GRASAS" | "OTROS";

const MACRO_ORDER: MacroKey[] = ["CARBOHIDRATOS", "PROTEINAS", "GRASAS", "OTROS"];

const MACRO_COLORS: Record<MacroKey, string> = {
  CARBOHIDRATOS: "#4c8df6",
  PROTEINAS: "#ff5d7a",
  GRASAS: "#ffb020",
  OTROS: "#898781",
};

const MACRO_LABELS: Record<MacroKey, string> = {
  CARBOHIDRATOS: FOOD_TYPE_LABELS.CARBOHIDRATOS,
  PROTEINAS: FOOD_TYPE_LABELS.PROTEINAS,
  GRASAS: FOOD_TYPE_LABELS.GRASAS,
  OTROS: "Otros",
};

const SIZE = 160;
const RADIUS = SIZE / 2;
const CENTER = SIZE / 2;
const LABEL_MIN_PERCENT = 8;

function pointOnCircle(angle: number) {
  return { x: CENTER + RADIUS * Math.cos(angle), y: CENTER + RADIUS * Math.sin(angle) };
}

function slicePath(startAngle: number, endAngle: number): string {
  const start = pointOnCircle(startAngle);
  const end = pointOnCircle(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

export default function MacroPieChart({ entries }: { entries: FoodEntryWithFood[] }) {
  const totals: Record<MacroKey, number> = {
    CARBOHIDRATOS: 0,
    PROTEINAS: 0,
    GRASAS: 0,
    OTROS: 0,
  };
  for (const entry of entries) {
    const m = entryMacros(entry);
    if (m.kind === "other") {
      totals.OTROS += entry.calories;
    } else {
      totals.PROTEINAS += m.protein * 4;
      totals.CARBOHIDRATOS += m.carbs * 4;
      totals.GRASAS += m.fat * 9;
    }
  }
  const total = MACRO_ORDER.reduce((sum, key) => sum + totals[key], 0);

  const slices = MACRO_ORDER.filter((key) => totals[key] > 0).map((key) => ({
    key,
    calories: totals[key],
    percent: total > 0 ? (totals[key] / total) * 100 : 0,
  }));

  const drawnSlices = slices.reduce<
    Array<(typeof slices)[number] & { endAngle: number; path: string; labelPoint: { x: number; y: number } }>
  >(
    (acc, slice) => {
      const cursor = acc.length > 0 ? acc[acc.length - 1].endAngle : -Math.PI / 2;
      const sliceAngle = (slice.percent / 100) * Math.PI * 2;
      const endAngle = cursor + sliceAngle;
      const midAngle = (cursor + endAngle) / 2;
      acc.push({
        ...slice,
        endAngle,
        path: slicePath(cursor, endAngle),
        labelPoint: {
          x: CENTER + RADIUS * 0.65 * Math.cos(midAngle),
          y: CENTER + RADIUS * 0.65 * Math.sin(midAngle),
        },
      });
      return acc;
    },
    []
  );

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        Macronutrientes del día
      </p>

      {total === 0 ? (
        <p className="mt-6 text-center text-sm text-neutral-500">
          Todavía no hay registros este día.
        </p>
      ) : (
        <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row sm:justify-around">
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Distribución de macronutrientes del día">
            {drawnSlices.map((slice) => (
              <path
                key={slice.key}
                d={slice.path}
                fill={MACRO_COLORS[slice.key]}
                stroke="#fcfcfb"
                strokeWidth={2}
              />
            ))}
            {drawnSlices
              .filter((slice) => slice.percent >= LABEL_MIN_PERCENT)
              .map((slice) => (
                <text
                  key={slice.key}
                  x={slice.labelPoint.x}
                  y={slice.labelPoint.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={12}
                  fontWeight={600}
                  fill="#ffffff"
                  stroke="rgba(11,11,11,0.45)"
                  strokeWidth={3}
                  paintOrder="stroke"
                >
                  {Math.round(slice.percent)}%
                </text>
              ))}
          </svg>

          <ul className="flex flex-col gap-1.5 text-sm">
            {slices.map((slice) => (
              <li key={slice.key} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: MACRO_COLORS[slice.key] }}
                />
                <span className="text-neutral-700">{MACRO_LABELS[slice.key]}</span>
                <span className="text-neutral-500">
                  {Math.round(slice.percent)}% · {Math.round(slice.calories)} kcal
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
