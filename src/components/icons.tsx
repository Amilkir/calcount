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
