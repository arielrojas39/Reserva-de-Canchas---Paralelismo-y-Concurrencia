"use client";

import type { FormEventHandler, ReactNode } from "react";
import { Alert, Button } from "@/components/ui";
import styles from "./AuthForm.module.scss";

export interface AuthFormProps {
  onSubmit: FormEventHandler<HTMLFormElement>;
  /** Estado de envío para el botón de carga. */
  isSubmitting: boolean;
  /** Error general del formulario (ej.: credenciales incorrectas). */
  error?: string;
  /** Título del alert de error general. */
  errorTitle?: string;
  submitLabel: string;
  children: ReactNode;
}

/** Shell del formulario de auth: alert de error, campos y botón de envío. */
export function AuthForm({
  onSubmit,
  isSubmitting,
  error,
  errorTitle = "No pudimos completar la operación",
  submitLabel,
  children,
}: AuthFormProps) {
  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {error && (
        <Alert variant="error" title={errorTitle}>
          {error}
        </Alert>
      )}
      <div className={styles.fields}>{children}</div>
      <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  );
}
