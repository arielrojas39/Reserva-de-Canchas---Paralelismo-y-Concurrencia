import { cn } from "@/lib/utils/cn";
import styles from "./Skeleton.module.scss";

export interface SkeletonProps {
  /** Ancho (cualquier valor CSS). Por defecto, 100%. */
  width?: string;
  /** Alto (cualquier valor CSS). Por defecto, 1rem. */
  height?: string;
  /** Radio de borde personalizado. */
  radius?: string;
  className?: string;
}

/** Bloque de carga decorativo. El contenedor debe indicar aria-busy. */
export function Skeleton({ width = "100%", height = "1rem", radius, className }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(styles.skeleton, className)}
      style={{ width, height, borderRadius: radius }}
    />
  );
}
