import { Badge, Button, Card } from "@/components/ui";
import { FORMATO_LABELS } from "@/features/canchas/CourtCard";
import { ScheduleManager } from "@/features/admin/ScheduleManager";
import { apiHabilitada } from "@/lib/api/config";
import type { Cancha } from "@/types";
import styles from "./CourtAdminCard.module.scss";

export interface CourtAdminCardProps {
  cancha: Cancha;
  /** Horarios habilitados (inicios HH:MM ordenados). */
  horarios: string[];
  /** Se ejecuta tras un cambio de horarios, para refrescar la lista. */
  onCambioHorarios: () => void;
  onEditar: () => void;
  onEliminar: () => void;
}

/** Card administrativa de cancha: datos, estado y gestión de horarios. */
export function CourtAdminCard({
  cancha,
  horarios,
  onCambioHorarios,
  onEditar,
  onEliminar,
}: CourtAdminCardProps) {
  return (
    <Card className={styles.card}>
      <div className={styles.encabezado}>
        <div className={styles.titulos}>
          <h3 className={styles.nombre}>{cancha.nombre}</h3>
          <div className={styles.badges}>
            <Badge variant={cancha.activa ? "success" : "neutral"}>
              {cancha.activa ? "Activa" : "Inactiva"}
            </Badge>
            <Badge variant="primary">{FORMATO_LABELS[cancha.formato]}</Badge>
          </div>
        </div>
      </div>

      <p className={styles.descripcion}>{cancha.descripcion}</p>
      <p className={styles.descripcion}>${cancha.precioPorHora.toLocaleString("es-AR")} / hora</p>
      <div className={styles.badges}>
        <Button variant="outline" onClick={onEditar}>
          Editar
        </Button>
        <Button variant="outline" onClick={onEliminar}>
          Eliminar
        </Button>
      </div>

      {!apiHabilitada() && (
        <ScheduleManager
          canchaId={cancha.id}
          canchaNombre={cancha.nombre}
          horarios={horarios}
          onCambio={onCambioHorarios}
        />
      )}
    </Card>
  );
}
