import { Check, Goal } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Cancha } from "@/types";
import styles from "./CourtFilters.module.scss";

export interface CourtFiltersProps {
  canchas: Cancha[];
  seleccionadaId: string;
  onSelect: (canchaId: string) => void;
}

/** Selección de cancha activa (chips con estado aria-pressed). */
export function CourtFilters({ canchas, seleccionadaId, onSelect }: CourtFiltersProps) {
  return (
    <div className={styles.block} role="group" aria-label="Elegí una cancha">
      <p className={styles.label}>Elegí una cancha</p>
      <div className={styles.chips}>
        {canchas.map((cancha) => {
          const activa = cancha.id === seleccionadaId;
          return (
            <button
              key={cancha.id}
              type="button"
              aria-pressed={activa}
              className={cn(styles.chip, activa && styles.chipActiva)}
              onClick={() => onSelect(cancha.id)}
            >
              <Goal size={16} aria-hidden="true" />
              <span>{cancha.nombre}</span>
              {activa && <Check size={14} aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
