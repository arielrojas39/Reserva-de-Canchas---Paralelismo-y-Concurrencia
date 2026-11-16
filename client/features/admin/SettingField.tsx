import type { ReactNode } from "react";
import styles from "./SettingField.module.scss";

export interface SettingFieldProps {
  /** Etiqueta del parámetro. */
  titulo: string;
  /** Explicación sencilla de qué representa durante la demo. */
  descripcion: string;
  /** Controles (switch, input numérico, etc.). */
  children: ReactNode;
}

/** Fila de un parámetro de demo: etiqueta + descripción + control. */
export function SettingField({ titulo, descripcion, children }: SettingFieldProps) {
  return (
    <div className={styles.field}>
      <div className={styles.textos}>
        <p className={styles.titulo}>{titulo}</p>
        <p className={styles.descripcion}>{descripcion}</p>
      </div>
      <div className={styles.control}>{children}</div>
    </div>
  );
}
