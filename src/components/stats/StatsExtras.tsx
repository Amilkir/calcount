"use client";

import Link from "next/link";
import type { StatsDay } from "@/lib/stats-types";
import { MEAL_SLOT_LABELS } from "@/lib/labels";
import { SPORT_LABELS } from "@/lib/sports";
import {
  MACRO_KEYS,
  MACRO_TARGET,
  dayStatus,
  fmt,
  pastDays,
  shortDay,
  signed,
  slotAverages,
} from "@/lib/stats-calc";
import { CapsuleIcon, DropIcon, PencilIcon } from "../icons";
import { ChartCard, hbarPath, useChartWidth } from "./chart-kit";

/** Tarjeta de cifra: el número es el protagonista. */
export function StatTile({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <span className="text-xs font-medium text-neutral-500">{label}</span>
      <span className="text-2xl font-semibold tabular-nums text-neutral-900">{value}</span>
      {detail && <span className="text-xs text-neutral-500">{detail}</span>}
    </div>
  );
}

export function HabitsCard({
  days,
  todayKey,
  hasSupplements,
  hasSports,
}: {
  days: StatsDay[];
  todayKey: string;
  hasSupplements: boolean;
  hasSports: boolean;
}) {
  const past = pastDays(days, todayKey);
  const water = past.filter((d) => d.waterReached).length;
  const suppDays = past.filter((d) => d.supplementsDone !== null);
  const suppDone = suppDays.filter((d) => d.supplementsDone).length;
  const sportDays = days.filter((d) => d.sports.length > 0);
  const sportKcal = sportDays.reduce((s, d) => s + d.sportKcal, 0);
  const sportCount = new Map<string, number>();
  for (const d of sportDays) for (const s of d.sports) sportCount.set(s.sport, (sportCount.get(s.sport) ?? 0) + 1);

  const pct = (n: number, total: number) => (total ? `${fmt((n / total) * 100)} %` : "—");

  return (
    <ChartCard title="Hábitos" subtitle={`Sobre los ${past.length} días del rango que ya pasaron.`}>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-start gap-3 rounded-lg bg-neutral-50 p-3">
          <DropIcon size={20} className="mt-0.5 shrink-0 text-water-500" />
          <div>
            <p className="text-lg font-semibold tabular-nums text-neutral-900">{pct(water, past.length)}</p>
            <p className="text-xs text-neutral-500">
              Agua cumplida: {water} de {past.length} días
            </p>
          </div>
        </div>
        {hasSupplements && (
          <div className="flex items-start gap-3 rounded-lg bg-neutral-50 p-3">
            <CapsuleIcon size={20} className="mt-0.5 shrink-0 text-grape-500" />
            <div>
              <p className="text-lg font-semibold tabular-nums text-neutral-900">{pct(suppDone, suppDays.length)}</p>
              <p className="text-xs text-neutral-500">
                Suplementos completos: {suppDone} de {suppDays.length} días
              </p>
            </div>
          </div>
        )}
        {hasSports && (
          <div className="flex items-start gap-3 rounded-lg bg-neutral-50 p-3">
            <span className="mt-0.5 shrink-0 text-lg font-semibold text-lagoon-700">{sportDays.length}</span>
            <div>
              <p className="text-sm font-semibold text-neutral-900">
                {sportDays.length === 1 ? "día con deporte" : "días con deporte"}
              </p>
              <p className="text-xs text-neutral-500">
                +{fmt(sportKcal)} kcal sumadas a tus metas
                {sportCount.size > 0 &&
                  ` · ${[...sportCount].map(([s, n]) => `${SPORT_LABELS[s as keyof typeof SPORT_LABELS]} ${n}`).join(", ")}`}
              </p>
            </div>
          </div>
        )}
      </div>
    </ChartCard>
  );
}

const ROW = 30;
const BAR = 14;

/** Calorías promedio por comida (una sola serie: sin leyenda, el título la nombra). */
export function SlotsChart({ days }: { days: StatsDay[] }) {
  const { ref, width } = useChartWidth<HTMLDivElement>();
  const rows = slotAverages(days);
  const max = Math.max(1, ...rows.map((r) => r.avg));
  const left = 92;
  const right = 110;
  const x = (v: number) => left + (v / max) * (width - left - right);

  if (!days.some((d) => d.logged)) return null;

  return (
    <ChartCard title="Calorías por comida" subtitle="Promedio por día registrado y qué parte del total representa.">
      <div ref={ref}>
        <svg width={width} height={rows.length * ROW + 4} role="img" aria-label="Calorías promedio por comida">
          {rows.map((r, i) => {
            const top = i * ROW + (ROW - BAR) / 2;
            return (
              <g key={r.slot}>
                <text x={left - 8} y={top + BAR / 2} dy="0.32em" textAnchor="end" fontSize={12} fill="var(--color-neutral-700)">
                  {MEAL_SLOT_LABELS[r.slot]}
                </text>
                <path d={hbarPath(left, x(r.avg), top, BAR)} fill="var(--color-grape-500)" />
                <text x={x(r.avg) + 6} y={top + BAR / 2} dy="0.32em" fontSize={12} fill="var(--color-neutral-700)">
                  <tspan fontWeight={600}>{fmt(r.avg)} kcal</tspan>
                  <tspan dx={6} fill="var(--color-neutral-500)">· {fmt(r.share * 100)} %</tspan>
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </ChartCard>
  );
}

const STATUS_TEXT = { over: "Por encima", on: "En meta", under: "Por debajo" } as const;

/** Vista de tabla: todos los valores por día, y acceso para editar cada uno. */
export function DaysTable({ days, profileId }: { days: StatsDay[]; profileId: string }) {
  return (
    <details className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
      <summary className="cursor-pointer font-semibold text-neutral-800">Detalle por día</summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs sm:text-sm">
          <thead className="text-neutral-500">
            <tr className="border-b border-neutral-200">
              <th className="py-2 pr-3 font-medium">Día</th>
              <th className="py-2 pr-3 text-right font-medium">Consumido</th>
              <th className="py-2 pr-3 text-right font-medium">Meta</th>
              <th className="py-2 pr-3 text-right font-medium">Diferencia</th>
              <th className="py-2 pr-3 text-right font-medium">P / C / G (g)</th>
              <th className="py-2 pr-3 font-medium">Deporte</th>
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {[...days].reverse().map((d) => (
              <tr key={d.date} className="border-b border-neutral-100 last:border-none">
                <td className="py-2 pr-3 capitalize text-neutral-700">{shortDay(d.date)}</td>
                {d.logged ? (
                  <>
                    <td className="py-2 pr-3 text-right tabular-nums">{fmt(d.calories)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-neutral-500">{fmt(d.goal)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {signed(d.calories - d.goal)}{" "}
                      <span className="text-neutral-500">({STATUS_TEXT[dayStatus(d)]})</span>
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums text-neutral-600">
                      {MACRO_KEYS.map((k) => `${fmt(d[k])}/${fmt(d[MACRO_TARGET[k]])}`).join(" · ")}
                    </td>
                  </>
                ) : (
                  <td colSpan={4} className="py-2 pr-3 text-neutral-400">
                    Sin registro
                  </td>
                )}
                <td className="py-2 pr-3 text-neutral-600">
                  {d.sports.length ? d.sports.map((s) => SPORT_LABELS[s.sport]).join(", ") : "—"}
                </td>
                <td className="py-2 text-right">
                  <Link
                    href={`/profiles/${profileId}?date=${d.date}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
                  >
                    <PencilIcon size={12} /> Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
