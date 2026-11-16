"use client";

import { useId } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "./Switch.module.scss";

export interface SwitchProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "onChange"
> {
  /** Etiqueta visible accesible. */
  label: string;
  /** Estado controlado del switch. */
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Descripción secundaria opcional. */
  hint?: string;
}

/**
 * Switch accesible (input checkbox + role="switch") con etiqueta
 * visible. El estado lo controla el padre.
 */
export function Switch({ label, checked, onChange, hint, id, className, ...rest }: SwitchProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;

  return (
    <div className={cn(styles.field, className)}>
      <label htmlFor={inputId} className={styles.label}>
        <span className={styles.track}>
          <input
            id={inputId}
            type="checkbox"
            role="switch"
            className={styles.input}
            checked={checked}
            aria-describedby={hint ? hintId : rest["aria-describedby"]}
            onChange={(event) => onChange(event.target.checked)}
            {...rest}
          />
          <span className={styles.thumb} aria-hidden="true" />
        </span>
        <span className={styles.texto}>{label}</span>
      </label>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  );
}
