import { apiRequest } from "@/lib/api/http";
import { mapCourtResponse } from "@/lib/api/mappers";
import type { CourtResponse } from "@/lib/api/types";
import type { Cancha } from "@/types";

interface CourtCreatePayload {
  name: string;
  description: string;
  price_per_hour: string;
  players_per_team: number;
  location: string;
  surface_type: "synthetic" | "grass" | "concrete";
}

interface CourtUpdatePayload {
  name?: string;
  is_active?: boolean;
  price_per_hour?: string;
  players_per_team?: number;
  description?: string;
}

const canchasCache = new Map<string, Cancha>();

function cachear(cancha: Cancha): Cancha {
  canchasCache.set(cancha.id, cancha);
  return cancha;
}

export async function listarCanchasApi(): Promise<Cancha[]> {
  const responses = await apiRequest<CourtResponse[]>("/courts");
  return responses.map((response) => cachear(mapCourtResponse(response)));
}

export async function obtenerCanchaApi(id: string): Promise<Cancha> {
  const response = await apiRequest<CourtResponse>(`/courts/${encodeURIComponent(id)}`);
  return cachear(mapCourtResponse(response));
}

export function canchaCacheada(id: string): Cancha | null {
  return canchasCache.get(id) ?? null;
}

export async function disponibilidadApi(courtId: string, date: string) {
  const query = new URLSearchParams({ date });
  return apiRequest<import("@/lib/api/types").AvailabilityResponse>(
    `/courts/${encodeURIComponent(courtId)}/availability?${query.toString()}`,
  );
}

export async function crearCanchaApi(payload: CourtCreatePayload): Promise<Cancha> {
  const response = await apiRequest<CourtResponse>("/courts/", {
    method: "POST",
    authenticated: true,
    body: JSON.stringify(payload),
  });
  return cachear(mapCourtResponse(response));
}

export async function actualizarCanchaApi(
  id: string,
  payload: CourtUpdatePayload,
): Promise<Cancha> {
  const response = await apiRequest<CourtResponse>(`/courts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    authenticated: true,
    body: JSON.stringify(payload),
  });
  return cachear(mapCourtResponse(response));
}

export async function eliminarCanchaApi(id: string): Promise<void> {
  await apiRequest<void>(`/courts/${encodeURIComponent(id)}`, {
    method: "DELETE",
    authenticated: true,
  });
  canchasCache.delete(id);
}
