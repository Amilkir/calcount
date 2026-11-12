"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatFreeDescription, sumDayMacros } from "@/lib/macros";
import type { Food, FoodEntryWithFood, Profile } from "@/lib/types";
import type { MealTemplateWithItems } from "@/lib/meals";
import type { MealSlot } from "@/generated/prisma/enums";
import { MEAL_SLOT_LABELS, MEAL_SLOT_ORDER } from "@/lib/labels";
import { formatDateDisplay, toDateKey } from "@/lib/date";
import CalorieSummary from "./CalorieSummary";
import MacroPieChart from "./MacroPieChart";
import MealSlotSection, { type EntryUpdate } from "./MealSlotSection";
import AddEntryModal, { type NewEntryPayload } from "./AddEntryModal";
import TargetsPanel from "./TargetsPanel";
import WeightTracker from "./WeightTracker";
import HydrationCard from "./HydrationCard";
import SupplementsCard from "./SupplementsCard";
import type { CalorieTargets } from "@/lib/calories";
import { dayPlan, type DailyLogData } from "@/lib/daily-log";
import { decodeSupplements, type Supplement } from "@/lib/supplements";
import {
  decodeSportPlan,
  sportCreditKcal,
  sportsBonusKcal,
  type Sport,
  type SportDone,
} from "@/lib/sports";
import SportsCard from "./SportsCard";
import { PencilIcon } from "./icons";

function CalorieSummarySkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-neutral-200 bg-white p-6 shadow-md shadow-brand-600/5 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-4 w-32 rounded bg-neutral-100" />
          <div className="h-12 w-28 rounded bg-neutral-100" />
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="h-4 w-28 rounded bg-neutral-100" />
          <div className="h-4 w-24 rounded bg-neutral-100" />
        </div>
      </div>
      <div className="mt-4 h-3 w-full rounded-full bg-neutral-100" />
    </div>
  );
}

function MacroPieChartSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="h-3 w-40 rounded bg-neutral-100" />
      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-around">
        <div className="h-40 w-40 rounded-full bg-neutral-100" />
        <div className="flex flex-col gap-2">
          <div className="h-4 w-32 rounded bg-neutral-100" />
          <div className="h-4 w-28 rounded bg-neutral-100" />
          <div className="h-4 w-24 rounded bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}

function MealSlotSectionSkeleton({ label }: { label: string }) {
  return (
    <div className="animate-pulse rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-neutral-800">{label}</h3>
        <div className="h-4 w-14 rounded bg-neutral-100" />
      </div>
      <div className="mt-3 h-4 w-2/3 rounded bg-neutral-100" />
      <div className="mt-3 h-4 w-24 rounded bg-neutral-100" />
    </div>
  );
}

async function fetchEntries(profileId: string, date: string): Promise<FoodEntryWithFood[]> {
  const res = await fetch(`/api/entries?profileId=${profileId}&date=${date}`);
  if (!res.ok) return [];
  return res.json();
}

async function fetchDailyLogs(
  profileId: string,
  startDate: string,
  endDate: string
): Promise<Record<string, DailyLogData>> {
  const res = await fetch(
    `/api/profiles/${profileId}/daily-logs?startDate=${startDate}&endDate=${endDate}`
  );
  if (!res.ok) return {};
  const data: DailyLogData[] = await res.json();
  return Object.fromEntries(data.map((d) => [d.date, d]));
}

