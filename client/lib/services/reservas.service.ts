import { reservasMock } from "@/lib/mocks/reservas.mock";
import { buscarCanchaLocal } from "@/lib/services/canchas.service";
import { usuariosMock } from "@/lib/mocks/usuarios.mock";
import { CLAVES_DEMO, escribirLocal, leerLocal } from "@/lib/services/demo.store";
import { esperarSimulado, ocupacionSimulada, plazoExpiracionMs } from "@/lib/services/demo.config";
import { liberarHorario, marcarHorarioReservado } from "@/lib/services/horarios.service";
import type { Cancha, Reserva, Usuario } from "@/types";
import { apiHabilitada } from "@/lib/api/config";
import { canchaCacheada, obtenerCanchaApi } from "@/lib/api/canchas";
import { ApiError } from "@/lib/api/http";
import { limpiarToken } from "@/lib/api/token";
import { mapReservationResponse } from "@/lib/api/mappers";
import {
  cancelarReservaApi,
  crearReservaApi,
  listarMisReservasApi,
  listarReservasAdminApi,
  obtenerReservaApi,
} from "@/lib/api/reservas";

/**
 * Servicio de reservas: FastAPI cuando está configurada; simulación local en demo.
 *
 * Persiste las reservas ficticias en localStorage (demo.store) para
 * mantener consistencia entre catálogo, disponibilidad y mis reservas.
 * Devuelve respuestas con formas de código HTTP para probar la
 * interfaz. Sin semáforos ni concurrencia real.
 */

export type CodigoRespuesta = 201 | 401 | 403 | 409 | 410 | 422 | 503;

/** Cierra la sesión local cuando el backend invalida el token. */
function notificarSesionVencida(): void {
  limpiarToken();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("canchasplay:sesion-change"));
  }
}

/** "auto" resuelve según el estado; un código fuerza esa respuesta. */
export type ModoSimulacion = "auto" | CodigoRespuesta;

export interface DatosReservaDemo {
  canchaId: string;
  canchaNombre: string;
  horarioId: string;
  /** Fecha YYYY-MM-DD. */
  fecha: string;
  inicio: string;
  fin: string;
  montoTotal?: number;
  usuarioId: string;
}

export interface ResultadoReserva {
  codigo: CodigoRespuesta;
  /** Solo en respuestas exitosas (201). */
  reserva?: Reserva;
  /** Mensaje claro del backend cuando se usa la API real. */
  error?: string;
}

/** Reserva acompañada de su cancha, para la vista de mis reservas. */
export interface ReservaVista {
  reserva: Reserva;
  cancha: Cancha | null;
}

/** Reserva con cancha y usuario, para el panel administrativo. */
export interface ReservaAdmin {
  reserva: Reserva;
  cancha: Cancha | null;
  usuario: Usuario | null;
}

/** Un pago "pagando" sin avance recupera su estado tras este tiempo. */
const PAGANDO_VENCIDO_MS = 10_000;

export const RETARDO_CONSULTA_MS = 400;

/** Retardo simulado de confirmación de reserva (ms). */
export const RETARDO_RESERVA_MS = 1000;

function ahoraIso(): string {
  return new Date().toISOString();
}

function semilla(): Reserva[] {
  return reservasMock.map((reserva) => ({ ...reserva }));
}

/**
 * Normaliza la lista leída: completa expiraciones de la semilla,
 * marca EXPIRADA las pendientes vencidas (y libera su horario) y
 * recupera pagos obsoletos. Devuelve true si hubo cambios.
 */
function normalizar(lista: Reserva[]): boolean {
  let cambio = false;
  const ahora = Date.now();

  for (const reserva of lista) {
    if (reserva.estado === "pendiente") {
      if (!reserva.expiracion) {
        reserva.expiracion = new Date(ahora + plazoExpiracionMs()).toISOString();
        reserva.actualizadaEn = ahoraIso();
        cambio = true;
      } else if (ahora > new Date(reserva.expiracion).getTime()) {
        reserva.estado = "expirada";
        reserva.actualizadaEn = ahoraIso();
        liberarHorario(reserva.horarioId);
        cambio = true;
      }
    }

    if (reserva.estado === "pagando") {
      const ultima = reserva.actualizadaEn
        ? new Date(reserva.actualizadaEn).getTime()
        : new Date(reserva.creadaEn).getTime();
      if (ahora - ultima > PAGANDO_VENCIDO_MS) {
        // Pago interrumpido (demo): vuelve a quedar pendiente.
        reserva.estado = "pendiente";
        reserva.actualizadaEn = ahoraIso();
        cambio = true;
      }
    }
  }

  return cambio;
}

