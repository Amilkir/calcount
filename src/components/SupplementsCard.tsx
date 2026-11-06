import { CapsuleIcon, CheckIcon } from "./icons";
import { SUPPLEMENT_LABELS, type Supplement } from "@/lib/supplements";

export default function SupplementsCard({
  supplements,
  taken,
  onToggle,
}: {
  supplements: Supplement[];
  taken: Supplement[];
  onToggle: (supplement: Supplement, checked: boolean) => void;
}) {
  const takenCount = supplements.filter((s) => taken.includes(s)).length;
  const allTaken = takenCount === supplements.length;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white/70 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 font-semibold text-neutral-800">
          <CapsuleIcon className="text-grape-500" />
          Suplementos
        </h3>
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
            allTaken ? "bg-lagoon-100 text-lagoon-700" : "bg-grape-100 text-grape-500"
          }`}
        >
          {allTaken ? (
            <>
              <CheckIcon size={12} /> Todos tomados
            </>
          ) : (
            `${takenCount} de ${supplements.length}`
          )}
        </span>
      </div>

      <ul className="flex flex-col gap-1">
        {supplements.map((supplement) => {
          const checked = taken.includes(supplement);
          return (
            <li key={supplement}>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-neutral-50">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => onToggle(supplement, e.target.checked)}
                  className="h-5 w-5 accent-lagoon-600"
                />
                <span
                  className={`text-sm ${checked ? "text-neutral-500 line-through" : "text-neutral-800"}`}
                >
                  {SUPPLEMENT_LABELS[supplement]}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
