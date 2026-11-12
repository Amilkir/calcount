"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { StatsDay } from "@/lib/stats-types";
import { ON_TARGET_PCT } from "@/lib/stats-types";
import { dayStatus, deviation, fmt, longDay, shortDay, signed, type DayStatus } from "@/lib/stats-calc";
import { SPORT_LABELS } from "@/lib/sports";
import {
  AXIS_TEXT,
  ChartCard,
  ChartTooltip,
  GRID,
  Legend,
  barPath,
  labelEvery,
  useChartWidth,
  type TooltipState,
} from "./chart-kit";

const STATUS_COLOR: Record<DayStatus, string> = {
  over: "var(--color-brand-500)",
  on: "var(--color-lagoon-500)",
  under: "var(--color-water-500)",
};

const H = 220;
const M = { top: 14, right: 8, bottom: 26, left: 44 };

/** Cuánto se alejó cada día de su meta, en % (arriba = te pasaste, abajo = te faltó). */
export default function CaloriesChart({ days, profileId }: { days: StatsDay[]; profileId: string }) {
  const router = useRouter();
  const { ref, width } = useChartWidth<HTMLDivElement>();
  const [tip, setTip] = useState<TooltipState | null>(null);

  const plotW = width - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const devs = days.filter((d) => d.logged).map((d) => Math.abs(deviation(d)));
  // Escala simétrica, en pasos de 10 %, con un mínimo de ±30 % y un tope de ±100 %.
  const limit = Math.min(1, Math.max(0.3, Math.ceil(Math.max(0, ...devs) * 10) / 10));
  const y = (v: number) => M.top + plotH / 2 - (Math.max(-limit, Math.min(limit, v)) / limit) * (plotH / 2);
  const slot = plotW / days.length;
  const barW = Math.min(24, slot * 0.6);
  const every = labelEvery(days.length, plotW);
  const ticks = [-limit, -limit / 2, 0, limit / 2, limit];

  return (
    <ChartCard
      title="Calorías vs. meta"
      subtitle="Cuánto te alejaste de la meta cada día. Toca un día para abrirlo y corregirlo."
    >
      <Legend
        items={[
          { label: `Por encima (más de +${ON_TARGET_PCT * 100} %)`, color: STATUS_COLOR.over },
          { label: `En meta (±${ON_TARGET_PCT * 100} %)`, color: STATUS_COLOR.on },
          { label: `Por debajo (más de −${ON_TARGET_PCT * 100} %)`, color: STATUS_COLOR.under },
        ]}
      />
      <div ref={ref} className="relative" onMouseLeave={() => setTip(null)}>
        <svg width={width} height={H} role="img" aria-label="Desvío diario de las calorías respecto de la meta">
          {/* Franja "en meta" */}
          <rect
            x={M.left}
            y={y(ON_TARGET_PCT)}
            width={plotW}
            height={y(-ON_TARGET_PCT) - y(ON_TARGET_PCT)}
            fill="var(--color-lagoon-500)"
            opacity={0.1}
          />
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={t === 0 ? 1.5 : 1} />
              <text x={M.left - 6} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={AXIS_TEXT}>
                {t === 0 ? "Meta" : `${signed(Math.round(t * 100))} %`}
              </text>
            </g>
          ))}

          {days.map((d, i) => {
            const cx = M.left + slot * i + slot / 2;
            const status = dayStatus(d);
            const dev = deviation(d);
            const showLabel = i % every === 0;
            return (
              <g key={d.date}>
                {d.logged ? (
                  <path d={barPath(cx - barW / 2, barW, y(0), y(dev))} fill={STATUS_COLOR[status]} />
                ) : (
                  <circle cx={cx} cy={y(0)} r={2.5} fill="var(--color-neutral-300)" />
                )}
                {d.sports.length > 0 && (
                  <circle cx={cx} cy={M.top + 2} r={3} fill="var(--color-lagoon-700)" />
                )}
                {showLabel && (
                  <text x={cx} y={H - 8} textAnchor="middle" fontSize={11} fill={AXIS_TEXT}>
                    {shortDay(d.date)}
                  </text>
                )}
                {/* Zona de hover/click más grande que la barra */}
                <rect
                  x={M.left + slot * i}
                  y={M.top}
                  width={slot}
                  height={plotH}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() =>
                    setTip({
                      x: cx,
                      y: d.logged ? Math.min(y(dev), y(0)) : y(0),
                      content: <DayTooltip day={d} />,
                    })
                  }
                  onClick={() => router.push(`/profiles/${profileId}?date=${d.date}`)}
                >
                  <title>{`${longDay(d.date)}: ${d.logged ? `${fmt(d.calories)} de ${fmt(d.goal)} kcal` : "sin registro"}`}</title>
                </rect>
              </g>
            );
          })}
        </svg>
        <ChartTooltip tip={tip} width={width} />
      </div>
      <p className="text-xs text-neutral-500">
        Los puntos grises son días sin registro: no cuentan en los promedios. El punto verde arriba
        marca los días con deporte.
      </p>
    </ChartCard>
  );
}

function DayTooltip({ day }: { day: StatsDay }) {
  const diff = day.calories - day.goal;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-semibold capitalize text-neutral-800">{longDay(day.date)}</span>
      {day.logged ? (
        <>
          <span>
            {fmt(day.calories)} de {fmt(day.goal)} kcal
          </span>
          <span>
            {signed(diff)} kcal ({signed(Math.round(deviation(day) * 100))} %)
          </span>
        </>
      ) : (
        <span>Sin registro</span>
      )}
      {day.sports.length > 0 && (
        <span className="text-neutral-500">
          Deporte: {day.sports.map((s) => SPORT_LABELS[s.sport]).join(", ")} (+{fmt(day.sportKcal)} kcal)
        </span>
      )}
      <span className="text-neutral-400">Toca para abrir el día</span>
    </div>
  );
}
