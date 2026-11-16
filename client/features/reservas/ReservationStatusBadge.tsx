import { Ban, CheckCheck, CircleCheck, CircleX, Hourglass, LoaderCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui";
import type { EstadoReserva } from "@/types";
import styles from "./ReservationStatusBadge.module.scss";

interface EstadoUi {
  texto: string;
  variante: BadgeVariant;
  icono: LucideIcon;
}

/** Mapa estado de reserva → badge con texto e icono (no solo color). */
const ESTADOS: Record<EstadoReserva, EstadoUi> = {
  pendiente: {
    texto: "Pendiente de pago",
    variante: "warning",
    icono: Hourglass,
  },
  pagando: {
    texto: "Pagando",
    variante: "info",
    icono: LoaderCircle,
  },
  confirmada: {
    texto: "Confirmada",
    variante: "success",
    icono: CircleCheck,
  },
  completada: {
    texto: "Completada",
    variante: "info",
    icono: CheckCheck,
  },
  cancelada: {
    texto: "Cancelada",
    variante: "error",
    icono: CircleX,
  },
  expirada: {
    texto: "Expirada",
    variante: "neutral",
    icono: Ban,
  },
};

export interface ReservationStatusBadgeProps {
  estado: EstadoReserva;
  className?: string;
}

/** Badge reutilizable del estado de una reserva (texto + icono). */
export function ReservationStatusBadge({ estado, className }: ReservationStatusBadgeProps) {
  const ui = ESTADOS[estado];
  const Icono = ui.icono;

  return (
    <Badge variant={ui.variante} className={className}>
      <Icono
        size={12}
        aria-hidden="true"
        className={estado === "pagando" ? styles.girando : undefined}
      />
      {ui.texto}
    </Badge>
  );
}
