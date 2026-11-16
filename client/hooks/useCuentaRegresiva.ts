"use client";

import { useSyncExternalStore } from "react";

/**
 * Cuenta regresiva hasta una fecha (ISO), segura para el prerender:
 * el servidor devuelve null y el cliente calcula tras la hidratación.
 * El snapshot se cachea por segundo para ser referencialmente estable.
 */

interface Cache {
  expiracion: string;
  segundo: number;
  valor: number;
}

let cache: Cache | null = null;

function leerRestante(expiracion: string): number {
  const ahoraSegundo = Math.floor(Date.now() / 1000);
  if (!cache || cache.expiracion !== expiracion || cache.segundo !== ahoraSegundo) {
    cache = {
      expiracion,
      segundo: ahoraSegundo,
      valor: new Date(expiracion).getTime() - ahoraSegundo * 1000,
    };
  }
  return cache.valor;
}

function leerRestanteEnServidor(): number | null {
  return null;
}

function suscribirReloj(actualizar: () => void): () => void {
  const id = setInterval(actualizar, 1000);
  return () => clearInterval(id);
}

/**
 * Milisegundos restantes hasta `expiracion` (null en el servidor o si
 * la fecha es inválida). Se actualiza cada segundo.
 */
export function useCuentaRegresiva(expiracion: string): number | null {
  const restante = useSyncExternalStore(
    (callback) => suscribirReloj(callback),
    () => leerRestante(expiracion),
    leerRestanteEnServidor,
  );
  return restante;
}
