import { Ban, CircleAlert, CircleCheck, TriangleAlert, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Alert } from "@/components/ui";
import type { AlertVariant } from "@/components/ui";
import type { CodigoRespuesta } from "@/lib/services/reservas.service";
import styles from "./ReservationStatus.module.scss";

interface EstadoReservaUi {
  titulo: string;
  mensaje: string;
  variante: AlertVariant;
  icono: LucideIcon;
}

/** Mapa código de respuesta → mensaje de feedback (textos del spec). */
const ESTADOS: Record<CodigoRespuesta, EstadoReservaUi> = {
  201: {
    titulo: "Reserva confirmada",
    mensaje: "¡Tu reserva fue creada correctamente!",
    variante: "success",
    icono: CircleCheck,
  },
  409: {
    titulo: "Horario no disponible",
    mensaje: "Este horario acaba de ser reservado por otra persona. Elegí otro horario.",
    variante: "warning",
    icono: TriangleAlert,
  },
  401: {
    titulo: "Sesión vencida",
    mensaje: "Tu sesión venció. Iniciá sesión nuevamente para continuar.",
    variante: "warning",
    icono: CircleAlert,
  },
  403: {
    titulo: "Sin permisos",
    mensaje: "Tu cuenta no tiene permiso para realizar esta acción.",
    variante: "error",
    icono: Ban,
  },
  410: {
    titulo: "Reserva vencida",
    mensaje: "La reserva ya no se encuentra disponible.",
    variante: "warning",
    icono: Ban,
  },
  422: {
    titulo: "Datos inválidos",
    mensaje: "Revisá los datos seleccionados e intentá nuevamente.",
    variante: "error",
    icono: CircleAlert,
  },
  503: {
    titulo: "Servicio no disponible",
    mensaje: "Hay muchas solicitudes en este momento. Intentá nuevamente.",
    variante: "error",
    icono: Wrench,
  },
};

export interface ReservationStatusProps {
  codigo: CodigoRespuesta;
  apiMode?: boolean;
  mensaje?: string;
}

/** Muestra el mensaje de feedback correspondiente a una respuesta. */
export function ReservationStatus({ codigo, apiMode = false, mensaje }: ReservationStatusProps) {
  const estadoBase = ESTADOS[codigo];
  const estado =
    apiMode && codigo === 201
      ? {
          ...estadoBase,
          titulo: "Reserva creada",
          mensaje: "Tu reserva fue registrada correctamente.",
        }
      : estadoBase;

  return (
    <div className={styles.wrap}>
      <Alert variant={estado.variante} title={estado.titulo}>
        {mensaje ?? estado.mensaje}
      </Alert>
      <p className={styles.codigo} aria-hidden="true">
        {apiMode ? "Respuesta del backend" : "Respuesta simulada"}: HTTP {codigo}
      </p>
    </div>
  );
}
