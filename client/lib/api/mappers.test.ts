import { describe, expect, it } from "vitest";
import {
  mapAvailabilityResponse,
  mapCourtResponse,
  mapReservationResponse,
  mapUserResponse,
} from "@/lib/api/mappers";

describe("API mappers", () => {
  it("mapea una cancha del backend al dominio del cliente", () => {
    expect(
      mapCourtResponse({
        id: 12,
        name: "Cancha Norte",
        description: null,
        price_per_hour: "24500.50",
        players_per_team: 7,
        location: "Calle 123",
        surface_type: "grass",
        is_active: true,
        created_at: "2026-11-05T12:00:00Z",
      }),
    ).toEqual({
      id: "12",
      nombre: "Cancha Norte",
      descripcion: "",
      formato: "futbol7",
      superficie: "cesped",
      direccion: "Calle 123",
      precioPorHora: 24500.5,
      iluminacion: false,
      activa: true,
      imagenUrl: "/images/cancha-2.svg",
    });
  });

  it("mapea customer/admin a los roles del cliente", () => {
    expect(
      mapUserResponse({
        id: 3,
        name: "Una persona",
        email: "persona@example.com",
        role: "customer",
        is_active: true,
        created_at: "2026-11-05T12:00:00Z",
      }),
    ).toMatchObject({
      id: "3",
      nombre: "Una persona",
      rol: "cliente",
      creadoEn: "2026-11-05T12:00:00Z",
    });
  });

  it("mapea una reserva del backend al modelo de dominio", () => {
    expect(
      mapReservationResponse({
        id: 8,
        court_id: 12,
        user_id: 3,
        court_name: "Cancha Norte",
        date: "2026-11-10",
        time: "19:00:00",
        total_price: "24500.50",
        status: "pending",
        created_at: "2026-11-05T12:00:00Z",
      }),
    ).toMatchObject({
      id: "8",
      canchaId: "12",
      usuarioId: "3",
      fecha: "2026-11-10",
      inicio: "19:00",
      fin: "20:00",
      montoTotal: 24500.5,
      estado: "pendiente",
    });
  });

  it("crea todos los turnos 09:00–23:00 y marca disponibles solo los recibidos", () => {
    const horarios = mapAvailabilityResponse(
      { court_id: 12, date: "2026-11-10", available_times: ["09:00", "11:00:00"] },
      "2026-11-10",
    );

    expect(horarios).toHaveLength(15);
    expect(horarios[0]).toMatchObject({ inicio: "09:00", fin: "10:00", disponible: true });
    expect(horarios[1]).toMatchObject({ inicio: "10:00", fin: "11:00", disponible: false });
    expect(horarios.at(-1)).toMatchObject({ inicio: "23:00", fin: "00:00", disponible: false });
  });
});
