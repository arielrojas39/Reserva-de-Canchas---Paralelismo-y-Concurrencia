import { apiRequest } from "@/lib/api/http";
import type { CreateReservationRequest, ReservationResponse } from "@/lib/api/types";

export async function crearReservaApi(
  datos: CreateReservationRequest,
): Promise<ReservationResponse> {
  return apiRequest<ReservationResponse>("/reservations", {
    method: "POST",
    authenticated: true,
    body: JSON.stringify(datos),
  });
}

export async function listarMisReservasApi(): Promise<ReservationResponse[]> {
  return apiRequest<ReservationResponse[]>("/reservations/me", { authenticated: true });
}

export async function listarReservasAdminApi(): Promise<ReservationResponse[]> {
  return apiRequest<ReservationResponse[]>("/reservations", { authenticated: true });
}

export async function obtenerReservaApi(id: string): Promise<ReservationResponse> {
  return apiRequest<ReservationResponse>(`/reservations/${encodeURIComponent(id)}`, {
    authenticated: true,
  });
}

export async function cancelarReservaApi(id: string): Promise<ReservationResponse> {
  return apiRequest<ReservationResponse>(`/reservations/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    authenticated: true,
  });
}
