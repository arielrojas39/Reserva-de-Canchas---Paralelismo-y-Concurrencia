/** Utilidades de fecha (puras, sin lectura de "hoy"). */

/** Formatea una clave YYYY-MM-DD como "martes, 27 de octubre". */
export function formatFechaLarga(clave: string): string {
  const [anio, mes, dia] = clave.split("-").map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  const texto = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(fecha);
  // Solo la primera letra en mayúscula (evita "27 De Octubre").
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
