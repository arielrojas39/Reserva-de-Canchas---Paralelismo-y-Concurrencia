/**
 * Une clases CSS ignorando los valores falsy.
 * Evita duplicar estilos y mantienen los className legibles.
 */
export function cn(...clases: Array<string | false | null | undefined>): string {
  return clases.filter(Boolean).join(" ");
}
