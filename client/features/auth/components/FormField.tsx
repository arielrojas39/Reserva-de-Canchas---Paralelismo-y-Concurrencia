import type { ReactNode } from "react";
import styles from "./FormField.module.scss";

export interface FormFieldProps {
  /** Texto de la etiqueta visible. */
  label: string;
  /** id del control asociado (label ↔ input). */
  htmlFor: string;
  /** Mensaje de validación; renderiza con role="alert". */
  error?: string;
  /** Texto de ayuda cuando no hay error. */
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

/**
 * Etiqueta + control + mensaje de error, con la asociación accesible
 * label/input correcta. El error queda vinculado vía aria-describedby
 * (pasarlo desde el campo: aria-describedby={`${htmlFor}-error`}).
 */
export function FormField({ label, htmlFor, error, hint, required, children }: FormFieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={htmlFor} className={styles.label}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && <p className={styles.hint}>{hint}</p>}
      {error && (
        <p id={`${htmlFor}-error`} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
