import { Alert, EmptyState, Skeleton } from "@/components/ui";
import { ReservationStatusBadge } from "@/features/reservas/ReservationStatusBadge";
import type { ReservaAdmin } from "@/lib/services/reservas.service";
import styles from "./AdminReservationsTable.module.scss";

export interface AdminReservationsTableProps {
  /** Reservas filtradas; null = cargando. */
  reservas: ReservaAdmin[] | null;
  /** Error simulado de carga (demo). */
  error?: boolean;
  /** Vacío por filtros (cambia el mensaje del estado vacío). */
  vacioPorFiltros?: boolean;
}

/**
 * Tabla responsive de reservas (vista admin). En escritorio es una
 * tabla semántica; en móvil las filas se convierten en cards usando
 * data-label en cada celda.
 */
export function AdminReservationsTable({
  reservas,
  error = false,
  vacioPorFiltros = false,
}: AdminReservationsTableProps) {
  if (error) {
    return (
      <Alert variant="error" title="No pudimos cargar las reservas">
        Revisá la conexión con la API e intentá nuevamente.
      </Alert>
    );
  }

  if (!reservas) {
    return (
      <div className={styles.cargando} aria-busy="true">
        <Skeleton height="48px" radius="10px" />
        <Skeleton height="48px" radius="10px" />
        <Skeleton height="48px" radius="10px" />
        <Skeleton height="48px" radius="10px" />
      </div>
    );
  }

  if (reservas.length === 0) {
    return (
      <EmptyState
        title={vacioPorFiltros ? "No hay reservas que coincidan" : "No hay reservas"}
        description={
          vacioPorFiltros
            ? "Probá con otros criterios de búsqueda o limpiá los filtros."
            : "Cuando se creen reservas, van a aparecer acá."
        }
      />
    );
  }

  return (
    <div className={styles.wrap}>
      <table className={styles.tabla}>
        <caption className={styles.caption}>Listado de reservas</caption>
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Usuario</th>
            <th scope="col">Correo</th>
            <th scope="col">Cancha</th>
            <th scope="col">Fecha</th>
            <th scope="col">Hora</th>
            <th scope="col">Estado</th>
          </tr>
        </thead>
        <tbody>
          {reservas.map(({ reserva, cancha, usuario }) => (
            <tr key={reserva.id}>
              <td data-label="ID" className={styles.id}>
                {reserva.id}
              </td>
              <td data-label="Usuario">{usuario?.nombre ?? "Usuario"}</td>
              <td data-label="Correo" className={styles.correo}>
                {usuario?.email ?? "—"}
              </td>
              <td data-label="Cancha">{cancha?.nombre ?? "Cancha"}</td>
              <td data-label="Fecha">{reserva.fecha}</td>
              <td data-label="Hora">
                {reserva.inicio && reserva.fin ? `${reserva.inicio} – ${reserva.fin}` : "—"}
              </td>
              <td data-label="Estado">
                <ReservationStatusBadge estado={reserva.estado} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
