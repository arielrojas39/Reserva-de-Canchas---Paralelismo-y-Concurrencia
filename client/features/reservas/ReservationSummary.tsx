import type { ReactNode } from "react";
import { CalendarDays, Clock, Goal, Hash, Wallet } from "lucide-react";
import { ReservationStatusBadge } from "@/features/reservas/ReservationStatusBadge";
import { formatoPesos } from "@/lib/utils/formato";
import type { EstadoReserva } from "@/types";
import styles from "./ReservationSummary.module.scss";

export interface ReservationSummaryProps {
  canchaNombre: string;
  /** Fecha ya formateada (ej.: "Martes, 27 de octubre"). */
  fechaTexto: string;
  /** Franja horaria (ej.: "19:00 – 20:00"). */
  horaTexto: string;
  /** Código de reserva (feedback de éxito de creación). */
  idReserva?: string;
  /** Estado a destacar (usa ReservationStatusBadge). */
  estado?: EstadoReserva;
  /** Importe; solo se muestra si está definido en los datos. */
  importe?: number;
  /** Acciones opcionales debajo del resumen. */
  children?: ReactNode;
}

/** Resumen legible de la reserva: cancha, fecha, hora e importe. */
export function ReservationSummary({
  canchaNombre,
  fechaTexto,
  horaTexto,
  idReserva,
  estado,
  importe,
  children,
}: ReservationSummaryProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <p className={styles.title}>Resumen de la reserva</p>
        {estado && <ReservationStatusBadge estado={estado} />}
      </div>

      <dl className={styles.lista}>
        <div className={styles.fila}>
          <dt className={styles.etiqueta}>
            <Goal size={16} aria-hidden="true" />
            Cancha
          </dt>
          <dd className={styles.valor}>{canchaNombre}</dd>
        </div>
        <div className={styles.fila}>
          <dt className={styles.etiqueta}>
            <CalendarDays size={16} aria-hidden="true" />
            Fecha
          </dt>
          <dd className={styles.valor}>{fechaTexto}</dd>
        </div>
        <div className={styles.fila}>
          <dt className={styles.etiqueta}>
            <Clock size={16} aria-hidden="true" />
            Hora
          </dt>
          <dd className={styles.valor}>{horaTexto}</dd>
        </div>
        {importe != null && (
          <div className={styles.fila}>
            <dt className={styles.etiqueta}>
              <Wallet size={16} aria-hidden="true" />
              Importe
            </dt>
            <dd className={styles.valor}>{formatoPesos(importe)}</dd>
          </div>
        )}
        {idReserva && (
          <div className={styles.fila}>
            <dt className={styles.etiqueta}>
              <Hash size={16} aria-hidden="true" />
              Reserva
            </dt>
            <dd className={`${styles.valor} ${styles.id}`}>{idReserva}</dd>
          </div>
        )}
      </dl>

      {children}
    </div>
  );
}
