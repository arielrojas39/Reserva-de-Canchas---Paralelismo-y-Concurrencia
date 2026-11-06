import { esperarSimulado } from "@/lib/services/demo.config";
import { actualizarReserva, expirarReserva, obtenerReserva } from "@/lib/services/reservas.service";
import { apiHabilitada } from "@/lib/api/config";
import { ApiError } from "@/lib/api/http";
import { limpiarToken } from "@/lib/api/token";
import { crearPreferenciaPagoApi } from "@/lib/api/payments";
import type { Reserva } from "@/types";

/**
 * Servicio simulado de pagos — SOLO DEMOSTRACIÓN.
 *
 * No solicita datos bancarios ni realiza cobros: solo transiciona el
 * estado de la reserva ficticia según la opción elegida en la
 * interfaz, con reglas simples (duplicado, expirado) leídas del
 * store local.
 */

export type CodigoPago = 200 | 402 | 409 | 410 | 500;

/** Opción elegida en el modal de pago (simulación controlada). */
export type ModoPago = "aprobado" | "rechazado" | "error";

export interface ResultadoPago {
  codigo: CodigoPago;
  /** Estado final de la reserva cuando hubo transición. */
  reserva?: Reserva;
}

export const RETARDO_PAGO_MS = 1200;

export async function pagarReservaDemo(
  reservaId: string,
  modo: ModoPago = "aprobado",
): Promise<ResultadoPago> {
  // Reglas previas según el estado persistido (puede haber cambiado
  // en otra pestaña: de ahí el pago duplicado).
  const previa = obtenerReserva(reservaId);

  if (!previa) return { codigo: 410 };
  if (previa.estado === "expirada" || previa.estado === "cancelada") {
    return { codigo: 410 };
  }
  if (previa.estado === "confirmada" || previa.estado === "pagando") {
    return { codigo: 409 };
  }
  if (previa.expiracion && Date.now() > new Date(previa.expiracion).getTime()) {
    await expirarReserva(reservaId);
    return { codigo: 410 };
  }

  // En curso… el estado PAGANDO queda visible en el store.
  actualizarReserva(reservaId, { estado: "pagando" });
  await esperarSimulado(RETARDO_PAGO_MS);

  if (modo === "error") {
    // Error simulado: la reserva vuelve a quedar pendiente.
    const recuperada = actualizarReserva(reservaId, { estado: "pendiente" });
    return { codigo: 500, reserva: recuperada ?? undefined };
  }

  if (modo === "rechazado") {
    const cancelada = actualizarReserva(reservaId, { estado: "cancelada" });
    return { codigo: 402, reserva: cancelada ?? undefined };
  }

  const confirmada = actualizarReserva(reservaId, { estado: "confirmada" });
  return { codigo: 200, reserva: confirmada ?? undefined };
}

export type ResultadoPreferencia = { ok: true; checkoutUrl: string } | { ok: false; error: string };

/** Crea la preferencia de Checkout Pro y devuelve la URL de Mercado Pago. */
export async function iniciarPagoMercadoPago(reservaId: string): Promise<ResultadoPreferencia> {
  if (!apiHabilitada()) {
    return { ok: false, error: "Mercado Pago no está configurado en este entorno." };
  }

  const numero = Number(reservaId);
  if (!Number.isSafeInteger(numero) || numero <= 0) {
    return { ok: false, error: "La reserva no es válida para pagar." };
  }

  try {
    const preferencia = await crearPreferenciaPagoApi(numero);
    return { ok: true, checkoutUrl: preferencia.checkout_url };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        limpiarToken();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("canchasplay:sesion-change"));
        }
        return { ok: false, error: "Tu sesión venció. Iniciá sesión nuevamente." };
      }
      if (error.status === 409) {
        return { ok: false, error: error.message };
      }
      if (error.status === 503) {
        return {
          ok: false,
          error: "Mercado Pago no está configurado o no está disponible.",
        };
      }
    }
    return { ok: false, error: "No se pudo iniciar el pago. Intentá nuevamente." };
  }
}
