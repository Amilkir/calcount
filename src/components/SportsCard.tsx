"use client";

import { useState } from "react";
import { CheckIcon } from "./icons";
import SportIcon from "./SportIcon";
import {
  MAX_SPORT_MINUTES,
  SPORT_LABELS,
  sportsBonusKcal,
  type Sport,
  type SportDone,
  type SportPlan,
} from "@/lib/sports";

/** Minutos de un deporte marcado: se editan libremente y se guardan al salir del campo. */
function MinutesInput({
  sport,
  minutes,
  onCommit,
}: {
  sport: Sport;
  minutes: number;
  onCommit: (minutes: number) => void;
}) {
  const [draft, setDraft] = useState<string>(String(minutes));
  const [prev, setPrev] = useState(minutes);
  if (prev !== minutes) {
    setPrev(minutes);
    setDraft(String(minutes));
  }

  function commit() {
    const value = Number(draft);
    if (Number.isInteger(value) && value >= 1 && value <= MAX_SPORT_MINUTES) {
      if (value !== minutes) onCommit(value);
    } else {
      setDraft(String(minutes));
    }
  }

  return (
    <label className="flex items-center gap-1 text-xs text-neutral-500">
      <input
        type="number"
        min={1}
        max={MAX_SPORT_MINUTES}
        step={1}
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        aria-label={`Minutos de ${SPORT_LABELS[sport]}`}
        className="w-16 rounded-lg border border-neutral-300 px-2 py-1 text-sm text-neutral-800"
      />
      min
    </label>
  );
}

export default function SportsCard({
  plan,
  done,
  isToday,
  creditFor,
  onChange,
}: {
  plan: SportPlan[];
  done: SportDone[];
  isToday: boolean;
  /** Kcal que se sumarían a la meta por `minutes` de `sport`. */
  creditFor: (sport: Sport, minutes: number) => number;
  onChange: (done: SportDone[]) => void;
}) {
  // Los deportes del perfil, más los que se marcaron ese día y ya no están en el perfil.
  const sports: { sport: Sport; minutes: number }[] = [
    ...plan.map((p) => ({ sport: p.sport, minutes: p.minutes })),
    ...done.filter((d) => !plan.some((p) => p.sport === d.sport)),
  ];
  const bonus = sportsBonusKcal(done);

  function toggle(sport: Sport, minutes: number, checked: boolean) {
    onChange(
      checked
        ? [...done, { sport, minutes, kcal: creditFor(sport, minutes) }]
        : done.filter((d) => d.sport !== sport)
    );
  }

  function setMinutes(sport: Sport, minutes: number) {
    onChange(
      done.map((d) => (d.sport === sport ? { sport, minutes, kcal: creditFor(sport, minutes) } : d))
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white/70 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-neutral-800">
          {isToday ? "¿Hiciste deporte hoy?" : "¿Hiciste deporte este día?"}
        </h3>
        {bonus > 0 && (
          <span className="inline-flex items-center gap-1 rounded-md bg-lagoon-100 px-2 py-0.5 text-xs font-semibold text-lagoon-700">
            <CheckIcon size={12} /> +{Math.round(bonus)} kcal a tu meta
          </span>
        )}
      </div>

      <ul className="flex flex-col gap-1">
        {sports.map(({ sport, minutes: planned }) => {
          const entry = done.find((d) => d.sport === sport);
          const checked = entry != null;
          return (
            <li
              key={sport}
              className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-2 hover:bg-neutral-50"
            >
              <label className="flex flex-1 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => toggle(sport, planned, e.target.checked)}
                  className="h-5 w-5 accent-lagoon-600"
                />
                <SportIcon sport={sport} size={16} />
                <span className="text-sm text-neutral-800">{SPORT_LABELS[sport]}</span>
              </label>
              {checked ? (
                <span className="flex items-center gap-2">
                  <MinutesInput
                    sport={sport}
                    minutes={entry.minutes}
                    onCommit={(m) => setMinutes(sport, m)}
                  />
                  <span className="w-16 text-right text-xs font-semibold text-lagoon-700 tabular-nums">
                    +{Math.round(entry.kcal)} kcal
                  </span>
                </span>
              ) : (
                <span className="text-xs text-neutral-400">
                  {planned} min · +{creditFor(sport, planned)} kcal
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
