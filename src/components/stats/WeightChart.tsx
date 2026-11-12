"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdaptiveEstimate } from "@/lib/adaptive";
import type { StatsDay, WeightPoint } from "@/lib/stats-types";
import { expectedVsReal, fmt, longDay, signed, weightTrend } from "@/lib/stats-calc";
import { formatDateDisplay } from "@/lib/date";
import {
  AXIS_TEXT,
  ChartCard,
  ChartTooltip,
  GRID,
  Legend,
  niceTicks,
  useChartWidth,
  type TooltipState,
} from "./chart-kit";

const H = 220;
const M = { top: 14, right: 12, bottom: 26, left: 44 };
const TREND_COLOR = "var(--color-lagoon-600)";
const POINT_COLOR = "var(--color-neutral-500)";

const time = (d: string) => new Date(`${d}T00:00:00`).getTime();

export default function WeightChart({
  profileId,
  weights,
  days,
  enabled,
  onToggle,
  onChanged,
}: {
  profileId: string;
  weights: WeightPoint[];
  days: StatsDay[];
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  /** Se llama al borrar un registro, para recargar las estadísticas. */
  onChanged: () => void;
}) {
  return (
    <ChartCard
      title="Evolución del peso"
      subtitle={enabled ? "Todos tus registros desde el primero; la franja marca el rango elegido." : undefined}
      action={
        <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
          <span>Mostrar</span>
          <input
            type="checkbox"
            role="switch"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className="relative h-6 w-10 rounded-full bg-neutral-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-lagoon-500 peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-300"
          />
        </label>
      }
    >
      {enabled ? (
        <WeightBody profileId={profileId} weights={weights} days={days} onChanged={onChanged} />
      ) : (
        <p className="text-sm text-neutral-500">
          Actívalo para ver tu peso a lo largo del tiempo y compararlo con lo esperado según lo que
          registraste.
        </p>
      )}
    </ChartCard>
  );
}

