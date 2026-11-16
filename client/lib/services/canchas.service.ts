import { canchasMock } from "@/lib/mocks/canchas.mock";
import { CLAVES_DEMO, escribirLocal, leerLocal } from "@/lib/services/demo.store";
import { esperarSimulado } from "@/lib/services/demo.config";
import type { Cancha } from "@/types";
import { apiHabilitada } from "@/lib/api/config";
import {
  actualizarCanchaApi,
  crearCanchaApi,
  eliminarCanchaApi,
  listarCanchasApi,
  obtenerCanchaApi,
} from "@/lib/api/canchas";

/**
 * Fuente de canchas: API pública en modo API y store local en modo demo.
 *
 * La lista vive en el store de demo (localStorage) sembrada con los
 * mocks en modo demo, de modo que las canchas creadas desde el panel
 * administrativo se reflejen en el catálogo de demostración.
 */

export const RETARDO_CANCHAS_MS = 400;

/**
 * La latencia simulada (parametrizable desde la configuración de
 * demo) es solo detalle de UX del cliente: en el prerender del
 * servidor no se espera nada para mantener la ruta estática
 * (Next 16 + Cache Components lo detectaría como dato uncached
 * fuera de <Suspense>).
 */
async function esperarEnDemo(ms: number): Promise<void> {
  if (typeof window === "undefined") return;
  await esperarSimulado(ms);
}

function semilla(): Cancha[] {
  return canchasMock.map((cancha) => ({ ...cancha }));
}

function leerCanchas(): Cancha[] {
  return leerLocal<Cancha[]>(CLAVES_DEMO.canchas, semilla());
}

function guardarCanchas(lista: Cancha[]): void {
  escribirLocal(CLAVES_DEMO.canchas, lista);
}

/** Canchas activas, para el catálogo público. */
export async function obtenerCanchas(): Promise<Cancha[]> {
  if (apiHabilitada()) {
    if (typeof window === "undefined") return semilla().filter((cancha) => cancha.activa);
    return (await listarCanchasApi()).filter((cancha) => cancha.activa);
  }
  await esperarEnDemo(RETARDO_CANCHAS_MS);
  return leerCanchas().filter((cancha) => cancha.activa);
}

/** Todas las canchas activas; en API el panel usa el catálogo real. */
export async function obtenerCanchasAdmin(): Promise<Cancha[]> {
  if (apiHabilitada()) {
    if (typeof window === "undefined") return [];
    return listarCanchasApi();
  }
  await esperarEnDemo(RETARDO_CANCHAS_MS);
  return leerCanchas();
}

/** Busca una cancha en el store de demo (síncrono, para joins). */
export function buscarCanchaLocal(id: string): Cancha | null {
  return leerCanchas().find((cancha) => cancha.id === id) ?? null;
}

export async function obtenerCanchaPorId(id: string): Promise<Cancha | null> {
  if (apiHabilitada()) {
    if (typeof window === "undefined") return semilla().find((cancha) => cancha.id === id) ?? null;
    try {
      const cancha = await obtenerCanchaApi(id);
      return cancha.activa ? cancha : null;
    } catch (error) {
      // 404 se traduce a null; los demás errores se propagan para no mezclar mocks y API.
      if (error instanceof Error && "status" in error && error.status === 404) return null;
      throw error;
    }
  }
  await esperarEnDemo(RETARDO_CANCHAS_MS);
  return buscarCanchaLocal(id);
}

export interface DatosCanchaForm {
  nombre: string;
  descripcion: string;
  activa: boolean;
  precioPorHora?: number;
}

export type ResultadoCreacionCancha = { ok: true; cancha: Cancha } | { ok: false; error: string };

export async function actualizarCancha(
  id: string,
  datos: DatosCanchaForm,
): Promise<ResultadoCreacionCancha> {
  try {
    if (apiHabilitada()) {
      const cancha = await actualizarCanchaApi(id, {
        name: datos.nombre.trim(),
        description: datos.descripcion.trim(),
        is_active: datos.activa,
        ...(datos.precioPorHora !== undefined
          ? { price_per_hour: datos.precioPorHora.toFixed(2) }
          : {}),
      });
      return { ok: true, cancha };
    }
    const canchas = leerCanchas();
    const actual = canchas.find((cancha) => cancha.id === id);
    if (!actual) return { ok: false, error: "Cancha no encontrada." };
    const cancha = {
      ...actual,
      ...datos,
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion.trim(),
    };
    guardarCanchas(canchas.map((item) => (item.id === id ? cancha : item)));
    return { ok: true, cancha };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "No se pudo guardar la cancha.",
    };
  }
}

export async function eliminarCancha(id: string): Promise<void> {
  if (apiHabilitada()) return eliminarCanchaApi(id);
  guardarCanchas(leerCanchas().filter((cancha) => cancha.id !== id));
}

/**
 * Crea una cancha en la demo. Valida nombre duplicado (el formulario
 * ya valida formato y largo) y completa los campos no pedidos con
 * valores por defecto de la demostración.
 */
export async function crearCancha(datos: DatosCanchaForm): Promise<ResultadoCreacionCancha> {
  if (apiHabilitada()) {
    if (typeof window === "undefined") {
      return { ok: false, error: "La cancha solo se puede crear desde el navegador." };
    }
    try {
      const cancha = await crearCanchaApi({
        name: datos.nombre.trim(),
        description: datos.descripcion.trim(),
        price_per_hour: "15000.00",
        players_per_team: 5,
        location: "Dirección a confirmar",
        surface_type: "synthetic",
      });
      if (!datos.activa) {
        await actualizarCanchaApi(cancha.id, { is_active: false });
        return { ok: true, cancha: { ...cancha, activa: false } };
      }
      return { ok: true, cancha };
    } catch (error) {
      const mensaje =
        error instanceof Error && error.message ? error.message : "No se pudo crear la cancha.";
      return { ok: false, error: mensaje };
    }
  }

  await esperarEnDemo(RETARDO_CANCHAS_MS);
  const canchas = leerCanchas();
  const nombreNormalizado = datos.nombre.trim().toLowerCase();

  if (canchas.some((cancha) => cancha.nombre.trim().toLowerCase() === nombreNormalizado)) {
    return { ok: false, error: "Ya existe una cancha con ese nombre en la demostración." };
  }

  const cancha: Cancha = {
    id: `cancha-${Date.now().toString(36)}`,
    nombre: datos.nombre.trim(),
    descripcion: datos.descripcion.trim(),
    formato: "futbol5",
    superficie: "sintetico",
    direccion: "Dirección a confirmar (demo)",
    precioPorHora: 15000,
    iluminacion: false,
    activa: datos.activa,
  };

  guardarCanchas([...canchas, cancha]);
  return { ok: true, cancha };
}
