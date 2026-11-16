"use client";

import { useEffect, useRef } from "react";
import { Clock } from "lucide-react";
import { useCuentaRegresiva } from "@/hooks/useCuentaRegresiva";
import { cn } from "@/lib/utils/cn";
import styles from "./ExpirationCountdown.module.scss";

export interface ExpirationCountdownProps {
  /** Fecha de expiración en ISO 8601. */
  expiracion: string;
  /** Se dispara una sola vez cuando el plazo llega a cero. */
  onExpirar: () => void;
}

function formato(restante: number): string {
  const totalSegundos = Math.max(0, Math.ceil(restante / 1000));
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;
  return `${minutos} min ${String(segundos).padStart(2, "0")} s`;
}

/**
 * Cuenta regresiva visual del plazo de pago. Al llegar a cero avisa
 * al padre para que la reserva pase a EXPIRADA.
 */
export function ExpirationCountdown({ expiracion, onExpirar }: ExpirationCountdownProps) {
  const restante = useCuentaRegresiva(expiracion);
  const expiradoRef = useRef(false);
  const onExpirarRef = useRef(onExpirar);

  useEffect(() => {
    onExpirarRef.current = onExpirar;
  });

  useEffect(() => {
    if (restante !== null && restante <= 0 && !expiradoRef.current) {
      expiradoRef.current = true;
      onExpirarRef.current();
    }
  }, [restante]);

  if (restante === null) {
    return (
      <span className={styles.cargando} aria-hidden="true">
        Calculando plazo…
      </span>
    );
  }

  const urgente = restante <= 2 * 60_000;

  return (
    <span
      className={cn(styles.wrapper, urgente && styles.urgente)}
      role="timer"
      aria-label={`Tiempo restante para pagar: ${formato(restante)}`}
    >
      <Clock size={14} aria-hidden="true" />
      <span aria-hidden="true">Quedan {formato(restante)}</span>
      <time className={styles.visuallyHidden} dateTime={expiracion} />
    </span>
  );
}
