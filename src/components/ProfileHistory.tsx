"use client";

import type { ChangeItem } from "@/lib/profile-history";

export interface HistoryEntry {
  id: string;
  source: string;
  note: string | null;
  changes: ChangeItem[];
  goalBefore: number | null;
  goalAfter: number;
  maintenanceBefore: number | null;
  maintenanceAfter: number;
  createdAt: string;
}

const SOURCE_BADGE: Record<string, { label: string; className: string }> = {
  CREATED: { label: "Perfil creado", className: "bg-lagoon-100 text-lagoon-700" },
  EDIT: { label: "Edición", className: "bg-brand-100 text-brand-700" },
  WEIGHT: { label: "Registro de peso", className: "bg-grape-100 text-grape-500" },
};

function delta(before: number | null, after: number) {
  if (before == null) return null;
  const d = after - before;
  return d === 0 ? null : `${d > 0 ? "+" : ""}${d} kcal`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ProfileHistory({ entries }: { entries: HistoryEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
        Aún no hay cambios registrados.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {entries.map((entry) => {
        const badge = SOURCE_BADGE[entry.source] ?? SOURCE_BADGE.EDIT;
        const goalDelta = delta(entry.goalBefore, entry.goalAfter);
        const maintDelta = delta(entry.maintenanceBefore, entry.maintenanceAfter);
        const created = entry.source === "CREATED";

        return (
          <li
            key={entry.id}
            className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${badge.className}`}>
                {badge.label}
              </span>
              <time
                dateTime={entry.createdAt}
                suppressHydrationWarning
                className="text-xs text-neutral-500"
              >
                {formatDate(entry.createdAt)}
              </time>
            </div>

            {entry.note && (
              <p className="rounded-lg bg-neutral-50 px-3 py-2 text-sm italic text-neutral-700">
                «{entry.note}»
              </p>
            )}

            {entry.changes.length > 0 && (
              <ul className="flex flex-col gap-0.5 text-sm">
                {entry.changes.map((c) => (
                  <li key={c.field}>
                    <span className="font-semibold text-neutral-800">{c.label}:</span>{" "}
                    <span className="text-neutral-500">{c.from}</span>
                    <span className="mx-1.5 text-brand-600">→</span>
                    <span className="font-semibold text-neutral-900">{c.to}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="rounded-lg bg-lagoon-50 px-3 py-2 text-sm text-lagoon-900">
              {created ? (
                <>
                  Meta inicial: <strong>{entry.goalAfter} kcal/día</strong> · Mantenimiento:{" "}
                  {entry.maintenanceAfter} kcal
                </>
              ) : goalDelta || maintDelta ? (
                <>
                  Meta diaria: {entry.goalBefore} → <strong>{entry.goalAfter} kcal</strong>
                  {goalDelta && <> ({goalDelta})</>}
                  <br />
                  Mantenimiento: {entry.maintenanceBefore} → {entry.maintenanceAfter} kcal
                  {maintDelta && <> ({maintDelta})</>}
                </>
              ) : (
                <>
                  Sin efecto en las calorías: estos datos solo generan recomendaciones. Meta
                  diaria: {entry.goalAfter} kcal.
                </>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
