import { HORAS_DEMO, RETARDO_HORARIOS_MS } from "@/lib/mocks/horarios.mock";
import { canchasMock } from "@/lib/mocks/canchas.mock";
import { CLAVES_DEMO, escribirLocal, leerLocal } from "@/lib/services/demo.store";
import { esperarSimulado } from "@/lib/services/demo.config";
import type { Horario } from "@/types";
import { apiHabilitada } from "@/lib/api/config";
import { disponibilidadApi } from "@/lib/api/canchas";
import { mapAvailabilityResponse } from "@/lib/api/mappers";

/**
 * Disponibilidad real desde FastAPI en modo API; servicio determinista en demo.
 *
 * Cada cancha tiene su grilla de horarios habilitados (hora de inicio,
 * franjas de una hora) persistida en el store de demo y sembrada con
 * la grilla de referencia 18:00–22:00. La ocupación por fecha es
 * determinista por (cancha, fecha) más el conjunto de horarios
 * reservados de la demo, para que catálogo y mis reservas compartan
 * el mismo estado. Sin semáforos ni lógica de concurrencia real.
 */

type MapaHorarios = Record<string, string[]>;

const reservados = new Set<string>();
let hidratado = false;

/** Grilla de referencia: inicios de franja de una hora. */
const INICIOS_DEMO: string[] = HORAS_DEMO.map((franja) => franja.inicio);

function semillaHorarios(): MapaHorarios {
  return Object.fromEntries(canchasMock.map((cancha) => [cancha.id, [...INICIOS_DEMO]]));
}

function leerMapaHorarios(): MapaHorarios {
  return leerLocal<MapaHorarios>(CLAVES_DEMO.horariosCanchas, semillaHorarios());
}

function guardarMapaHorarios(mapa: MapaHorarios): void {
  escribirLocal(CLAVES_DEMO.horariosCanchas, mapa);
}

function hidratar(): void {
  if (hidratado || typeof window === "undefined") return;
  hidratado = true;
  for (const id of leerLocal<string[]>(CLAVES_DEMO.horariosReservados, [])) {
    reservados.add(id);
  }
}

function persistir(): void {
  escribirLocal(CLAVES_DEMO.horariosReservados, [...reservados]);
}

/** Marca un horario como reservado en la demo (y lo persiste). */
export function marcarHorarioReservado(horarioId: string): void {
  hidratar();
  if (!reservados.has(horarioId)) {
    reservados.add(horarioId);
    persistir();
  }
}

/** Libera un horario (reserva cancelada o expirada). */
export function liberarHorario(horarioId: string): void {
  hidratar();
  if (reservados.delete(horarioId)) {
    persistir();
  }
}

/** Hash determinista (djb2) sobre un texto. */
function hash(texto: string): number {
  let resultado = 5381;
  for (let i = 0; i < texto.length; i += 1) {
    resultado = (resultado * 33) ^ texto.charCodeAt(i);
  }
  return Math.abs(resultado);
}

/** Algunos días quedan totalmente ocupados para mostrar el estado vacío. */
function diaCompletoOcupado(canchaId: string, fecha: string): boolean {
  return hash(`${canchaId}:${fecha}`) % 7 === 0;
}

function franjaOcupada(canchaId: string, fecha: string, inicio: string): boolean {
  return hash(`${canchaId}:${fecha}:${inicio}`) % 10 < 3;
}

/** Fin de una franja de una hora: "18:00" → "19:00". */
export function finDesdeInicio(inicio: string): string {
  const [hora, minutos] = inicio.split(":").map(Number);
  const fin = (hora + 1) % 24;
  return `${String(fin).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
}

const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export type ResultadoHorario = { ok: true; horarios: string[] } | { ok: false; error: string };

/** Horarios habilitados de una cancha (inicios ordenados). */
export async function obtenerHorariosDeCancha(canchaId: string): Promise<string[]> {
  await esperarSimulado(RETARDO_HORARIOS_MS);
  return [...(leerMapaHorarios()[canchaId] ?? [])].sort();
}

/** Grillas de todas las canchas, para el panel admin. */
export async function obtenerHorariosPorCancha(): Promise<MapaHorarios> {
  await esperarSimulado(RETARDO_HORARIOS_MS);
  return leerMapaHorarios();
}

/** Agrega una hora de inicio a la cancha, evitando duplicados. */
export async function agregarHorario(canchaId: string, inicio: string): Promise<ResultadoHorario> {
  await esperarSimulado(RETARDO_HORARIOS_MS);
  const hora = inicio.trim();

  if (!HORA_REGEX.test(hora)) {
    return { ok: false, error: "Ingresá una hora válida en formato HH:MM (ej.: 18:00)." };
  }

  const mapa = leerMapaHorarios();
  const actuales = mapa[canchaId] ?? [];

  if (actuales.includes(hora)) {
    return { ok: false, error: "Ese horario ya está habilitado en esta cancha." };
  }

  const horarios = [...actuales, hora].sort();
  guardarMapaHorarios({ ...mapa, [canchaId]: horarios });
  return { ok: true, horarios };
}

/** Elimina una hora de inicio habilitada de la cancha. */
export async function eliminarHorario(canchaId: string, inicio: string): Promise<ResultadoHorario> {
  await esperarSimulado(RETARDO_HORARIOS_MS);
  const mapa = leerMapaHorarios();
  const actuales = mapa[canchaId] ?? [];

  if (!actuales.includes(inicio)) {
    return { ok: false, error: "Ese horario no está habilitado en esta cancha." };
  }

  const horarios = actuales.filter((hora) => hora !== inicio);
  guardarMapaHorarios({ ...mapa, [canchaId]: horarios });
  return { ok: true, horarios };
}

/** Horarios de una cancha para una fecha (YYYY-MM-DD). */
export async function obtenerHorarios(canchaId: string, fecha: string): Promise<Horario[]> {
  if (apiHabilitada()) {
    if (typeof window === "undefined") return [];
    // El SSR entrega la semilla demo antes de que el catálogo real hidrate.
    // Evitamos consultar la API con IDs como "cancha-1" (422 innecesario).
    if (!/^\d+$/.test(canchaId)) return [];
    const response = await disponibilidadApi(canchaId, fecha);
    return mapAvailabilityResponse(response, fecha);
  }
  await esperarSimulado(RETARDO_HORARIOS_MS);
  hidratar();

  const inicios = [...(leerMapaHorarios()[canchaId] ?? [])].sort();
  const sinDisponibilidad = diaCompletoOcupado(canchaId, fecha);

  return inicios.map((inicio) => {
    const id = `${canchaId}-${fecha}-${inicio}`;
    return {
      id,
      canchaId,
      fecha,
      inicio,
      fin: finDesdeInicio(inicio),
      disponible:
        !sinDisponibilidad && !franjaOcupada(canchaId, fecha, inicio) && !reservados.has(id),
    };
  });
}

/** Resumen de disponibilidad de una cancha en una fecha. */
export async function contarDisponibles(
  canchaId: string,
  fecha: string,
): Promise<{ total: number; libres: number }> {
  const horarios = await obtenerHorarios(canchaId, fecha);
  return {
    total: horarios.length,
    libres: horarios.filter((horario) => horario.disponible).length,
  };
}
