import { CourtCard } from "@/features/canchas/CourtCard";
import type { EstadoDisponibilidadUi } from "@/features/canchas/canchas.types";
import type { Cancha } from "@/types";
import styles from "./CourtList.module.scss";

export interface CourtListProps {
  canchas: Cancha[];
  /** Estado por cancha (undefined = cargando). */
  estados: Record<string, EstadoDisponibilidadUi | undefined>;
  seleccionadaId: string;
  onSelect: (canchaId: string) => void;
}

/** Grilla responsive de cards de canchas. */
export function CourtList({ canchas, estados, seleccionadaId, onSelect }: CourtListProps) {
  return (
    <ul className={styles.grid} aria-label="Listado de canchas">
      {canchas.map((cancha, index) => (
        <li key={cancha.id}>
          <CourtCard
            cancha={cancha}
            estado={estados[cancha.id]}
            seleccionada={cancha.id === seleccionadaId}
            onSelect={onSelect}
            priority={index === 0}
          />
        </li>
      ))}
    </ul>
  );
}