function WeightBody({
  profileId,
  weights,
  days,
  onChanged,
}: {
  profileId: string;
  weights: WeightPoint[];
  days: StatsDay[];
  onChanged: () => void;
}) {
  const { ref, width } = useChartWidth<HTMLDivElement>();
  const [tip, setTip] = useState<TooltipState | null>(null);
  const [estimate, setEstimate] = useState<AdaptiveEstimate | null>(null);

  const loadEstimate = useCallback(async () => {
    const res = await fetch(`/api/profiles/${profileId}/weights`);
    if (res.ok) setEstimate((await res.json()).estimate);
  }, [profileId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEstimate();
  }, [loadEstimate]);

  async function handleDelete(date: string) {
    if (!confirm(`¿Eliminar el registro de peso del ${formatDateDisplay(date)}?`)) return;
    const res = await fetch(`/api/profiles/${profileId}/weights?date=${date}`, { method: "DELETE" });
    if (res.ok) {
      onChanged();
      loadEstimate();
    }
  }

  if (weights.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        Todavía no registraste tu peso. Puedes hacerlo al final de la pestaña «Hoy».
      </p>
    );
  }

  const comparison = expectedVsReal(days, weights);
  const trend = weightTrend(weights);
  const all = [...weights.map((w) => w.weightKg), ...trend.map((w) => w.weightKg)];
  const minKg = Math.floor(Math.min(...all) - 0.5);
  const maxKg = Math.ceil(Math.max(...all) + 0.5);
  const rangeStart = days[0]?.date ?? weights[0].date;
  const rangeEnd = days[days.length - 1]?.date ?? weights[weights.length - 1].date;
  const t0 = Math.min(time(weights[0].date), time(rangeStart));
  const t1 = Math.max(time(weights[weights.length - 1].date), time(rangeEnd), t0 + 86_400_000);

  const plotW = width - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const x = (d: string) => M.left + ((time(d) - t0) / (t1 - t0)) * plotW;
  const y = (kg: number) => M.top + plotH - ((kg - minKg) / (maxKg - minKg)) * plotH;
  const line = (pts: WeightPoint[]) => pts.map((p, i) => `${i ? "L" : "M"}${x(p.date)},${y(p.weightKg)}`).join("");
  const firstLabel = weights[0].date;
  const lastLabel = weights[weights.length - 1].date;

  function onMove(e: React.MouseEvent<SVGRectElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - box.left + M.left;
    let best = 0;
    weights.forEach((w, i) => {
      if (Math.abs(x(w.date) - mx) < Math.abs(x(weights[best].date) - mx)) best = i;
    });
    const w = weights[best];
    setTip({
      x: x(w.date),
      y: y(w.weightKg),
      content: (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold capitalize text-neutral-800">{longDay(w.date)}</span>
          <span>{fmt(w.weightKg, 1)} kg</span>
          <span className="text-neutral-500">Tendencia: {fmt(trend[best].weightKg, 1)} kg</span>
        </div>
      ),
    });
  }

  return (
    <>
      <Legend
        items={[
          { label: "Registro", color: POINT_COLOR },
          { label: "Tendencia (promedio de 7 días)", color: TREND_COLOR, shape: "line" },
        ]}
      />
      <div ref={ref} className="relative" onMouseLeave={() => setTip(null)}>
        <svg width={width} height={H} role="img" aria-label="Evolución del peso">
          <rect
            x={x(rangeStart)}
            y={M.top}
            width={Math.max(2, x(rangeEnd) - x(rangeStart))}
            height={plotH}
            fill="var(--color-brand-500)"
            opacity={0.07}
          />
          {niceTicks(minKg, maxKg, 4).map((t) => (
            <g key={t}>
              <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
              <text x={M.left - 6} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={AXIS_TEXT}>
                {fmt(t, Number.isInteger(t) ? 0 : 1)}
              </text>
            </g>
          ))}
          <text x={M.left} y={H - 8} fontSize={11} fill={AXIS_TEXT}>
            {longDay(firstLabel)}
          </text>
          {lastLabel !== firstLabel && (
            <text x={width - M.right} y={H - 8} textAnchor="end" fontSize={11} fill={AXIS_TEXT}>
              {longDay(lastLabel)}
            </text>
          )}
          {weights.length > 1 && (
            <path d={line(weights)} fill="none" stroke={POINT_COLOR} strokeWidth={1} opacity={0.5} />
          )}
          {trend.length > 1 && (
            <path d={line(trend)} fill="none" stroke={TREND_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          )}
          {weights.map((w) => (
            <circle key={w.date} cx={x(w.date)} cy={y(w.weightKg)} r={4} fill={POINT_COLOR} stroke="white" strokeWidth={2} />
          ))}
          <rect x={M.left} y={M.top} width={plotW} height={plotH} fill="transparent" onMouseMove={onMove} />
        </svg>
        <ChartTooltip tip={tip} width={width} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-700">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Esperado vs. real (rango elegido)
          </p>
          {comparison ? (
            <>
              <p className="mt-1">
                Según lo registrado: <span className="font-semibold">{signed(comparison.expected, 1)} kg</span>
                {" · "}Balanza: <span className="font-semibold">{signed(comparison.real, 1)} kg</span>
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Del {longDay(comparison.from.date)} al {longDay(comparison.to.date)}. Se consideraron{" "}
                {comparison.loggedDays} de {comparison.totalDays} días; los días sin registro no suman al
                esperado. El peso diario varía por agua y sal, así que mira la tendencia en varias semanas.
              </p>
            </>
          ) : (
            <p className="mt-1 text-xs text-neutral-500">
              Registra tu peso al menos dos veces dentro del rango para comparar.
            </p>
          )}
        </div>
        {estimate && (
          <div className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-700">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Gasto real estimado</p>
            {estimate.observedTdee != null ? (
              <>
                <p className="mt-1">
                  <span className="font-semibold">{estimate.observedTdee} kcal/día</span>
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  Ingesta media {estimate.avgIntake} kcal · tendencia{" "}
                  {estimate.slopeKgPerWeek != null && estimate.slopeKgPerWeek > 0 ? "+" : ""}
                  {estimate.slopeKgPerWeek} kg/semana (últimos 28 días). Actívalo en el perfil para que
                  ajuste tus metas.
                </p>
              </>
            ) : (
              <p className="mt-1 text-xs text-neutral-500">{estimate.reason}</p>
            )}
          </div>
        )}
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-xs font-semibold text-brand-700">
          Ver registros ({weights.length})
        </summary>
        <ul className="mt-2 divide-y divide-neutral-100">
          {[...weights].reverse().map((w) => (
            <li key={w.date} className="flex items-center justify-between py-1.5 text-xs sm:text-sm">
              <span className="mr-2 truncate capitalize text-neutral-600">{formatDateDisplay(w.date)}</span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="font-semibold text-neutral-800">{fmt(w.weightKg, 1)} kg</span>
                <button
                  type="button"
                  onClick={() => handleDelete(w.date)}
                  className="p-1 text-xs font-medium text-danger-600 hover:underline"
                >
                  Eliminar
                </button>
              </span>
            </li>
          ))}
        </ul>
      </details>
    </>
  );
}
