"use client";

import { useCallback, useEffect, useState } from "react";
import { addDays, toDateKey } from "@/lib/date";
import { MAX_RANGE_DAYS, type StatsResponse } from "@/lib/stats-types";
import { fmt, signed, summary } from "@/lib/stats-calc";
import CaloriesChart from "./CaloriesChart";
import MacroAccuracyChart from "./MacroAccuracyChart";
import ExcessChart from "./ExcessChart";
import WeightChart from "./WeightChart";
import { DaysTable, HabitsCard, SlotsChart, StatTile } from "./StatsExtras";

type Preset = 7 | 14 | 28 | "custom";
const PRESETS: Preset[] = [7, 14, 28, "custom"];

const daysBetween = (a: string, b: string) =>
  Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / 86_400_000) + 1;

export default function StatsView({ profileId, profileName }: { profileId: string; profileName: string }) {
  const todayKey = toDateKey(new Date());
  const [preset, setPreset] = useState<Preset>(7);
  const [customStart, setCustomStart] = useState(() => addDays(todayKey, -29));
  const [customEnd, setCustomEnd] = useState(todayKey);
  const [data, setData] = useState<StatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showWeight, setShowWeight] = useState<boolean | null>(null);

  const customInvalid =
    preset === "custom" &&
    (!customStart || !customEnd || customStart > customEnd || daysBetween(customStart, customEnd) > MAX_RANGE_DAYS);
  const start = preset === "custom" ? customStart : addDays(todayKey, -(preset - 1));
  const end = preset === "custom" ? customEnd : todayKey;

  const load = useCallback(async () => {
    const res = await fetch(`/api/profiles/${profileId}/stats?startDate=${start}&endDate=${end}`).catch(() => null);
    if (!res?.ok) {
      const body = await res?.json().catch(() => null);
      setError(body?.error ?? "No se pudieron cargar las estadísticas.");
      return;
    }
    const json: StatsResponse = await res.json();
    setError(null);
    setData(json);
    setShowWeight((prev) => prev ?? json.showWeightChart);
  }, [profileId, start, end]);

  useEffect(() => {
    if (customInvalid) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load, customInvalid]);

  async function toggleWeight(enabled: boolean) {
    setShowWeight(enabled);
    const res = await fetch(`/api/profiles/${profileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showWeightChart: enabled }),
    }).catch(() => null);
    if (!res?.ok) setShowWeight(!enabled);
  }

  const s = data ? summary(data.days) : null;
  const totalDays = data?.days.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Estadísticas</h1>
        <p className="text-sm text-neutral-500">
          Cómo vienen tus días, {profileName}. Los días sin registros no cuentan en los promedios.
        </p>
      </div>

      {/* Filtros: una sola fila arriba de los gráficos */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-full bg-neutral-100 p-1 text-sm font-semibold" role="group" aria-label="Rango">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPreset(p)}
              aria-pressed={preset === p}
              className={`rounded-full px-3 py-1.5 ${
                preset === p ? "bg-white text-brand-700 shadow-sm" : "text-neutral-500 hover:text-brand-700"
              }`}
            >
              {p === "custom" ? "Personalizado" : `${p} días`}
            </button>
          ))}
        </div>
        {preset === "custom" && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <input
              type="date"
              value={customStart}
              max={customEnd || todayKey}
              onChange={(e) => setCustomStart(e.target.value)}
              aria-label="Desde"
              className="rounded-lg border border-neutral-300 px-2 py-1.5"
            />
            <span className="text-neutral-500">a</span>
            <input
              type="date"
              value={customEnd}
              min={customStart}
              max={todayKey}
              onChange={(e) => setCustomEnd(e.target.value)}
              aria-label="Hasta"
              className="rounded-lg border border-neutral-300 px-2 py-1.5"
            />
            {customInvalid && (
              <span className="text-xs text-danger-600">
                Elige un rango válido de hasta {MAX_RANGE_DAYS} días.
              </span>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-danger-600">{error}</p>}

      {!data ? (
        <div className="grid animate-pulse gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-neutral-100" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Días registrados" value={`${s!.logged}`} detail={`de ${totalDays} en el rango`} />
            <StatTile
              label="Días en meta"
              value={`${s!.onTarget}`}
              detail={s!.logged ? `de ${s!.logged} registrados (±10 %)` : "sin registros"}
            />
            <StatTile
              label="Promedio diario"
              value={s!.logged ? `${fmt(s!.avgCalories)}` : "—"}
              detail={s!.logged ? `kcal · meta promedio ${fmt(s!.avgGoal)}` : undefined}
            />
            <StatTile
              label="Balance promedio"
              value={s!.logged ? `${signed(s!.avgBalance)}` : "—"}
              detail={
                s!.logged
                  ? s!.avgBalance <= 0
                    ? "kcal/día por debajo de tu meta"
                    : "kcal/día por encima de tu meta"
                  : undefined
              }
            />
          </div>

          {s!.logged === 0 ? (
            <p className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
              No hay comidas registradas en este rango. Elige otro rango o empieza a registrar en «Hoy».
            </p>
          ) : (
            <>
              <CaloriesChart days={data.days} profileId={profileId} />
              <div className="grid gap-6 lg:grid-cols-2">
                <MacroAccuracyChart days={data.days} />
                <ExcessChart days={data.days} />
              </div>
            </>
          )}

          <WeightChart
            profileId={profileId}
            weights={data.weights}
            days={data.days}
            enabled={showWeight ?? false}
            onToggle={toggleWeight}
            onChanged={load}
          />

          <HabitsCard
            days={data.days}
            todayKey={todayKey}
            hasSupplements={data.hasSupplements}
            hasSports={data.hasSports}
          />

          <SlotsChart days={data.days} />

          <DaysTable days={data.days} profileId={profileId} />
        </>
      )}
    </div>
  );
}
