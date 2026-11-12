import type { ComponentProps } from "react";
import type { Sport } from "@/lib/sports";
import {
  SportBasketballIcon,
  SportCyclingIcon,
  SportFootballIcon,
  SportOtherIcon,
  SportPadelIcon,
  SportRugbyIcon,
  SportRunningIcon,
  SportSwimmingIcon,
  SportTennisIcon,
  SportVolleyballIcon,
} from "./icons";

type IconProps = ComponentProps<typeof SportOtherIcon>;

const SPORT_ICONS: Record<Sport, (props: IconProps) => React.JSX.Element> = {
  FOOTBALL: SportFootballIcon,
  BASKETBALL: SportBasketballIcon,
  PADEL: SportPadelIcon,
  TENNIS: SportTennisIcon,
  RUNNING: SportRunningIcon,
  CYCLING: SportCyclingIcon,
  SWIMMING: SportSwimmingIcon,
  VOLLEYBALL: SportVolleyballIcon,
  RUGBY: SportRugbyIcon,
  OTHER: SportOtherIcon,
};

/** Ícono del deporte dentro de una ficha redondeada con el color de la marca. */
export default function SportIcon({
  sport,
  size = 18,
  className = "",
}: {
  sport: Sport;
  size?: number;
  className?: string;
}) {
  const Glyph = SPORT_ICONS[sport];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-lagoon-50 text-lagoon-700 ${className}`}
      style={{ width: size + 14, height: size + 14 }}
    >
      <Glyph size={size} />
    </span>
  );
}