function leerReservas(): Reserva[] {
  const lista = leerLocal<Reserva[]>(CLAVES_DEMO.reservas, semilla());
  if (normalizar(lista)) {
    escribirLocal(CLAVES_DEMO.reservas, lista);
  }
  return lista;
}

function guardarReservas(lista: Reserva[]): void {
  escribirLocal(CLAVES_DEMO.reservas, lista);
}

/** Todas las reservas de la demo (con su cancha), para mis reservas. */
export async function obtenerReservasDeUsuario(usuarioId: string): Promise<ReservaVista[]> {
  if (apiHabilitada()) {
    if (typeof window === "undefined") return [];
    let responses: Awaited<ReturnType<typeof listarMisReservasApi>>;
    try {
      responses = await listarMisReservasApi();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) notificarSesionVencida();
      throw error;
    }
    return Promise.all(
      responses.map(async (response) => {
        const reserva = mapReservationResponse(response);
        const cache = canchaCacheada(String(response.court_id));
        const cancha =
          cache ??
          (await obtenerCanchaApi(String(response.court_id)).catch(() => ({
            id: String(response.court_id),
            nombre: response.court_name,
            descripcion: "",
            formato: "futbol5" as const,
            superficie: "parquet" as const,
            direccion: "Ubicación no disponible",
            precioPorHora: 0,
            iluminacion: false,
            activa: true,
          })));
        return { reserva, cancha };
      }),
    ).then((vistas) => vistas.sort((a, b) => b.reserva.creadaEn.localeCompare(a.reserva.creadaEn)));
  }
  await esperarSimulado(RETARDO_CONSULTA_MS);
  return leerReservas()
    .filter((reserva) => reserva.usuarioId === usuarioId)
    .sort((a, b) => b.creadaEn.localeCompare(a.creadaEn))
    .map((reserva) => ({
      reserva,
      cancha: buscarCanchaLocal(reserva.canchaId),
    }));
}

/** Busca una reserva en el store (lee y normaliza). */
export function obtenerReserva(id: string): Reserva | null {
  return leerReservas().find((reserva) => reserva.id === id) ?? null;
}

/** Todas las reservas (API admin o store demo). */
export async function obtenerReservasParaAdmin(): Promise<ReservaAdmin[]> {
  if (apiHabilitada()) {
    if (typeof window === "undefined") return [];
    const responses = await listarReservasAdminApi();
    return Promise.all(
      responses.map(async (response) => {
        const reserva = mapReservationResponse(response);
        const cache = canchaCacheada(String(response.court_id));
        const cancha =
          cache ??
          (await obtenerCanchaApi(String(response.court_id)).catch(() => ({
            id: String(response.court_id),
            nombre: response.court_name,
            descripcion: "",
            formato: "futbol5" as const,
            superficie: "parquet" as const,
            direccion: "—",
            precioPorHora: 0,
            iluminacion: false,
            activa: true,
          })));
        const usuario: Usuario = {
          id: String(response.user_id),
          nombre: `Usuario #${response.user_id}`,
          email: "",
          rol: "cliente",
          creadoEn: response.created_at,
        };
        return { reserva, cancha, usuario };
      }),
    ).then((reservas) =>
      reservas.sort((a, b) => b.reserva.creadaEn.localeCompare(a.reserva.creadaEn)),
    );
  }

  await esperarSimulado(RETARDO_CONSULTA_MS);
  return leerReservas()
    .slice()
    .sort((a, b) => b.creadaEn.localeCompare(a.creadaEn))
    .map((reserva) => ({
      reserva,
      cancha: buscarCanchaLocal(reserva.canchaId),
      usuario: usuariosMock.find((u) => u.id === reserva.usuarioId) ?? null,
    }));
}

/**
 * Aplica cambios parciales a una reserva y los persiste.
 * Cambios de estado relevantes actualizan también el horario asociado.
 */
export function actualizarReserva(id: string, cambios: Partial<Reserva>): Reserva | null {
  const lista = leerReservas();
  const reserva = lista.find((item) => item.id === id);
  if (!reserva) return null;

  Object.assign(reserva, cambios, { actualizadaEn: ahoraIso() });

  if (reserva.estado === "cancelada" || reserva.estado === "expirada") {
    liberarHorario(reserva.horarioId);
  }

  guardarReservas(lista);
  return reserva;
}

/** Marca la reserva como EXPIRADA (idempotente) y libera el horario. */
export async function expirarReserva(id: string): Promise<Reserva | null> {
  if (apiHabilitada()) return null;
  await esperarSimulado(250);
  const reserva = obtenerReserva(id);
  if (!reserva || reserva.estado !== "pendiente") return reserva;
  return actualizarReserva(id, { estado: "expirada" });
}

