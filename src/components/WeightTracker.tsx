"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { formatDateDisplay, toDateKey } from "@/lib/date";

interface WeightLogRow {
  id: string;
  date: string;
  weightKg: number;
}

/** Carga rápida del peso en "Hoy". La evolución y el historial están en Estadísticas. */
export default function WeightTracker({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [latest, setLatest] = useState<WeightLogRow | null>(null);
  const [date, setDate] = useState(() => toDateKey(new Date()));
  const [weight, setWeight] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/profiles/${profileId}/weights`);
    if (!res.ok) return;
    const data: { logs: WeightLogRow[] } = await res.json();
    setLatest(data.logs[0] ?? null);
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

  return (
    <div className="flex flex-col gap-4 border-t border-neutral-200 pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Registro de peso
        </p>
        <Link href="/stats" className="text-xs font-semibold text-brand-700 hover:underline">
          Ver evolución en Estadísticas
        </Link>
      </div>

      <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-end">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Fecha</span>
          <input
            type="date"
            value={date}
            max={toDateKey(new Date())}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
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
            className="w-full sm:w-28 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            placeholder="Ej. 74.5"
            required
          />
        </label>
        <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto">
          {saving ? "Guardando..." : "Registrar"}
        </button>
      </form>
      {error && <p className="text-sm text-danger-600">{error}</p>}

      {latest && (
        <p className="text-sm text-neutral-600">
          Último registro: <span className="font-semibold text-neutral-800">{latest.weightKg} kg</span>{" "}
          <span className="text-neutral-500">({formatDateDisplay(latest.date)})</span>
        </p>
      )}
    </div>
  );
}