export default function Dashboard({
  profile,
  foods,
  meals,
  targets,
  date,
}: {
  profile: Profile;
  foods: Food[];
  meals: MealTemplateWithItems[];
  targets: CalorieTargets;
  /** Día a editar (desde Estadísticas). Sin fecha, es el día de hoy. */
  date?: string;
}) {
  const todayKey = toDateKey(new Date());
  // "Hoy" es solo el día en curso; otro día se abre desde Estadísticas (no se editan días futuros).
  const dateKey = date && date < todayKey ? date : todayKey;
  const isToday = dateKey === todayKey;
  const [entries, setEntries] = useState<FoodEntryWithFood[] | null>(null);
  const [activeSlot, setActiveSlot] = useState<MealSlot | null>(null);
  const [dailyLogs, setDailyLogs] = useState<Record<string, DailyLogData>>({});
  // Último guardado por día: las respuestas de guardados anteriores se ignoran.
  const saveSeq = useRef<Record<string, number>>({});

  const currentHabits = {
    supplements: decodeSupplements(profile.supplements),
    waterGoalMl: targets.waterMl,
    todayKey,
  };
  const dayLog = dailyLogs[dateKey];
  const plan = dayPlan(dateKey, dayLog, currentHabits);

  // Un día pasado se compara con las metas vigentes entonces, si quedaron guardadas.
  const baseTargets = useMemo<CalorieTargets>(() => {
    if (isToday || dayLog?.goalCalories == null) return targets;
    return {
      ...targets,
      goalCalories: dayLog.goalCalories,
      macros: {
        proteinG: dayLog.proteinG ?? targets.macros.proteinG,
        carbsG: dayLog.carbsG ?? targets.macros.carbsG,
        fatG: dayLog.fatG ?? targets.macros.fatG,
      },
    };
  }, [isToday, dayLog, targets]);
  const baseGoal = baseTargets.goalCalories;

  // Deporte: la meta base no lo incluye; se suma lo marcado cada día (sobre todo como carbohidratos,
  // porque la proteína y la grasa se calculan por kg de peso).
  const sportPlan = decodeSportPlan(profile.sports);
  const sportsDone = dayLog?.sportsDone ?? [];
  const sportBonus = sportsBonusKcal(sportsDone);
  const goalCalories = baseGoal + sportBonus;
  const dayTargets = useMemo<CalorieTargets>(
    () => ({
      ...baseTargets,
      goalCalories,
      macros: { ...baseTargets.macros, carbsG: baseTargets.macros.carbsG + sportBonus / 4 },
    }),
    [baseTargets, goalCalories, sportBonus]
  );
  const creditFor = (sport: Sport, minutes: number) =>
    sportCreditKcal(sport, minutes, profile.weightKg, profile.goal);

  useEffect(() => {
    let cancelled = false;
    fetchDailyLogs(profile.id, dateKey, dateKey).then((data) => {
      if (!cancelled) setDailyLogs(data);
    });
    return () => {
      cancelled = true;
    };
  }, [profile.id, dateKey]);

  /** Actualiza el día al instante y lo guarda en segundo plano. */
  async function saveDailyLog(
    date: string,
    change: { waterMl?: number; supplementsTaken?: Supplement[]; sportsDone?: SportDone[] }
  ) {
    setDailyLogs((prev) => {
      const base: DailyLogData = prev[date] ?? {
        date,
        waterMl: 0,
        waterGoalMl: plan.waterGoalMl,
        supplementsPlanned: plan.supplements,
        supplementsTaken: [],
        sportsDone: [],
      };
      return { ...prev, [date]: { ...base, ...change } };
    });

    const seq = (saveSeq.current[date] ?? 0) + 1;
    saveSeq.current[date] = seq;
    const res = await fetch(`/api/profiles/${profile.id}/daily-logs`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, ...change }),
    }).catch(() => null);
    if (saveSeq.current[date] !== seq) return;

    if (res?.ok) {
      const saved: DailyLogData = await res.json();
      if (saveSeq.current[date] === seq) setDailyLogs((prev) => ({ ...prev, [date]: saved }));
    } else {
      // Si falló, se vuelve a lo que hay guardado.
      const fresh = await fetchDailyLogs(profile.id, dateKey, dateKey);
      setDailyLogs(fresh);
    }
  }

  function toggleSupplement(supplement: Supplement, checked: boolean) {
    const current = dayLog?.supplementsTaken ?? [];
    const next = checked
      ? [...new Set([...current, supplement])]
      : current.filter((s) => s !== supplement);
    saveDailyLog(dateKey, { supplementsTaken: next });
  }

  useEffect(() => {
    let cancelled = false;
    fetchEntries(profile.id, dateKey).then((data) => {
      if (!cancelled) setEntries(data);
    });
    return () => {
      cancelled = true;
    };
  }, [profile.id, dateKey]);

  async function refresh() {
    setEntries(await fetchEntries(profile.id, dateKey));
  }

  async function handleAddEntry(payload: NewEntryPayload) {
    if (!activeSlot) return;
    const base = { profileId: profile.id, mealSlot: activeSlot, date: dateKey };
    const body =
      payload.kind === "food"
        ? { ...base, foodId: payload.foodId, quantity: payload.quantity }
        : payload.kind === "meal"
          ? { ...base, mealTemplateId: payload.mealTemplateId, items: payload.items }
          : payload.kind === "portion"
            ? { ...base, mealTemplateId: payload.mealTemplateId, portions: payload.portions }
            : payload.kind === "batch"
            ? { ...base, foods: payload.foods }
            : {
                ...base,
                freeDescription: formatFreeDescription(payload.description, payload.macro),
                calories: payload.calories,
              };

    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setActiveSlot(null);
      await refresh();
    }
  }

  async function handleUpdateEntry(id: string, change: EntryUpdate): Promise<boolean> {
    const res = await fetch(`/api/entries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(change),
    }).catch(() => null);
    if (!res?.ok) return false;
    await refresh();
    return true;
  }

  async function handleDeleteEntry(id: string) {
    const res = await fetch(`/api/entries/${id}`, { method: "DELETE" });
    if (res.ok) await refresh();
  }

  const loading = entries === null;
  const consumed = (entries ?? []).reduce((sum, e) => sum + e.calories, 0);
  // Lo que falta del día, para el autocompletado (negativo = ya te pasaste).
  const remaining = useMemo(() => {
    const day = sumDayMacros(entries ?? []);
    return {
      calories: goalCalories - (entries ?? []).reduce((sum, e) => sum + e.calories, 0),
      protein: dayTargets.macros.proteinG - day.protein,
      carbs: dayTargets.macros.carbsG - day.carbs,
      fat: dayTargets.macros.fatG - day.fat,
    };
  }, [entries, goalCalories, dayTargets.macros]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{profile.name}</h1>
          <p className="text-sm capitalize text-neutral-500">{formatDateDisplay(dateKey)}</p>
        </div>
        <Link href="/profile" className="btn-secondary shrink-0">
          Ver perfil
        </Link>
      </div>

      {!isToday && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sun-100 bg-sun-50 px-4 py-3 text-sm text-sun-800">
          <span className="flex items-center gap-2">
            <PencilIcon size={14} className="shrink-0" />
            <span>
              Estás editando el <span className="font-semibold">{formatDateDisplay(dateKey)}</span>.
            </span>
          </span>
          <span className="flex gap-3 font-semibold">
            <Link href="/stats" className="hover:underline">
              Volver a Estadísticas
            </Link>
            <Link href={`/profiles/${profile.id}`} className="hover:underline">
              Ir a hoy
            </Link>
          </span>
        </div>
      )}

      {loading ? (
        <CalorieSummarySkeleton />
      ) : (
        <CalorieSummary consumed={consumed} goalCalories={goalCalories} />
      )}

      {loading ? <MacroPieChartSkeleton /> : <MacroPieChart entries={entries ?? []} />}

      {!loading && <TargetsPanel targets={dayTargets} entries={entries ?? []} />}

      {(sportPlan.length > 0 || sportsDone.length > 0) && (
        <SportsCard
          plan={sportPlan}
          done={sportsDone}
          isToday={isToday}
          creditFor={creditFor}
          onChange={(next) => saveDailyLog(dateKey, { sportsDone: next })}
        />
      )}

      <div className={`grid gap-4 ${plan.supplements.length > 0 ? "sm:grid-cols-2" : ""}`}>
        <HydrationCard
          waterMl={dayLog?.waterMl ?? 0}
          goalMl={plan.waterGoalMl}
          onChange={(waterMl) => saveDailyLog(dateKey, { waterMl })}
        />
        {plan.supplements.length > 0 && (
          <SupplementsCard
            supplements={plan.supplements}
            taken={dayLog?.supplementsTaken ?? []}
            onToggle={toggleSupplement}
          />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {loading
          ? MEAL_SLOT_ORDER.map((slot) => (
              <MealSlotSectionSkeleton key={slot} label={MEAL_SLOT_LABELS[slot]} />
            ))
          : MEAL_SLOT_ORDER.map((slot) => (
              <MealSlotSection
                key={slot}
                label={MEAL_SLOT_LABELS[slot]}
                entries={(entries ?? []).filter((e) => e.mealSlot === slot)}
                onAdd={() => setActiveSlot(slot)}
                onDelete={handleDeleteEntry}
                onUpdate={handleUpdateEntry}
              />
            ))}
      </div>

      {isToday && <WeightTracker profileId={profile.id} />}

      {activeSlot && (
        <AddEntryModal
          foods={foods}
          meals={meals}
          remaining={remaining}
          mealLabel={MEAL_SLOT_LABELS[activeSlot]}
          onClose={() => setActiveSlot(null)}
          onSubmit={handleAddEntry}
        />
      )}
    </div>
  );
}
