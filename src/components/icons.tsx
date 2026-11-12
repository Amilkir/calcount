import type { SVGProps } from "react";

/**
 * Set de íconos propio de Calcount: grilla de 24, trazo de 2 px con puntas redondeadas
 * y color heredado (currentColor). Decorativos por defecto: quien necesite texto
 * accesible lo pone en el elemento padre.
 */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 16, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Gota: agua e hidratación. */
export function DropIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5c3.6 4.3 6 7.6 6 10.6a6 6 0 0 1-12 0c0-3 2.4-6.3 6-10.6Z" />
      <path d="M9.2 14.6a2.9 2.9 0 0 0 2.3 2.6" />
    </Icon>
  );
}

/** Cápsula: suplementos. */
export function CapsuleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="8.5" width="17" height="7" rx="3.5" transform="rotate(-45 12 12)" />
      <path d="M9.5 9.5l5 5" />
    </Icon>
  );
}

/** Llama: la marca (calorías). Sólida, para que funcione chica y como favicon. */
export function FlameIcon(props: IconProps) {
  return (
    <Icon {...props} fill="currentColor" stroke="none">
      <path d="M12.6 2.5c.5 3 4.9 5.3 4.9 10.6a5.5 5.5 0 0 1-11 0c0-2.6 1.2-4.4 2.6-5.7.1 1.9.9 3 2 3.4-.6-3 .1-5.9 1.5-8.3Z" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M15.5 4.5l4 4L8 20H4v-4L15.5 4.5Z" />
    </Icon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10.3 4.3 2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />
      <path d="M12 10v4M12 17.2v.01" />
    </Icon>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M15 5l-7 7 7 7" />
    </Icon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 5l7 7-7 7" />
    </Icon>
  );
}

// --- Deportes: mismo lenguaje que el resto del set (grilla de 24, trazo de 2 px). ---

/** Pelota de fútbol. */
export function SportFootballIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5"/>
      <path d="M12 9.3l2.57 1.87-.98 3.03h-3.18l-.98-3.03Z" fill="currentColor" strokeWidth="1"/>
      <path d="M12 9.3V5.6M14.57 11.17l3.6-1.17M13.59 14.2l2.2 3.05M10.41 14.2l-2.2 3.05M9.43 11.17 5.83 10"/>
    </Icon>
  );
}

/** Pelota de básquet. */
export function SportBasketballIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5"/>
      <path d="M12 3.5v17M3.5 12h17"/>
      <path d="M5.8 6.2c2.2 1.6 3.2 3.6 3.2 5.8s-1 4.2-3.2 5.8M18.2 6.2c-2.2 1.6-3.2 3.6-3.2 5.8s1 4.2 3.2 5.8"/>
    </Icon>
  );
}

/** Paleta de pádel con pelota. */
export function SportPadelIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <g transform="rotate(-25 10 12)">
      <rect x="5" y="2.5" width="10" height="12" rx="5"/>
      <path d="M10 14.5v6.5"/>
      <circle cx="8.3" cy="7" r="0.6" fill="currentColor" stroke="none"/>
      <circle cx="11.7" cy="7" r="0.6" fill="currentColor" stroke="none"/>
      <circle cx="10" cy="9.5" r="0.6" fill="currentColor" stroke="none"/>
      <circle cx="8.3" cy="12" r="0.6" fill="currentColor" stroke="none"/>
      <circle cx="11.7" cy="12" r="0.6" fill="currentColor" stroke="none"/>
      </g>
      <circle cx="19" cy="18" r="2"/>
    </Icon>
  );
}

/** Raqueta de tenis con pelota. */
export function SportTennisIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <ellipse cx="9.5" cy="9.5" rx="5.8" ry="4.4" transform="rotate(45 9.5 9.5)"/>
      <path d="M13.6 13.6l5.9 5.9"/>
      <path d="M6.95 6.95l5.1 5.1M6.4 10.1l3.7-3.7M8.9 12.6l3.7-3.7" strokeWidth="1.3"/>
      <circle cx="18.5" cy="5.5" r="2"/>
    </Icon>
  );
}

/** Zapatilla con líneas de velocidad: running. */
export function SportRunningIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6.5 17.5H20a1.5 1.5 0 0 0 1.5-1.5v-.4a2 2 0 0 0-1.5-1.9l-4.5-1.2-2.3-3.3a1.2 1.2 0 0 0-1.6-.4L10 10 8.6 8.8a1 1 0 0 0-1.5.2L6.5 10.5Z"/>
      <path d="M6.5 15h15M12.3 11.4l1.4-.9"/>
      <path d="M2 11h2.5M1.5 14.5h3M2.5 17.5h1.5"/>
    </Icon>
  );
}

/** Bicicleta. */
export function SportCyclingIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="5.5" cy="16" r="3.5"/>
      <circle cx="18.5" cy="16" r="3.5"/>
      <path d="M5.5 16 9 9.5l2 6.5M5.5 16H11l4.5-6.5M9 9.5h6.5l3 6.5M7.8 8h2.6M15.5 9.5 15 7.3h2"/>
    </Icon>
  );
}

/** Nadador sobre el agua. */
export function SportSwimmingIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="17.5" cy="9" r="1.8"/>
      <path d="M4.5 13 8.5 7.5l4.5 4 3.5 1.5"/>
      <path d="M2 16.5c1.7 0 1.7 1 3.3 1s1.7-1 3.4-1 1.7 1 3.3 1 1.7-1 3.3-1 1.7 1 3.4 1 1.6-1 3.3-1M2 20.5c1.7 0 1.7 1 3.3 1s1.7-1 3.4-1 1.7 1 3.3 1 1.7-1 3.3-1 1.7 1 3.4 1 1.6-1 3.3-1"/>
    </Icon>
  );
}

/** Pelota de vóley. */
export function SportVolleyballIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5"/>
      <path d="M12 12c0-3.5 1.6-6.5 4.3-8M12 12c-3 1.8-6.4 1.9-9.2.6M12 12c3 1.7 4.7 4.7 4.9 7.9"/>
    </Icon>
  );
}

/** Pelota de rugby. */
export function SportRugbyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <ellipse cx="12" cy="12" rx="9.5" ry="5.5" transform="rotate(-45 12 12)"/>
      <path d="M9.2 14.8l5.6-5.6"/>
      <path d="M10.2 12.4l1.4 1.4M11.3 11.3l1.4 1.4M12.4 10.2l1.4 1.4" strokeWidth="1.5"/>
    </Icon>
  );
}

/** Medalla: otro deporte. */
export function SportOtherIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 2.5l4 6.5 4-6.5"/>
      <circle cx="12" cy="15.5" r="5.5"/>
      <path d="M12 13.2l.8 1.6 1.8.3-1.3 1.2.3 1.8-1.6-.8-1.6.8.3-1.8-1.3-1.2 1.8-.3Z" fill="currentColor" strokeWidth="1"/>
    </Icon>
  );
}

/** Barras con línea de tendencia: estadísticas. */
export function ChartIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 20h16" />
      <path d="M7 16v-3M12 16V9M17 16v-5" />
      <path d="M5 8.5l4.5-3 4 2.5L19 4" />
    </Icon>
  );
}