export async function crearReservaDemo(
  datos: DatosReservaDemo,
  modo: ModoSimulacion = "auto",
): Promise<ResultadoReserva> {
  await esperarSimulado(RETARDO_RESERVA_MS);

  // Datos incompletos → 422.
  if (!datos.usuarioId || !datos.canchaId || !datos.horarioId || !datos.fecha) {
    return { codigo: 422 };
  }

  // Control simulado de solicitudes simultáneas ("semáforos"): si la
  // demostración lo tiene activado, un horario ya tomado responde 409.
  // Es un resultado SIMULADO, no concurrencia real.
  if (ocupacionSimulada()) {
    const reservado = leerReservas().some(
      (reserva) =>
        reserva.horarioId === datos.horarioId &&
        (reserva.estado === "pendiente" ||
          reserva.estado === "pagando" ||
          reserva.estado === "confirmada"),
    );
    if (reservado || horarioYaMarcado(datos.horarioId)) {
      return { codigo: 409 };
    }
  }

  // Respuesta forzada para pruebas de la interfaz.
  if (modo !== "auto" && modo !== 201) {
    if (modo === 409) {
      // El conflicto marcó el horario: la disponibilidad se actualiza.
      marcarHorarioReservado(datos.horarioId);
    }
    return { codigo: modo };
  }

  // Éxito: queda PENDIENTE de pago y el horario se ocupa una sola vez.
  marcarHorarioReservado(datos.horarioId);

  const reserva: Reserva = {
    id: `reserva-${leerReservas().length + 1}`,
    usuarioId: datos.usuarioId,
    canchaId: datos.canchaId,
    horarioId: datos.horarioId,
    fecha: datos.fecha,
    inicio: datos.inicio,
    fin: datos.fin,
    montoTotal: datos.montoTotal,
    estado: "pendiente",
    creadaEn: ahoraIso(),
    actualizadaEn: ahoraIso(),
    expiracion: new Date(Date.now() + plazoExpiracionMs()).toISOString(),
  };

  const lista = leerReservas();
  lista.push(reserva);
  guardarReservas(lista);

  return { codigo: 201, reserva };
}

/** Crea reserva real cuando está configurada la API; en otro caso mantiene intacta la simulación. */
export async function crearReserva(
  datos: DatosReservaDemo,
  modo: ModoSimulacion = "auto",
): Promise<ResultadoReserva> {
  if (!apiHabilitada()) return crearReservaDemo(datos, modo);

  const courtId = Number(datos.canchaId);
  if (!Number.isSafeInteger(courtId) || courtId <= 0 || !datos.fecha || !datos.inicio) {
    return { codigo: 422, error: "Revisá la cancha, fecha y horario seleccionados." };
  }

  try {
    const response = await crearReservaApi({
      court_id: courtId,
      date: datos.fecha,
      time: datos.inicio,
    });
    return { codigo: 201, reserva: mapReservationResponse(response) };
  } catch (error) {
    if (!(error instanceof ApiError)) {
      return { codigo: 503, error: "No se pudo conectar con el servicio de reservas." };
    }
    if (error.status === 409)
      return { codigo: 409, error: "Ese horario ya no está disponible. Elegí otro." };
    if (error.status === 401) {
      notificarSesionVencida();
      return { codigo: 401, error: "Tu sesión venció. Iniciá sesión nuevamente." };
    }
    if (error.status === 403) {
      return { codigo: 403, error: "Tu cuenta no tiene permiso para reservar." };
    }
    if (error.status === 404) return { codigo: 422, error: "La cancha seleccionada ya no existe." };
    if (error.status === 400 || error.status === 422) {
      return {
        codigo: 422,
        error: "No se pudieron validar los datos de la reserva. Revisá la cancha, fecha y horario.",
      };
    }
    if (error.status === 410) return { codigo: 410, error: error.message };
    return {
      codigo: 503,
      error: "El servicio de reservas no está disponible. Intentá nuevamente.",
    };
  }
}

/** Acceso explícito a los recursos API para pantallas futuras; payment permanece fuera del backend. */
export async function obtenerReservaApiPorId(id: string): Promise<Reserva> {
  return mapReservationResponse(await obtenerReservaApi(id));
}

export async function cancelarReservaApiPorId(id: string): Promise<Reserva> {
  try {
    return mapReservationResponse(await cancelarReservaApi(id));
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) notificarSesionVencida();
    throw error;
  }
}

/** Consulta directa del estado del horario en el store local. */
function horarioYaMarcado(horarioId: string): boolean {
  const ids = leerLocal<string[]>(CLAVES_DEMO.horariosReservados, []);
  return ids.includes(horarioId);
}
