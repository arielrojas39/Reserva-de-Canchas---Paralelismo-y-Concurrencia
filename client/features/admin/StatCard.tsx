import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import styles from "./StatCard.module.scss";

export type StatCardTon = "verde" | "azul" | "ambar" | "gris";

export interface StatCardProps {
  icono: LucideIcon;
  etiqueta: string;
  valor: string | number;
  /** Texto secundario bajo la etiqueta. */
  descripcion?: string;
  tono?: StatCardTon;
}

/** Card de estadística del dashboard (icono + valor + etiqueta). */
export function StatCard({
  icono: Icono,
  etiqueta,
  valor,
  descripcion,
  tono = "verde",
}: StatCardProps) {
  return (
    <Card className={styles.card}>
      <span className={cn(styles.icono, styles[tono])}>
        <Icono size={20} aria-hidden="true" />
      </span>
      <span className={styles.valor}>{valor}</span>
      <span className={styles.etiqueta}>{etiqueta}</span>
      {descripcion && <p className={styles.descripcion}>{descripcion}</p>}
    </Card>
  );
}
