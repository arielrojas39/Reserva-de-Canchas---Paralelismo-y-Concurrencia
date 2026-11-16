import type { Reserva } from "@/types";

/**
 * Reservas de demostración (semilla del store local).
 * Al iniciar el store se les completa la expiración si no tienen.
 */
export const reservasMock: Reserva[] = [
  {
    id: "reserva-1",
    usuarioId: "usuario-1",
    canchaId: "cancha-1",
    horarioId: "horario-1",
    fecha: "2026-10-27",
    inicio: "18:00",
    fin: "19:00",
    montoTotal: 18000,
    estado: "confirmada",
    creadaEn: "2026-10-20T14:30:00.000Z",
  },
  {
    id: "reserva-2",
    usuarioId: "usuario-2",
    canchaId: "cancha-2",
    horarioId: "horario-3",
    fecha: "2026-10-28",
    inicio: "20:00",
    fin: "21:00",
    montoTotal: 26000,
    estado: "pendiente",
    creadaEn: "2026-10-24T18:05:00.000Z",
  },
  {
    id: "reserva-3",
    usuarioId: "usuario-1",
    canchaId: "cancha-3",
    horarioId: "horario-4",
    fecha: "2026-10-28",
    inicio: "09:00",
    fin: "10:00",
    montoTotal: 42000,
    estado: "cancelada",
    creadaEn: "2026-10-18T09:45:00.000Z",
  },
];
