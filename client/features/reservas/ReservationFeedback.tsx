import { Button } from "@/components/ui";
import { ReservationStatus } from "@/features/reservas/ReservationStatus";
import { ReservationSummary } from "@/features/reservas/ReservationSummary";
import type { DatosReservaDemo, ResultadoReserva } from "@/lib/services/reservas.service";
import { formatFechaLarga } from "@/lib/utils/fecha";
import { apiHabilitada } from "@/lib/api/config";
import styles from "./ReservationFeedback.module.scss";

export interface ReservationFeedbackProps {
  resultado: ResultadoReserva;
  /** Datos de la reserva que se intentó crear. */
  datos: DatosReservaDemo;
  /** Vuelve al formulario (422/503). */
  onReintentar: () => void;
  onCerrar: () => void;
}

const PERMITE_REINTENTAR = [422, 503];

/** Feedback final del proceso de reserva según el código de respuesta. */
export function ReservationFeedback({
  resultado,
  datos,
  onReintentar,
  onCerrar,
}: ReservationFeedbackProps) {
  const { codigo, reserva } = resultado;
  const apiMode = apiHabilitada();

  return (
    <div className={styles.wrap}>
      <ReservationStatus codigo={codigo} apiMode={apiMode} mensaje={resultado.error} />

      {codigo === 201 && reserva && (
        <>
          <ReservationSummary
            canchaNombre={datos.canchaNombre}
            fechaTexto={formatFechaLarga(datos.fecha)}
            horaTexto={`${datos.inicio} – ${datos.fin}`}
            idReserva={reserva.id}
            estado={reserva.estado}
          />
          <p className={styles.pista}>
            {apiMode ? (
              "La reserva quedó pendiente de pago. Podés pagarla con Mercado Pago desde Mis reservas."
            ) : (
              <>
                La reserva quedó <strong>pendiente de pago</strong>: completá el pago desde Mis
                reservas antes de que venza el plazo.
              </>
            )}
          </p>
        </>
      )}

      <div className={styles.acciones}>
        {codigo === 201 ? (
          <Button href="/mis-reservas">Ver mis reservas</Button>
        ) : codigo === 401 ? (
          <Button href="/login">Iniciar sesión</Button>
        ) : (
          PERMITE_REINTENTAR.includes(codigo) && (
            <Button onClick={onReintentar}>Intentar de nuevo</Button>
          )
        )}
        <Button variant="outline" onClick={onCerrar}>
          Cerrar
        </Button>
      </div>
    </div>
  );
}
