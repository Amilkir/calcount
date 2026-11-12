"use client";

import { useState } from "react";
import type { StatsDay } from "@/lib/stats-types";
import {
  EXCESS_KEYS,
  EXCESS_NAMES,
  MACRO_COLORS,
  excessBreakdown,
  excessTotals,
  fmt,
  longDay,
  niceMax,
  shortDay,
} from "@/lib/stats-calc";
import { CheckIcon } from "../icons";
import {
  AXIS_TEXT,
  ChartCard,
  ChartTooltip,
  GRID,
  Legend,
  labelEvery,
  niceTicks,
  useChartWidth,
  type TooltipState,
} from "./chart-kit";

const H = 200;
const M = { top: 18, right: 8, bottom: 26, left: 44 };
const GAP = 2;

/** En los días que te pasaste: cuánto del exceso vino de cada macro y de los cheat meals. */
export default function ExcessChart({ days }: { days: StatsDay[] }) {
  const { ref, width } = useChartWidth<HTMLDivElement>();
  const [tip, setTip] = useState<TooltipState | null>(null);
  const { overDays, totals, total } = excessTotals(days);

  const legend = EXCESS_KEYS.map((k) => ({
    label: `${EXCESS_NAMES[k]}${total > 0 ? ` · ${fmt((totals[k] / total) * 100)} %` : ""}`,
    color: MACRO_COLORS[k],
  }));

  if (overDays.length === 0) {
    return (
      <ChartCard title="¿De dónde vienen los excesos?">
        <p className="flex items-center gap-2 text-sm text-neutral-600">
          <CheckIcon className="text-lagoon-600" /> Ningún día de este rango pasaste tu meta por más del 10 %.
        </p>
      </ChartCard>
    );
  }

  const max = niceMax(Math.max(...overDays.map((d) => excessBreakdown(d).total)));
  const plotW = width - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const y = (v: number) => M.top + plotH - (v / max) * plotH;
  const slot = plotW / overDays.length;
  const barW = Math.min(24, slot * 0.6);
  const every = labelEvery(overDays.length, plotW);

  return (
    <ChartCard
      title="¿De dónde vienen los excesos?"
      subtitle={`En los ${overDays.length} ${overDays.length === 1 ? "día" : "días"} que te pasaste más del 10 % (${fmt(total)} kcal de más en total): cuánto vino de cada macro por encima de su meta y de los cheat meals.`}
    >
      {/* Proporción total del exceso */}
      <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded">
        {EXCESS_KEYS.filter((k) => totals[k] > 0).map((k) => (
          <span key={k} style={{ width: `${(totals[k] / total) * 100}%`, background: MACRO_COLORS[k] }} />
        ))}
      </div>
      <Legend items={legend} />

      <div ref={ref} className="relative" onMouseLeave={() => setTip(null)}>
        <svg width={width} height={H} role="img" aria-label="Exceso de calorías por día, separado por origen">
          {niceTicks(0, max, 4).map((t) => (
            <g key={t}>
              <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
              <text x={M.left - 6} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={AXIS_TEXT}>
                {fmt(t)}
              </text>
            </g>
          ))}
          {overDays.map((d, i) => {
            const cx = M.left + slot * i + slot / 2;
            const { total: dayTotal, parts } = excessBreakdown(d);
            const segments = EXCESS_KEYS.filter((k) => parts[k] > 0);
            let acc = 0;
            return (
              <g key={d.date}>
                {segments.map((k, s) => {
                  const y0 = y(acc);
                  acc += parts[k];
                  const isTop = s === segments.length - 1;
                  // 2 px de separación entre segmentos; solo la punta superior va redondeada.
                  const y1 = y(acc) + (isTop || y0 - y(acc) <= GAP + 1 ? 0 : GAP);
                  const h = Math.max(0, y0 - y1);
                  return isTop ? (
                    <path
                      key={k}
                      d={`M${cx - barW / 2},${y0}V${y1 + 4}Q${cx - barW / 2},${y1} ${cx - barW / 2 + 4},${y1}H${cx + barW / 2 - 4}Q${cx + barW / 2},${y1} ${cx + barW / 2},${y1 + 4}V${y0}Z`}
                      fill={MACRO_COLORS[k]}
                    />
                  ) : (
                    <rect key={k} x={cx - barW / 2} y={y1} width={barW} height={h} fill={MACRO_COLORS[k]} />
                  );
                })}
                {i % every === 0 && (
                  <text x={cx} y={H - 8} textAnchor="middle" fontSize={11} fill={AXIS_TEXT}>
                    {shortDay(d.date)}
                  </text>
                )}
                <text x={cx} y={y(dayTotal) - 5} textAnchor="middle" fontSize={10} fill="var(--color-neutral-600)">
                  {overDays.length <= 14 ? `+${fmt(dayTotal)}` : ""}
                </text>
                <rect
                  x={M.left + slot * i}
                  y={M.top}
                  width={slot}
                  height={plotH}
                  fill="transparent"
                  onMouseEnter={() =>
                    setTip({
                      x: cx,
                      y: y(dayTotal),
                      content: (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold capitalize text-neutral-800">{longDay(d.date)}</span>
                          <span>+{fmt(dayTotal)} kcal sobre la meta</span>
                          {EXCESS_KEYS.filter((k) => parts[k] > 0).map((k) => (
                            <span key={k} className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-sm" style={{ background: MACRO_COLORS[k] }} />
                              {EXCESS_NAMES[k]}: {fmt(parts[k])} kcal
                            </span>
                          ))}
                        </div>
                      ),
                    })
                  }
                />
              </g>
            );
          })}
        </svg>
        <ChartTooltip tip={tip} width={width} />
      </div>
    </ChartCard>
  );
}
