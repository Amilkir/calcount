"use client";

import type { StatsDay } from "@/lib/stats-types";
import { ON_TARGET_PCT } from "@/lib/stats-types";
import { MACRO_COLORS, MACRO_NAMES, fmt, macroAccuracy } from "@/lib/stats-calc";
import { AXIS_TEXT, ChartCard, GRID, hbarPath, useChartWidth } from "./chart-kit";

const ROW_H = 46;
const BAR_H = 16;
const M = { top: 8, right: 52, bottom: 22, left: 104 };

/** % promedio alcanzado de cada macro respecto de su meta, con la meta marcada en el 100 %. */
export default function MacroAccuracyChart({ days }: { days: StatsDay[] }) {
  const { ref, width } = useChartWidth<HTMLDivElement>();
  const acc = macroAccuracy(days);

  if (acc.logged === 0) {
    return (
      <ChartCard title="Cumplimiento de macros">
        <p className="text-sm text-neutral-500">No hay días registrados en este rango.</p>
      </ChartCard>
    );
  }

  const maxPct = Math.max(1.5, ...acc.perMacro.map((m) => m.avgPct));
  const plotW = width - M.left - M.right;
  const x = (pct: number) => M.left + (pct / maxPct) * plotW;
  const H = M.top + ROW_H * acc.perMacro.length + M.bottom;
  const ticks = [0, 0.5, 1, 1.5, 2].filter((t) => t <= maxPct);

  return (
    <ChartCard
      title="Cumplimiento de macros"
      subtitle="Promedio de lo que comiste de cada macro respecto de su meta (la línea marca el 100 %)."
    >
      <div ref={ref}>
        <svg width={width} height={H} role="img" aria-label="Porcentaje promedio de cada macro respecto de su meta">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={M.top} y2={H - M.bottom} stroke={GRID} strokeWidth={1} />
              <text x={x(t)} y={H - 6} textAnchor="middle" fontSize={11} fill={AXIS_TEXT}>
                {fmt(t * 100)} %
              </text>
            </g>
          ))}
          {acc.perMacro.map((m, i) => {
            const top = M.top + ROW_H * i + (ROW_H - BAR_H) / 2 - 6;
            return (
              <g key={m.key}>
                <text x={M.left - 8} y={top + BAR_H / 2} dy="0.32em" textAnchor="end" fontSize={12} fill="var(--color-neutral-700)">
                  {MACRO_NAMES[m.key]}
                </text>
                <path d={hbarPath(M.left, x(m.avgPct), top, BAR_H)} fill={MACRO_COLORS[m.key]} />
                <text x={x(m.avgPct) + 6} y={top + BAR_H / 2} dy="0.32em" fontSize={12} fontWeight={600} fill="var(--color-neutral-800)">
                  {fmt(m.avgPct * 100)} %
                </text>
                <text x={M.left} y={top + BAR_H + 13} fontSize={11} fill={AXIS_TEXT}>
                  {fmt(m.avgGrams)} de {fmt(m.avgTarget)} g · en meta {m.onTarget} de {acc.logged} días
                </text>
              </g>
            );
          })}
          {/* Meta (100 %) */}
          <line
            x1={x(1)}
            x2={x(1)}
            y1={M.top - 4}
            y2={H - M.bottom}
            stroke="var(--color-neutral-800)"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </svg>
      </div>
      <p className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-700">
        Tus calorías estuvieron en meta <span className="font-semibold">{acc.caloriesOn}</span> de{" "}
        {acc.logged} días, y los tres macros a la vez (±{ON_TARGET_PCT * 100} %) solo{" "}
        <span className="font-semibold">{acc.allMacrosOn}</span>.
        {acc.caloriesOn > acc.allMacrosOn &&
          " Cerrar las calorías no siempre significa cerrar los macros: mira cuál se queda más lejos."}
      </p>
    </ChartCard>
  );
}
