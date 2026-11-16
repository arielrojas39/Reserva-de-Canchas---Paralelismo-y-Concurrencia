"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock, Users } from "lucide-react";
import { Card, EmptyState, Skeleton } from "@/components/ui";
import { ReservationStatusBadge } from "@/features/reservas/ReservationStatusBadge";
import { obtenerReservasParaAdmin } from "@/lib/services/reservas.service";
import type { ReservaAdmin } from "@/lib/services/reservas.service";
import styles from "./RecentReservations.module.scss";

export interface RecentReservationsProps {
  /** Cantidad máxima de reservas a mostrar (por defecto,5). */
  limite?: number;
}

/**
 * Últimas reservas reales (vista administrativa). El estado de
 * carga se deriva de la ausencia de resultado; sin setState síncronos
 * en efectos.
 */
export function RecentReservations({ limite = 5 }: RecentReservationsProps) {
  const [reservas, setReservas] = useState<ReservaAdmin[] | null>(null);

  useEffect(() => {
    let cancelado = false;

    obtenerReservasParaAdmin().then((todas) => {
      if (!cancelado) setReservas(todas);
    });

    return () => {
      cancelado = true;
    };
  }, []);

  if (!reservas) {
    return (
      <div className={styles.cargando} aria-busy="true">
        <Skeleton height="64px" radius="10px" />
        <Skeleton height="64px" radius="10px" />
        <Skeleton height="64px" radius="10px" />
      </div>
    );
  }

  if (reservas.length === 0) {
    return (
      <EmptyState
        title="No hay reservas todavía"
        description="Cuando se creen reservas, van a aparecer acá."
      />
    );
  }

  return (
    <ul className={styles.lista} aria-label="Últimas reservas">
      {reservas.slice(0, limite).map(({ reserva, cancha, usuario }) => (
        <li key={reserva.id}>
          <Card className={styles.item}>
            <div className={styles.fila}>
              <span className={styles.cancha}>{cancha?.nombre ?? "Cancha"}</span>
              <ReservationStatusBadge estado={reserva.estado} />
            </div>
            <div className={styles.meta}>
              <span>
                <CalendarDays size={14} aria-hidden="true" />
                {reserva.fecha}
              </span>
              {reserva.inicio && (
                <span>
                  <Clock size={14} aria-hidden="true" />
                  {reserva.inicio} – {reserva.fin}
                </span>
              )}
              <span>
                <Users size={14} aria-hidden="true" />
                {usuario?.nombre ?? "Usuario"}
              </span>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
