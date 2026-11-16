"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { AddScheduleModal } from "@/features/admin/AddScheduleModal";
import { ConfirmDeleteModal } from "@/features/admin/ConfirmDeleteModal";
import { agregarHorario, eliminarHorario, finDesdeInicio } from "@/lib/services/horarios.service";
import styles from "./ScheduleManager.module.scss";

export interface ScheduleManagerProps {
  canchaId: string;
  canchaNombre: string;
  /** Horarios habilitados (inicios HH:MM ordenados). */
  horarios: string[];
  /** Se ejecuta tras cualquier cambio, para que el padre refresque. */
  onCambio: () => void;
}

/**
 * Gestor de horarios de una cancha (demo): lista las franjas
 * habilitadas, permite agregar (AddScheduleModal) y eliminar con
 * confirmación (ConfirmDeleteModal), con estados de guardado.
 */
export function ScheduleManager({
  canchaId,
  canchaNombre,
  horarios,
  onCambio,
}: ScheduleManagerProps) {
  const [agregando, setAgregando] = useState(false);
  const [eliminando, setEliminando] = useState<string | null>(null);

  const handleAgregado = () => {
    setAgregando(false);
    toast.success("Horario agregado (demo)");
    onCambio();
  };

  const handleEliminado = () => {
    setEliminando(null);
    toast.success("Horario eliminado (demo)");
    onCambio();
  };

  return (
    <div className={styles.manager}>
      <div className={styles.header}>
        <span className={styles.titulo}>Horarios habilitados</span>
        <Button variant="outline" size="sm" onClick={() => setAgregando(true)}>
          <Plus size={16} aria-hidden="true" />
          Agregar horario
        </Button>
      </div>

      {horarios.length === 0 ? (
        <p className={styles.vacio}>Sin horarios habilitados. Agregá uno para ofrecer turnos.</p>
      ) : (
        <ul className={styles.lista} aria-label={`Horarios de ${canchaNombre}`}>
          {horarios.map((inicio) => (
            <li key={inicio} className={styles.chip}>
              <span className={styles.hora}>
                {inicio} – {finDesdeInicio(inicio)}
              </span>
              <button
                type="button"
                className={styles.botonEliminar}
                aria-label={`Eliminar horario ${inicio} de ${canchaNombre}`}
                onClick={() => setEliminando(inicio)}
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {agregando && (
        <AddScheduleModal
          canchaNombre={canchaNombre}
          existentes={horarios}
          onAgregar={(inicio) => agregarHorario(canchaId, inicio)}
          onAgregado={handleAgregado}
          onCerrar={() => setAgregando(false)}
        />
      )}

      {eliminando && (
        <ConfirmDeleteModal
          titulo="Eliminar horario"
          mensaje={`Se quitará el horario ${eliminando} de ${canchaNombre}. Los turnos ya reservados no se modifican.`}
          onConfirmar={() => eliminarHorario(canchaId, eliminando)}
          onEliminado={handleEliminado}
          onCerrar={() => setEliminando(null)}
        />
      )}
    </div>
  );
}
