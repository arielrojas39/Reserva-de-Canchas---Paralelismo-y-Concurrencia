import type { Cancha, FormatoCancha, Horario, Reserva, SuperficieCancha, Usuario } from "@/types";
import type {
  AvailabilityResponse,
  CourtResponse,
  ReservationResponse,
  UserResponse,
} from "@/lib/api/types";

function formatoDe(playersPerTeam: number): FormatoCancha {
  if (playersPerTeam === 5 || playersPerTeam === 7 || playersPerTeam === 11) {
    return `futbol${playersPerTeam}`;
  }
  throw new Error(`Formato de cancha no soportado por la interfaz: ${playersPerTeam}.`);
}

function superficieDe(surfaceType: string): SuperficieCancha {
  switch (surfaceType) {
    case "synthetic":
      return "sintetico";
    case "grass":
      return "cesped";
    case "concrete":
      return "parquet";
    default:
      throw new Error(`Superficie de cancha no soportada por la interfaz: ${surfaceType}.`);
  }
}

export function mapCourtResponse(response: CourtResponse): Cancha {
  const formato = formatoDe(response.players_per_team);
  const precioPorHora = Number(response.price_per_hour);
  if (!Number.isFinite(precioPorHora) || precioPorHora <= 0) {
    throw new Error("La API devolvió un precio de cancha inválido.");
  }
  const imagenPorFormato: Record<FormatoCancha, string> = {
    futbol5: "/images/cancha-1.svg",
    futbol7: "/images/cancha-2.svg",
    futbol11: "/images/cancha-3.svg",
  };
  return {
    id: String(response.id),
    nombre: response.name,
    descripcion: response.description ?? "",
    formato,
    superficie: superficieDe(response.surface_type),
    direccion: response.location,
    precioPorHora,
    iluminacion: false,
    activa: response.is_active,
    imagenUrl: imagenPorFormato[formato],
  };
}

export function mapUserResponse(response: UserResponse): Usuario {
  return {
    id: String(response.id),
    nombre: response.name,
    email: response.email,
    rol: response.role === "admin" ? "admin" : "cliente",
    creadoEn: response.created_at ?? new Date().toISOString(),
  };
}

function horaHHmm(time: string): string {
  return time.slice(0, 5);
}

function estadoDe(status: string): Reserva["estado"] {
  switch (status.toLowerCase()) {
    case "confirmed":
    case "confirmada":
      return "confirmada";
    case "completed":
    case "completada":
      return "completada";
    case "cancelled":
    case "canceled":
    case "cancelada":
      return "cancelada";
    case "expired":
    case "expirada":
      return "expirada";
    case "paying":
    case "pagando":
      return "pagando";
    default:
      if (status.toLowerCase() === "pending" || status.toLowerCase() === "pendiente") {
        return "pendiente";
      }
      throw new Error(`Estado de reserva no soportado por la interfaz: ${status}.`);
  }
}

export function mapReservationResponse(response: ReservationResponse): Reserva {
  const inicio = horaHHmm(response.time);
  const [hour, minute] = inicio.split(":").map(Number);
  const fin = `${String((hour + 1) % 24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  return {
    id: String(response.id),
    canchaId: String(response.court_id),
    usuarioId: String(response.user_id),
    horarioId: `${response.court_id}-${response.date}-${inicio}`,
    fecha: response.date,
    inicio,
    fin,
    montoTotal: Number(response.total_price),
    estado: estadoDe(response.status),
    creadaEn: response.created_at,
  };
}

export function mapAvailabilityResponse(response: AvailabilityResponse, fecha: string): Horario[] {
  const availableTimes = new Set(response.available_times.map(horaHHmm));
  return Array.from({ length: 15 }, (_, index) => {
    const hour = index + 9;
    const inicio = `${String(hour).padStart(2, "0")}:00`;
    const fin = `${String((hour + 1) % 24).padStart(2, "0")}:00`;
    return {
      id: `${response.court_id}-${fecha}-${inicio}`,
      canchaId: String(response.court_id),
      fecha,
      inicio,
      fin,
      disponible: availableTimes.has(inicio),
    };
  });
}
