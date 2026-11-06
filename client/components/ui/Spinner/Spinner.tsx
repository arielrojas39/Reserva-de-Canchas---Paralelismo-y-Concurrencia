import { cn } from "@/lib/utils/cn";
import styles from "./Spinner.module.scss";

export type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps {
  /** Tamaño del indicador. */
  size?: SpinnerSize;
  /** Texto accesible para lectores de pantalla. */
  label?: string;
  className?: string;
}

export function Spinner({ size = "md", label = "Cargando…", className }: SpinnerProps) {
  return (
    <span role="status" className={cn(styles.spinner, styles[size], className)}>
      <span className={styles.circle} aria-hidden="true" />
      <span className={styles.srOnly}>{label}</span>
    </span>
  );
}
