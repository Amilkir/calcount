"use client";

import { CheckIcon } from "./icons";
import { useId, useMemo, useRef, useState } from "react";
import type { Food } from "@/lib/types";

const MAX_RESULTS = 50;

// Búsqueda sin distinguir mayúsculas ni tildes ("platano" encuentra "Plátano").
const normalize = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Selector de alimento con buscador. Vacío muestra "Seleccione…".
 * `inline`: la lista va dentro del flujo (no flota) y arranca abierta, para usarlo
 * dentro de un modal con scroll, donde una lista flotante quedaría recortada.
 */
export default function FoodPicker({
  foods,
  value,
  onChange,
  label,
  className = "",
  inline = false,
}: {
  foods: Food[];
  value: string;
  onChange: (food: Food) => void;
  label: string;
  className?: string;
  inline?: boolean;
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(inline);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const selected = foods.find((f) => f.id === value) ?? null;

  const results = useMemo(() => {
    const q = normalize(query.trim());
    const matches = q
      ? foods.filter((f) => normalize(`${f.name} ${f.category}`).includes(q))
      : foods;
    return matches.slice(0, MAX_RESULTS);
  }, [foods, query]);

  function choose(food: Food) {
    onChange(food);
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      // Enter elige el resaltado en vez de enviar el formulario.
      if (open && results[active]) {
        e.preventDefault();
        choose(results[active]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && results[active] ? `${listId}-${active}` : undefined}
        autoComplete="off"
        value={open ? query : selected ? `${selected.icon} ${selected.name}` : ""}
        placeholder={
          open && selected
            ? `${selected.icon} ${selected.name}`
            : inline
              ? "Buscar alimento..."
              : "Seleccione…"
        }
        onFocus={() => {
          setOpen(true);
          setQuery("");
          setActive(0);
        }}
        onBlur={() => {
          setOpen(false);
          setQuery("");
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        className={`w-full rounded-lg border border-neutral-300 px-3 py-2 ${
          selected ? "" : "placeholder:text-neutral-500"
        }`}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400"
      >
        🔍
      </span>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className={
            inline
              ? "mt-3 max-h-72 w-full overflow-y-auto rounded-lg border border-neutral-100 bg-white"
              : "absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
          }
        >
          {results.length === 0 && (
            <li className="px-3 py-2 text-sm text-neutral-500">No se encontraron alimentos.</li>
          )}
          {results.map((food, i) => (
            <li
              key={food.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={food.id === value}
              // mousedown en vez de click: se elige antes de que el input pierda el foco.
              onMouseDown={(e) => {
                e.preventDefault();
                choose(food);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm ${
                inline ? "border-b border-neutral-100 last:border-none" : ""
              } ${i === active ? "bg-brand-50" : ""}`}
            >
              <span className="text-lg">{food.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-neutral-800">{food.name}</span>
                <span className="block truncate text-xs text-neutral-500">{food.category}</span>
              </span>
              {food.id === value && <CheckIcon className="shrink-0 text-brand-700" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
