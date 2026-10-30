"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Food, FoodEntryWithFood, Profile } from "@/lib/types";
import type { MealSlot } from "@/generated/prisma/enums";
import { MEAL_SLOT_LABELS, MEAL_SLOT_ORDER } from "@/lib/labels";
import { addDays, formatDateDisplay, getWeekDates, toDateKey } from "@/lib/date";
import CalorieSummary from "./CalorieSummary";
import MacroPieChart from "./MacroPieChart";
import MealSlotSection from "./MealSlotSection";
import AddEntryModal, { type NewEntryPayload } from "./AddEntryModal";
import WeekSummary from "./WeekSummary";
import TargetsPanel from "./TargetsPanel";
import WeightTracker from "./WeightTracker";
import type { CalorieTargets } from "@/lib/calories";

function CalorieSummarySkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-4 w-32 rounded bg-neutral-100" />
          <div className="h-9 w-24 rounded bg-neutral-100" />
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

export default function Dashboard({
  profile,
  foods,
  targets,
}: {
  profile: Profile;
  foods: Food[];
  targets: CalorieTargets;
}) {
  const goalCalories = targets.goalCalories;
  const [dateKey, setDateKey] = useState(() => toDateKey(new Date()));
  const [entries, setEntries] = useState<FoodEntryWithFood[] | null>(null);
  const [activeSlot, setActiveSlot] = useState<MealSlot | null>(null);
  const [weekTotals, setWeekTotals] = useState<Record<string, number>>({});

  const weekDates = getWeekDates(dateKey);

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
    const body =
      payload.kind === "food"
        ? {
            profileId: profile.id,
            foodId: payload.foodId,
            quantity: payload.quantity,
            mealSlot: activeSlot,
            date: dateKey,
          }
        : {
            profileId: profile.id,
            freeDescription: payload.description,
            calories: payload.calories,
            mealSlot: activeSlot,
            date: dateKey,
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

  async function handleDeleteEntry(id: string) {
    const res = await fetch(`/api/entries/${id}`, { method: "DELETE" });
    if (res.ok) await refresh();
  }

  const loading = entries === null;
  const consumed = (entries ?? []).reduce((sum, e) => sum + e.calories, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          <p className="text-sm capitalize text-neutral-500">{formatDateDisplay(dateKey)}</p>
        </div>
        <Link href="/profile" className="btn-secondary shrink-0">
          Ver perfil
        </Link>
      </div>

      <WeekSummary
        weekDates={weekDates}
        dailyTotals={weekTotals}
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
              />
            ))}
      </div>

      <WeightTracker profileId={profile.id} />

      {activeSlot && (
        <AddEntryModal
          foods={foods}
          mealLabel={MEAL_SLOT_LABELS[activeSlot]}
          onClose={() => setActiveSlot(null)}
          onSubmit={handleAddEntry}
        />
      )}
    </div>
  );
}
