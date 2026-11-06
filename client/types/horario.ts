export interface Horario {
  id: string;
  canchaId: string;
  /** Fecha del turno en formato YYYY-MM-DD. */
  fecha: string;
  /** Hora de inicio en formato HH:mm. */
  inicio: string;
  /** Hora de fin en formato HH:mm. */
  fin: string;
  disponible: boolean;
}
