/** Utilidades de formato de importes (puras). */

/**
 * Formatea un importe en pesos argentinos con símbolo (ej.: "$18.000").
 * Centraliza `Intl.NumberFormat` para que toda la UI muestre los
 * importes de la demostración de forma consistente.
 */
export function formatoPesos(valor: number): string {
  return `$${valor.toLocaleString("es-AR")}`;
}
