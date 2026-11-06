import { CircleCheck } from "lucide-react";
import { Alert, Skeleton } from "@/components/ui";
import { TimeSlot, type EstadoSlot } from "@/features/canchas/TimeSlot";
import { formatFechaLarga } from "@/lib/utils/fecha";
import type { Horario } from "@/types";
import styles from "./AvailabilityGrid.module.scss";

export interface AvailabilityGridProps {
  /** Estado de consulta (simulado). */
  cargando: boolean;
  /** Horarios de la fecha activa; null mientras no hay resultado. */
  horarios: Horario[] | null;
  /** Clave de fecha activa (YYYY-MM-DD). */
  fecha: string | null;
  canchaNombre: string;
  seleccionado: Horario | null;
  onSelect: (horario: Horario) => void;
}

/**
 * Grilla de horarios con sus estados: cargando (skeleton), sin
 * disponibilidad (mensaje informativo) y libre/ocupado/seleccionado
 * (etiquetas con icono en cada slot). El resumen y la acción de
 * reservar los renderiza el orquestador debajo de la grilla.
 */
export function AvailabilityGrid({
  cargando,
  horarios,
  fecha,
  canchaNombre,
  seleccionado,
  onSelect,
}: AvailabilityGridProps) {
  if (cargando || !fecha) {
    return (
      <div className={styles.cargando} aria-busy="true">
        <span className={styles.cargandoLabel}>Cargando horarios…</span>
        <div className={styles.grid}>
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} height="76px" radius="10px" />
          ))}
        </div>
      </div>
    );
  }

  const libres = horarios?.filter((h) => h.disponible) ?? [];

  if (horarios && horarios.length === 0) {
    return (
      <Alert variant="warning" title="Sin horarios habilitados">
        {canchaNombre} no tiene horarios habilitados en la demostración. Un administrador puede
        agregarlos desde el panel.
      </Alert>
    );
  }

  if (libres.length === 0) {
    return (
      <Alert variant="warning" title="Sin disponibilidad para esta fecha">
        No quedan horarios libres en {canchaNombre} el {formatFechaLarga(fecha)}. Probá con otro día
        del selector.
      </Alert>
    );
  }

  return (
    <div className={styles.wrap}>
      <ul className={styles.grid} aria-label="Horarios disponibles">
        {horarios?.map((horario) => {
          const estado: EstadoSlot = !horario.disponible
            ? "ocupado"
            : horario.id === seleccionado?.id
              ? "seleccionado"
              : "libre";

          return (
            <li key={horario.id}>
              <TimeSlot horario={horario} estado={estado} onSelect={onSelect} />
            </li>
          );
        })}
      </ul>

      {seleccionado ? null : (
        <p className={styles.ayuda}>
          <CircleCheck size={16} aria-hidden="true" />
          <span>
            Elegí un horario <strong>libre</strong> para verlo destacado. Los horarios ocupados
            aparecen deshabilitados.
          </span>
        </p>
      )}
    </div>
  );
}
