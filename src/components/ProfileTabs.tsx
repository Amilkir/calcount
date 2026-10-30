"use client";

import { useState } from "react";

export default function ProfileTabs({
  form,
  history,
  historyCount,
}: {
  form: React.ReactNode;
  history: React.ReactNode;
  historyCount: number;
}) {
  const [tab, setTab] = useState<"data" | "history">("data");

  const tabClass = (active: boolean) =>
    `flex-1 rounded-full px-4 py-2 text-sm font-bold transition-colors sm:flex-none ${
      active ? "bg-white text-brand-700 shadow-sm" : "text-neutral-500 hover:text-brand-700"
    }`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-1 self-start rounded-full bg-neutral-100 p-1">
        <button type="button" onClick={() => setTab("data")} className={tabClass(tab === "data")}>
          Mis datos
        </button>
        <button
          type="button"
          onClick={() => setTab("history")}
          className={tabClass(tab === "history")}
        >
          Historial ({historyCount})
        </button>
      </div>

      {/* Ambos paneles quedan montados para no perder lo que se está editando. */}
      <div hidden={tab !== "data"}>{form}</div>
      <div hidden={tab !== "history"}>{history}</div>
    </div>
  );
}
