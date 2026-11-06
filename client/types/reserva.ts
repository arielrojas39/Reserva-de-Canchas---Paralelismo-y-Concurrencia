export type EstadoReserva =
  "pendiente" | "pagando" | "confirmada" | "completada" | "cancelada" | "expirada";

export interface Reserva {
  id: string;
  usuarioId: string;
  canchaId: string;
  horarioId: string;
  /** Fecha de la reserva en formato YYYY-MM-DD. */
  fecha: string;
  /** Hora de inicio de la franja (HH:mm), cuando está definida. */
  inicio?: string;
  /** Hora de fin de la franja (HH:mm), cuando está definida. */
  fin?: string;
  /** Monto total en pesos argentinos, solo si está definido en los datos. */
  montoTotal?: number;
  estado: EstadoReserva;
  /** Fecha de creación en formato ISO 8601. */
  creadaEn: string;
  /** Última actualización de estado (ISO 8601). */
  actualizadaEn?: string;
  /** Vencimiento del plazo de pago en ISO 8601 (reservas pendientes). */
  expiracion?: string;
}
