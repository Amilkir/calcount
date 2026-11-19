"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Campo numérico único para toda la app.
 *
 * Usa type="text" + inputMode (no type="number") para que se vea y se comporte igual
 * en celular y en computador: acepta coma o punto como separador decimal, muestra
 * siempre coma (formato es-*) y no depende del idioma del navegador ni del teclado.
 */

/** "1,5" | "1.5" -> 1.5; vacío o incompleto ("," / ".") -> null. */
export function parseDecimal(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (normalized === "" || normalized === ".") return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

/** 1.5 -> "1,5" */
export function formatDecimal(value: number | null | undefined): string {
  return value == null ? "" : String(value).replace(".", ",");
}

function sanitize(raw: string, integer: boolean): string {
  if (integer) return raw.replace(/[^0-9]/g, "");
  let out = raw.replace(/[^0-9.,]/g, "");
  // Solo un separador decimal; se conserva el primero.
  const firstSep = out.search(/[.,]/);
  if (firstSep !== -1) {
    out = out.slice(0, firstSep + 1) + out.slice(firstSep + 1).replace(/[.,]/g, "");
  }
  return out;
}

type Props = {
  value: number | null;
  onValueChange: (value: number | null) => void;
  /** Solo enteros (minutos, porciones que rinde, calorías libres...). */
  integer?: boolean;
  min?: number;
  max?: number;
  className?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  id?: string;
  name?: string;
  "aria-label"?: string;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
};

export default function DecimalInput({
  value,
  onValueChange,
  integer = false,
  min,
  max,
  onBlur,
  ...rest
}: Props) {
  const [text, setText] = useState(() => formatDecimal(value));
  const ref = useRef<HTMLInputElement>(null);

  // Si el valor cambia desde fuera (reset, carga), se refleja; si coincide con lo
  // que se está escribiendo ("1," vs 1) no se pisa el texto.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setText((prev) => (parseDecimal(prev) === value ? prev : formatDecimal(value)));
  }, [value]);

  // La validación nativa de min/max no aplica a type="text"; se replica aquí.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let message = "";
    if (value != null) {
      if (min != null && value < min) message = `El valor mínimo es ${formatDecimal(min)}.`;
      else if (max != null && value > max) message = `El valor máximo es ${formatDecimal(max)}.`;
    } else if (text.trim() !== "") {
      message = "Ingresa un número válido.";
    }
    el.setCustomValidity(message);
  }, [value, min, max, text]);

  return (
    <input
      {...rest}
      ref={ref}
      type="text"
      inputMode={integer ? "numeric" : "decimal"}
      autoComplete="off"
      value={text}
      onChange={(e) => {
        const next = sanitize(e.target.value, integer);
        setText(next);
        onValueChange(parseDecimal(next));
      }}
      onBlur={(e) => {
        // Al salir se normaliza el formato ("1." -> "1", "1.5" -> "1,5").
        setText(formatDecimal(parseDecimal(text)));
        onBlur?.(e);
      }}
    />
  );
}
