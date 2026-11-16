/**
 * Tipos de presentación del catálogo de canchas.
 * La data cruda vive en types/ y llega vía servicios; estos tipos solo
 * describen cómo se muestra en la UI.
 */
import type { BadgeVariant } from "@/components/ui";

/** Estado de disponibilidad que se muestra en cada card. */
export interface EstadoDisponibilidadUi {
  texto: string;
  variante: BadgeVariant;
}

/**
 * Traduce el contador del servicio a etiqueta visual.
 * Devuelve undefined mientras carga (la card muestra un skeleton).
 */
export function estadoUiDe(
  contador: { total: number; libres: number } | undefined,
): EstadoDisponibilidadUi | undefined {
  if (!contador) return undefined;
  if (contador.libres > 0) {
    return {
      texto: `Disponible hoy · ${contador.libres} turnos libres`,
      variante: "success",
    };
  }
  return { texto: "Sin turnos libres hoy", variante: "neutral" };
}
