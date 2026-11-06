import { CalendarDays, Clock, MapPin, Wallet } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { ExpirationCountdown } from "@/features/reservas/ExpirationCountdown";
import { ReservationStatusBadge } from "@/features/reservas/ReservationStatusBadge";
import { formatFechaLarga } from "@/lib/utils/fecha";
import { formatoPesos } from "@/lib/utils/formato";
import type { ReservaVista } from "@/lib/services/reservas.service";
import styles from "./ReservationCard.module.scss";

export interface ReservationCardProps {
  vista: ReservaVista;
  /** Abre el modal de pago (solo reservas pendientes). */
  onPagar: (vista: ReservaVista) => void;
  /** Se dispara cuando el plazo de pago vence. */
  onExpirada: (reservaId: string) => void;
  /** Abre la confirmación de cancelación contra la API. */
  onCancelar?: (vista: ReservaVista) => void;
  pagoDisponible?: boolean;
  pagoReal?: boolean;
  pagoEnCurso?: boolean;
  cancelacionDisponible?: boolean;
}

/** Card de "Mis reservas": datos, estado, vencimiento y acciones. */
export function ReservationCard({
  vista,
  onPagar,
  onExpirada,
  onCancelar,
  pagoDisponible = true,
  pagoReal = false,
  pagoEnCurso = false,
  cancelacionDisponible = false,
}: ReservationCardProps) {
  const { reserva, cancha } = vista;
  const horaTexto = reserva.inicio && reserva.fin ? `${reserva.inicio} – ${reserva.fin}` : "—";
  const esPagable = reserva.estado === "pendiente" || reserva.estado === "pagando";
  const esCancelable =
    cancelacionDisponible &&
    Boolean(onCancelar) &&
    (reserva.estado === "pendiente" || reserva.estado === "confirmada");

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.nombre}>{cancha?.nombre ?? "Cancha"}</h2>
        <ReservationStatusBadge estado={reserva.estado} />
      </div>

      <ul className={styles.datos}>
        <li>
          <CalendarDays size={16} aria-hidden="true" />
          {formatFechaLarga(reserva.fecha)}
        </li>
        <li>
          <Clock size={16} aria-hidden="true" />
          {horaTexto}
        </li>
        {cancha && (
          <li>
            <MapPin size={16} aria-hidden="true" />
            {cancha.direccion}
          </li>
        )}
        {reserva.montoTotal != null && (
          <li>
            <Wallet size={16} aria-hidden="true" />
            {formatoPesos(reserva.montoTotal)}
          </li>
        )}
      </ul>

      {reserva.estado === "pendiente" && reserva.expiracion && (
        <div className={styles.vencimiento}>
          <ExpirationCountdown
            expiracion={reserva.expiracion}
            onExpirar={() => onExpirada(reserva.id)}
          />
          <p className={styles.vencimientoInfo}>
            Importante: si no confirmás el pago a tiempo, la reserva expira y el horario vuelve a
            estar disponible.
          </p>
        </div>
      )}

      {reserva.estado === "expirada" && (
        <p className={styles.expiradaInfo}>
          El plazo de pago venció y este horario fue liberado. Podés reservar otro turno desde el
          catálogo.
        </p>
      )}

      <div className={styles.acciones}>
        {esPagable && pagoDisponible && (
          <Button
            fullWidth
            onClick={() => onPagar(vista)}
            isLoading={pagoEnCurso || reserva.estado === "pagando"}
          >
            {pagoEnCurso
              ? "Abriendo Mercado Pago…"
              : reserva.estado === "pagando"
                ? "Procesando pago…"
                : pagoReal
                  ? "Pagar con Mercado Pago"
                  : "Pagar"}
          </Button>
        )}
        {esPagable && !pagoDisponible && (
          <p className={styles.vencimientoInfo} role="status">
            El pago no está disponible en este entorno.
          </p>
        )}
        {esPagable && pagoDisponible && pagoReal && (
          <p className={styles.vencimientoInfo} role="status">
            Te vamos a redirigir al checkout seguro de Mercado Pago.
          </p>
        )}
        {esCancelable && onCancelar && (
          <Button variant="outline" fullWidth onClick={() => onCancelar(vista)}>
            Cancelar reserva
          </Button>
        )}
      </div>
    </Card>
  );
}
