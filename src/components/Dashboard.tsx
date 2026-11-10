"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatFreeDescription, sumDayMacros } from "@/lib/macros";
import type { Food, FoodEntryWithFood, Profile } from "@/lib/types";
import type { MealTemplateWithItems } from "@/lib/meals";
import type { MealSlot } from "@/generated/prisma/enums";
import { MEAL_SLOT_LABELS, MEAL_SLOT_ORDER } from "@/lib/labels";
import { addDays, formatDateDisplay, getWeekDates, toDateKey } from "@/lib/date";
import CalorieSummary from "./CalorieSummary";
import MacroPieChart from "./MacroPieChart";
import MealSlotSection, { type EntryUpdate } from "./MealSlotSection";
import AddEntryModal, { type NewEntryPayload } from "./AddEntryModal";
import WeekSummary from "./WeekSummary";
import TargetsPanel from "./TargetsPanel";
import WeightTracker from "./WeightTracker";
import HydrationCard from "./HydrationCard";
import SupplementsCard from "./SupplementsCard";
import type { CalorieTargets } from "@/lib/calories";
import { dayHabitStatus, dayPlan, type DailyLogData, type DayHabitStatus } from "@/lib/daily-log";
import { decodeSupplements, type Supplement } from "@/lib/supplements";

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

async function fetchWeekSummary(
  profileId: string,
  startDate: string,
  endDate: string
): Promise<Record<string, number>> {
  const res = await fetch(
    `/api/entries/summary?profileId=${profileId}&startDate=${startDate}&endDate=${endDate}`
  );
  if (!res.ok) return {};
  const data: { date: string; calories: number }[] = await res.json();
  return Object.fromEntries(data.map((d) => [d.date, d.calories]));
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
}: {
  profile: Profile;
  foods: Food[];
  meals: MealTemplateWithItems[];
  targets: CalorieTargets;
}) {
  const goalCalories = targets.goalCalories;
  const [dateKey, setDateKey] = useState(() => toDateKey(new Date()));
  const [entries, setEntries] = useState<FoodEntryWithFood[] | null>(null);
  const [activeSlot, setActiveSlot] = useState<MealSlot | null>(null);
  const [weekTotals, setWeekTotals] = useState<Record<string, number>>({});
  const [dailyLogs, setDailyLogs] = useState<Record<string, DailyLogData>>({});
  // Último guardado por día: las respuestas de guardados anteriores se ignoran.
  const saveSeq = useRef<Record<string, number>>({});

  const weekDates = getWeekDates(dateKey);
  const todayKey = toDateKey(new Date());
  const currentHabits = {
    supplements: decodeSupplements(profile.supplements),
    waterGoalMl: targets.waterMl,
    todayKey,
  };
  const habitStatus: Record<string, DayHabitStatus> = Object.fromEntries(
    weekDates.map((d) => [d, dayHabitStatus(d, dailyLogs[d], currentHabits)])
  );
  const dayLog = dailyLogs[dateKey];
  const plan = dayPlan(dateKey, dayLog, currentHabits);

  useEffect(() => {
    let cancelled = false;
    fetchDailyLogs(profile.id, weekDates[0], weekDates[6]).then((data) => {
      if (!cancelled) setDailyLogs(data);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id, weekDates[0]]);

  /** Actualiza el día al instante y lo guarda en segundo plano. */
  async function saveDailyLog(date: string, change: { waterMl?: number; supplementsTaken?: Supplement[] }) {
    setDailyLogs((prev) => {
      const base: DailyLogData = prev[date] ?? {
        date,
        waterMl: 0,
        waterGoalMl: plan.waterGoalMl,
        supplementsPlanned: plan.supplements,
        supplementsTaken: [],
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
      const fresh = await fetchDailyLogs(profile.id, weekDates[0], weekDates[6]);
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

  useEffect(() => {
    let cancelled = false;
    fetchWeekSummary(profile.id, weekDates[0], weekDates[6]).then((data) => {
      if (!cancelled) setWeekTotals(data);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id, weekDates[0]]);

  async function refresh() {
    const [dayEntries, summary] = await Promise.all([
      fetchEntries(profile.id, dateKey),
      fetchWeekSummary(profile.id, weekDates[0], weekDates[6]),
    ]);
    setEntries(dayEntries);
    setWeekTotals(summary);
  }

  async function handleAddEntry(payload: NewEntryPayload) {
    if (!activeSlot) return;
    const base = { profileId: profile.id, mealSlot: activeSlot, date: dateKey };
    const body =
      payload.kind === "food"
        ? { ...base, foodId: payload.foodId, quantity: payload.quantity }
        : payload.kind === "meal"
          ? { ...base, mealTemplateId: payload.mealTemplateId, items: payload.items }
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
      protein: targets.macros.proteinG - day.protein,
      carbs: targets.macros.carbsG - day.carbs,
      fat: targets.macros.fatG - day.fat,
    };
  }, [entries, goalCalories, targets.macros]);

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

      <WeekSummary
        weekDates={weekDates}
        dailyTotals={weekTotals}
        habitStatus={habitStatus}
        todayKey={todayKey}
        goalCalories={goalCalories}
        selectedDate={dateKey}
        onSelectDate={setDateKey}
        onPrevWeek={() => setDateKey((d) => addDays(d, -7))}
        onNextWeek={() => setDateKey((d) => addDays(d, 7))}
      />

      {loading ? (
        <CalorieSummarySkeleton />
      ) : (
        <CalorieSummary consumed={consumed} goalCalories={goalCalories} />
      )}

      {loading ? <MacroPieChartSkeleton /> : <MacroPieChart entries={entries ?? []} />}

      {!loading && <TargetsPanel targets={targets} entries={entries ?? []} />}

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

      <WeightTracker profileId={profile.id} />

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
