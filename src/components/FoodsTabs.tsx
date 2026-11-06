"use client";

import { useState } from "react";

export default function FoodsTabs({
  foods,
  meals,
  mealCount,
}: {
  foods: React.ReactNode;
  meals: React.ReactNode;
  mealCount: number;
}) {
  const [tab, setTab] = useState<"foods" | "meals">("foods");

  const tabClass = (active: boolean) =>
    `flex-1 rounded-full px-4 py-2 text-sm font-bold transition-colors sm:flex-none ${
      active ? "bg-white text-brand-700 shadow-sm" : "text-neutral-500 hover:text-brand-700"
    }`;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold">Alimentos</h1>
      <div className="flex gap-1 self-start rounded-full bg-neutral-100 p-1">
        <button type="button" onClick={() => setTab("foods")} className={tabClass(tab === "foods")}>
          Alimentos
        </button>
        <button type="button" onClick={() => setTab("meals")} className={tabClass(tab === "meals")}>
          Comidas ({mealCount})
        </button>
      </div>

      {/* Ambos paneles quedan montados para no perder lo que se está editando. */}
      <div hidden={tab !== "foods"}>{foods}</div>
      <div hidden={tab !== "meals"}>{meals}</div>
    </div>
  );
}
