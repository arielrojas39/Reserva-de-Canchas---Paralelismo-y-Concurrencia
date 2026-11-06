import { apiRequest } from "@/lib/api/http";
import type { PaymentStatusResponse, PreferenceResponse } from "@/lib/api/types";

export async function crearPreferenciaPagoApi(reservationId: number): Promise<PreferenceResponse> {
  return apiRequest<PreferenceResponse>("/payments/preferences", {
    method: "POST",
    authenticated: true,
    body: JSON.stringify({ reservation_id: reservationId }),
  });
}

export async function obtenerPagoReservaApi(reservationId: string): Promise<PaymentStatusResponse> {
  return apiRequest<PaymentStatusResponse>(
    `/payments/reservations/${encodeURIComponent(reservationId)}`,
    { authenticated: true },
  );
}
