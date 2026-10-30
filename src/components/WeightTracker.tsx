"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { AdaptiveEstimate } from "@/lib/adaptive";
import { formatDateDisplay, toDateKey } from "@/lib/date";

interface WeightLogRow {
  id: string;
  date: string;
  weightKg: number;
}

const CHART_W = 280;
const CHART_H = 70;

function Sparkline({ logs }: { logs: WeightLogRow[] }) {
  if (logs.length < 2) return null;
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const weights = sorted.map((l) => l.weightKg);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;
  const points = sorted
    .map((l, i) => {
      const x = (i / (sorted.length - 1)) * (CHART_W - 8) + 4;
      const y = CHART_H - 6 - ((l.weightKg - min) / range) * (CHART_H - 12);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      className="h-[70px] w-full max-w-sm"
      role="img"
      aria-label="Tendencia del peso"
    >
      <polyline points={points} fill="none" stroke="#19b89a" strokeWidth={2} />
    </svg>
  );
}

export default function WeightTracker({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [logs, setLogs] = useState<WeightLogRow[]>([]);
  const [estimate, setEstimate] = useState<AdaptiveEstimate | null>(null);
  const [date, setDate] = useState(() => toDateKey(new Date()));
  const [weight, setWeight] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/profiles/${profileId}/weights`);
    if (!res.ok) return;
    const data = await res.json();
    setLogs(data.logs);
    setEstimate(data.estimate);
  }, [profileId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const weightKg = Number(weight);
    if (!weight || !Number.isFinite(weightKg)) {
      setError("Ingresa un peso válido.");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/profiles/${profileId}/weights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, weightKg }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "No se pudo guardar el peso.");
      return;
    }
    setWeight("");
    await load();
    router.refresh();
  }

  async function handleDelete(logDate: string) {
    const res = await fetch(`/api/profiles/${profileId}/weights?date=${logDate}`, {
      method: "DELETE",
    });
    if (res.ok) {
      await load();
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        Registro de peso
      </p>

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Fecha</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Peso (kg)</span>
          <input
            type="number"
            step={0.1}
            min={20}
            max={400}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-28 rounded-lg border border-neutral-300 px-3 py-2"
            required
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="btn-primary"
        >
          {saving ? "Guardando..." : "Registrar"}
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Sparkline logs={logs} />

      {logs.length > 0 && (
        <ul className="divide-y divide-neutral-100 text-sm">
          {logs.slice(0, 6).map((log) => (
            <li key={log.id} className="flex items-center justify-between py-1.5">
              <span className="capitalize text-neutral-600">{formatDateDisplay(log.date)}</span>
              <span className="flex items-center gap-3">
                <span className="font-semibold text-neutral-800">{log.weightKg} kg</span>
                <button
                  onClick={() => handleDelete(log.date)}
                  className="p-1 text-xs font-medium text-red-600 hover:underline"
                >
                  Eliminar
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {estimate && (
        <div className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-700">
          {estimate.observedTdee != null ? (
            <>
              <p>
                Gasto real estimado:{" "}
                <span className="font-semibold">{estimate.observedTdee} kcal/día</span>
              </p>
              <p className="text-xs text-neutral-500">
                Ingesta media {estimate.avgIntake} kcal · tendencia{" "}
                {estimate.slopeKgPerWeek != null && estimate.slopeKgPerWeek > 0 ? "+" : ""}
                {estimate.slopeKgPerWeek} kg/semana. Actívalo en el perfil para que ajuste tus metas.
              </p>
            </>
          ) : (
            <p className="text-xs text-neutral-500">
              Ajuste dinámico: {estimate.reason}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
