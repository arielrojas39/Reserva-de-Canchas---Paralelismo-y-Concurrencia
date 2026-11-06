import { Check, CheckCheck, Lock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Horario } from "@/types";
import styles from "./TimeSlot.module.scss";

export type EstadoSlot = "libre" | "ocupado" | "seleccionado";

export interface TimeSlotProps {
  horario: Horario;
  estado: EstadoSlot;
  onSelect: (horario: Horario) => void;
}

const ESTADO_UI: Record<EstadoSlot, { texto: string; className: string }> = {
  libre: { texto: "Libre", className: styles.libre },
  ocupado: { texto: "Ocupado", className: styles.ocupado },
  seleccionado: { texto: "Seleccionado", className: styles.seleccionado },
};

function IconoSlot({ estado }: { estado: EstadoSlot }) {
  if (estado === "ocupado") return <Lock size={14} aria-hidden="true" />;
  if (estado === "seleccionado") return <CheckCheck size={14} aria-hidden="true" />;
  return <Check size={14} aria-hidden="true" />;
}

/**
 * Turno individual de la grilla. El estado NO depende solo del color:
 * cada slot muestra icono + etiqueta de texto ("Libre", "Ocupado",
 * "Seleccionado").
 */
export function TimeSlot({ horario, estado, onSelect }: TimeSlotProps) {
  const ui = ESTADO_UI[estado];
  const ocupado = estado === "ocupado";

  return (
    <button
      type="button"
      className={cn(styles.slot, ui.className)}
      disabled={ocupado}
      aria-pressed={estado === "seleccionado"}
      onClick={() => onSelect(horario)}
    >
      <span className={styles.hora}>
        {horario.inicio}
        <span className={styles.fin}>– {horario.fin}</span>
      </span>
      <span className={styles.estado}>
        <IconoSlot estado={estado} />
        {ui.texto}
      </span>
    </button>
  );
}
