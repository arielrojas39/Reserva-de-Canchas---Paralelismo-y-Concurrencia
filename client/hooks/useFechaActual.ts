"use client";

import { useSyncExternalStore } from "react";

/**
 * Fecha/hora actual de forma segura con Cache Components de Next 16.
 *
 * `new Date()` no puede ejecutarse durante el prerender estático, así
 * que la lectura ocurre solo en el cliente vía useSyncExternalStore:
 * el servidor renderiza `null` (fallback) y el cliente actualiza tras
 * la hidratación. Se refresca cada minuto (y al cruzar la medianoche).
 */

const INTERVALO_MS = 60_000;

let epochCacheado: number | null = null;

function leerEpoch(): number {
  if (epochCacheado === null) {
    epochCacheado = Date.now();
  }
  return epochCacheado;
}

function leerEpochEnServidor(): number | null {
  return null;
}

function suscribirReloj(actualizar: () => void): () => void {
  const id = setInterval(() => {
    epochCacheado = Date.now();
    actualizar();
  }, INTERVALO_MS);
  return () => clearInterval(id);
}

/**
 * Devuelve la fecha actual en el cliente y `null` durante el render del
 * servidor o antes de la hidratación.
 */
export function useFechaActual(): Date | null {
  const epoch = useSyncExternalStore(suscribirReloj, leerEpoch, leerEpochEnServidor);
  return epoch === null ? null : new Date(epoch);
}
