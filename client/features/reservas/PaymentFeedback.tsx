import { Button } from "@/components/ui";
import { ReservationSummary } from "@/features/reservas/ReservationSummary";
import type { ResultadoPago } from "@/lib/services/pagos.service";
import { formatFechaLarga } from "@/lib/utils/fecha";
import type { DatosReservaDemo } from "@/lib/services/reservas.service";
import styles from "./PaymentFeedback.module.scss";

export interface PaymentFeedbackProps {
  resultado: ResultadoPago;
  /** Datos de la reserva en pago (snapshot). */
  datos: DatosReservaDemo;
  /** Vuelve al formulario (500). */
  onReintentar: () => void;
  onCerrar: () => void;
}

interface EstadoPagoUi {
  titulo: string;
  mensaje: string;
}

/** Mapa código de pago → mensaje de feedback. */
const ESTADOS_PAGO: Record<ResultadoPago["codigo"], EstadoPagoUi> = {
  200: {
    titulo: "Pago aprobado",
    mensaje: "¡El pago se aprobó! Tu reserva quedó confirmada.",
  },
  402: {
    titulo: "Pago rechazado",
    mensaje: "El pago fue rechazado. Tu reserva quedó cancelada.",
  },
  409: {
    titulo: "Pago duplicado",
    mensaje: "Esta reserva ya fue pagada. No hace falta realizar otro pago.",
  },
  410: {
    titulo: "Reserva no disponible",
    mensaje: "La reserva expiró o ya no se encuentra disponible. Elegí un nuevo horario.",
  },
  500: {
    titulo: "Error en el pago",
    mensaje: "Ocurrió un error simulado al procesar el pago. Intentá nuevamente.",
  },
};

/** Interfaz de resultado del pago simulado. */
export function PaymentFeedback({
  resultado,
  datos,
  onReintentar,
  onCerrar,
}: PaymentFeedbackProps) {
  const estado = ESTADOS_PAGO[resultado.codigo];
  const { codigo, reserva } = resultado;

  return (
    <div className={styles.wrap}>
      <div
        className={`${styles.alerta} ${
          codigo === 200 ? styles.exito : codigo === 500 ? styles.error : styles.otros
        }`}
        role={codigo === 500 ? "alert" : "status"}
      >
        <p className={styles.titulo}>{estado.titulo}</p>
        <p className={styles.mensaje}>{estado.mensaje}</p>
        <p className={styles.codigo} aria-hidden="true">
          Respuesta simulada: HTTP {codigo}
        </p>
      </div>

      {(codigo === 200 || codigo === 402) && reserva && (
        <ReservationSummary
          canchaNombre={datos.canchaNombre}
          fechaTexto={formatFechaLarga(datos.fecha)}
          horaTexto={`${datos.inicio} – ${datos.fin}`}
          idReserva={reserva.id}
          estado={reserva.estado}
          importe={datos.montoTotal}
        />
      )}

      <div className={styles.acciones}>
        {codigo === 500 && <Button onClick={onReintentar}>Intentar de nuevo</Button>}
        <Button variant="outline" onClick={onCerrar}>
          Cerrar
        </Button>
      </div>
    </div>
  );
}
