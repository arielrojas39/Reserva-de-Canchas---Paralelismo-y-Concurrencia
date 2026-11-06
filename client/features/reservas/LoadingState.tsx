import { Spinner } from "@/components/ui";
import styles from "./LoadingState.module.scss";

export interface LoadingStateProps {
  /** Texto descriptivo del trabajo en curso. */
  mensaje?: string;
}

/** Estado de carga centrado (role="status" para lectores de pantalla). */
export function LoadingState({ mensaje = "Cargando…" }: LoadingStateProps) {
  return (
    <div className={styles.wrap} role="status">
      <Spinner size="lg" />
      <p className={styles.mensaje}>{mensaje}</p>
    </div>
  );
}
