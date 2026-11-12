"use client";

import { useEffect, useRef, useState } from "react";

/** Ancho real del contenedor, para dibujar el SVG en píxeles (el texto no se escala). */
export function useChartWidth<T extends HTMLElement>(fallback = 600) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(Math.max(240, el.clientWidth));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

export function ChartCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-neutral-800">{title}</h2>
          {subtitle && <p className="text-xs text-neutral-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Leyenda: la muestra de color va al lado del texto; el texto nunca lleva el color. */
export function Legend({ items }: { items: { label: string; color: string; shape?: "box" | "line" }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          {item.shape === "line" ? (
            <span className="h-0.5 w-4 rounded-full" style={{ background: item.color }} />
          ) : (
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: item.color }} />
          )}
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export interface TooltipState {
  x: number;
  y: number;
  content: React.ReactNode;
}

/** Tooltip flotante dentro de un contenedor `relative`, sin salirse por los costados. */
export function ChartTooltip({ tip, width }: { tip: TooltipState | null; width: number }) {
  if (!tip) return null;
  const TIP_W = 200;
  const left = Math.min(Math.max(tip.x - TIP_W / 2, 0), width - TIP_W);
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-700 shadow-md"
      style={{ left, top: tip.y, width: TIP_W, transform: "translateY(calc(-100% - 8px))" }}
    >
      {tip.content}
    </div>
  );
}

/**
 * Barra vertical con la punta redondeada (4 px) y la base recta. `y0` es la base y `y1` la
 * punta; funciona hacia arriba o hacia abajo.
 */
export function barPath(x: number, w: number, y0: number, y1: number, r = 4): string {
  const h = Math.abs(y1 - y0);
  const rr = Math.min(r, h, w / 2);
  if (h < 0.5) return "";
  if (y1 < y0) {
    return `M${x},${y0}V${y1 + rr}Q${x},${y1} ${x + rr},${y1}H${x + w - rr}Q${x + w},${y1} ${x + w},${y1 + rr}V${y0}Z`;
  }
  return `M${x},${y0}V${y1 - rr}Q${x},${y1} ${x + rr},${y1}H${x + w - rr}Q${x + w},${y1} ${x + w},${y1 - rr}V${y0}Z`;
}

/** Barra horizontal desde x0 hasta x1 con la punta derecha redondeada. */
export function hbarPath(x0: number, x1: number, y: number, h: number, r = 4): string {
  const w = x1 - x0;
  const rr = Math.min(r, w, h / 2);
  if (w < 0.5) return "";
  return `M${x0},${y}H${x1 - rr}Q${x1},${y} ${x1},${y + rr}V${y + h - rr}Q${x1},${y + h} ${x1 - rr},${y + h}H${x0}Z`;
}

/** Ticks "redondos" para un eje entre min y max. */
export function niceTicks(min: number, max: number, count = 4): number[] {
  const span = max - min || 1;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const ticks: number[] = [];
  for (let t = Math.ceil(min / step) * step; t <= max + 1e-9; t += step) ticks.push(Math.round(t * 1000) / 1000);
  return ticks;
}

/** Cada cuántos días poner una etiqueta en el eje X para que no se pisen. */
export const labelEvery = (n: number, width: number) => Math.max(1, Math.ceil((n * 44) / width));

export const GRID = "var(--color-neutral-200)";
export const AXIS_TEXT = "var(--color-neutral-500)";
