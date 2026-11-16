"use client";

import { useId } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "./Input.module.scss";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Etiqueta visible del campo. */
  label?: string;
  /** Mensaje de error accesible (se anuncia a lectores de pantalla). */
  error?: string;
  /** Texto de ayuda secundario. */
  hint?: string;
  /**
   * Marca el campo como inválido sin renderizar mensaje propio
   * (útil cuando el error lo controla un FormField externo).
   */
  invalid?: boolean;
}

export function Input({
  label,
  error,
  hint,
  invalid,
  id,
  className,
  required,
  ...rest
}: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const isInvalid = Boolean(error) || invalid;
  const describedBy = error ? errorId : hint ? hintId : rest["aria-describedby"];

  return (
    <div className={styles.field}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && (
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <input
        id={inputId}
        className={cn(styles.input, isInvalid && styles.invalid, className)}
        aria-invalid={isInvalid || undefined}
        aria-describedby={describedBy}
        required={required}
        {...rest}
      />
      {hint && !error && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
