"use client";

/**
 * Año actual para el copyright.
 * Nota: `new Date()` exige <Suspense> en el Footer porque el prerender
 * estático de Next 16 trata el tiempo como valor inestable.
 */
export function CurrentYear() {
  return <>{new Date().getFullYear()}</>;
}
