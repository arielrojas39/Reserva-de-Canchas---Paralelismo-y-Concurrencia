/**
 * Abstracción de almacenamiento local para datos EXCLUSIVAMENTE
 * ficticios de demostración.
 *
 * No guarda información sensible ni simula seguridad: solo persiste la
 * simulación entre recargas para mantener la consistencia entre
 * catálogo, disponibilidad y mis reservas.
 */

export const CLAVES_DEMO = {
  reservas: "canchasplay:reservas-demo",
  horariosReservados: "canchasplay:horarios-reservados",
  canchas: "canchasplay:canchas-demo",
  horariosCanchas: "canchasplay:horarios-canchas-demo",
  config: "canchasplay:config-demo",
} as const;

export function leerLocal<T>(clave: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const crudo = window.localStorage.getItem(clave);
    return crudo ? (JSON.parse(crudo) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function escribirLocal<T>(clave: string, valor: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // La persistencia es opcional (modo demo).
  }
}
