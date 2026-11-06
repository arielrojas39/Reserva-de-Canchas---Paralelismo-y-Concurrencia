import Image from "next/image";
import { Check, Clock, MapPin, Trophy } from "lucide-react";
import { Badge, Button, Card, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import type { EstadoDisponibilidadUi } from "@/features/canchas/canchas.types";
import type { Cancha, FormatoCancha, SuperficieCancha } from "@/types";
import styles from "./CourtCard.module.scss";

export const FORMATO_LABELS: Record<FormatoCancha, string> = {
  futbol5: "Fútbol 5",
  futbol7: "Fútbol 7",
  futbol11: "Fútbol 11",
};

export const SUPERFICIE_LABELS: Record<SuperficieCancha, string> = {
  sintetico: "Sintético",
  cesped: "Césped",
  parquet: "Parquet",
};

export interface CourtCardProps {
  cancha: Cancha;
  /** Estado de disponibilidad; undefined = cargando. */
  estado?: EstadoDisponibilidadUi;
  seleccionada: boolean;
  onSelect: (canchaId: string) => void;
  /** Prioriza la imagen de la primera card para el LCP. */
  priority?: boolean;
}

/** Card de catálogo: imagen, descripción, características y estado. */
export function CourtCard({
  cancha,
  estado,
  seleccionada,
  onSelect,
  priority = false,
}: CourtCardProps) {
  const handleSelect = () => {
    onSelect(cancha.id);
    document.getElementById("horarios")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Card
      className={cn(styles.card, seleccionada && styles.seleccionada)}
      aria-current={seleccionada ? "true" : undefined}
    >
      <div className={styles.imageWrap}>
        {cancha.imagenUrl ? (
          <Image
            src={cancha.imagenUrl}
            alt={`${cancha.nombre} — ${FORMATO_LABELS[cancha.formato]} en ${cancha.direccion}`}
            width={800}
            height={500}
            unoptimized
            priority={priority}
            className={styles.image}
          />
        ) : (
          <div className={styles.imageFallback} aria-hidden="true" />
        )}
        <Badge variant="primary" className={styles.formatBadge}>
          {FORMATO_LABELS[cancha.formato]}
        </Badge>
      </div>

      <div className={styles.heading}>
        <div className={styles.headingTop}>
          <h3 className={styles.nombre}>{cancha.nombre}</h3>
          {estado ? (
            <Badge variant={estado.variante}>{estado.texto}</Badge>
          ) : (
            <Skeleton width="10rem" height="1.375rem" radius="999px" />
          )}
        </div>
        <p className={styles.descripcion}>{cancha.descripcion}</p>
      </div>

      <ul className={styles.features}>
        <li>
          <Trophy size={16} aria-hidden="true" />
          {FORMATO_LABELS[cancha.formato]} · {SUPERFICIE_LABELS[cancha.superficie]}
        </li>
        <li>
          <Clock size={16} aria-hidden="true" />
          {cancha.iluminacion ? "Con iluminación" : "Sin iluminación"}
        </li>
        <li>
          <MapPin size={16} aria-hidden="true" />
          {cancha.direccion}
        </li>
      </ul>

      <Button variant={seleccionada ? "primary" : "outline"} fullWidth onClick={handleSelect}>
        {seleccionada ? (
          <>
            <Check size={16} aria-hidden="true" />
            Viendo horarios
          </>
        ) : (
          "Ver horarios"
        )}
      </Button>
    </Card>
  );
}
