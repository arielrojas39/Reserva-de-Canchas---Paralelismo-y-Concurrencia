/**
 * Franjas de horario de demostración para la consulta de disponibilidad.
 * (La disponibilidad por fecha se genera de forma determinista en el
 * servicio de horarios; acá solo se define la grilla horaria.)
 */
export const HORAS_DEMO: ReadonlyArray<{ inicio: string; fin: string }> = [
  { inicio: "18:00", fin: "19:00" },
  { inicio: "19:00", fin: "20:00" },
  { inicio: "20:00", fin: "21:00" },
  { inicio: "21:00", fin: "22:00" },
];

/** Retardo simulado de consulta de horarios (ms). */
export const RETARDO_HORARIOS_MS = 450;
