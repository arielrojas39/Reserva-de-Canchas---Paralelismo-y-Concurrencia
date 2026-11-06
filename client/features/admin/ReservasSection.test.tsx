import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReservasSection } from "@/features/admin/ReservasSection";
import type { ReservaAdmin } from "@/lib/services/reservas.service";

// El servicio se mockea para controlar los datos y el error simulado.
const obtenerReservasParaAdminMock = vi.fn();

vi.mock("@/lib/services/reservas.service", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/services/reservas.service")>();
  return {
    ...original,
    obtenerReservasParaAdmin: () => obtenerReservasParaAdminMock(),
  };
});

function reserva(
  id: string,
  estado: ReservaAdmin["reserva"]["estado"],
  fecha: string,
  canchaId = "cancha-1",
  nombre = "Martín Gómez",
): ReservaAdmin {
  return {
    reserva: {
      id,
      usuarioId: "usuario-1",
      canchaId,
      horarioId: `${canchaId}-${fecha}-18:00`,
      fecha,
      inicio: "18:00",
      fin: "19:00",
      montoTotal: 18000,
      estado,
      creadaEn: "2026-10-20T10:00:00.000Z",
    },
    cancha: {
      id: canchaId,
      nombre: canchaId === "cancha-1" ? "Fútbol 5 Los Álamos" : "Complejo El Potrero",
      descripcion: "Cancha de prueba.",
      formato: "futbol5",
      superficie: "sintetico",
      direccion: "—",
      precioPorHora: 18000,
      iluminacion: false,
      activa: true,
    },
    usuario: {
      id: "usuario-1",
      nombre,
      email: `${nombre.split(" ")[0].toLowerCase()}@example.com`,
      rol: "cliente",
      creadoEn: "2026-09-02T12:00:00.000Z",
    },
  };
}

const DATOS: ReservaAdmin[] = [
  reserva("reserva-1", "confirmada", "2026-11-01"),
  reserva("reserva-2", "pendiente", "2026-11-02", "cancha-2", "Lucía Fernández"),
  reserva("reserva-3", "cancelada", "2026-11-02"),
];

describe("ReservasSection (filtros y estados de la tabla admin)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    obtenerReservasParaAdminMock.mockReset();
    obtenerReservasParaAdminMock.mockResolvedValue(DATOS);
  });

  it("muestra skeleton mientras carga y luego las filas", async () => {
    render(<ReservasSection />);
    await waitFor(() => expect(screen.getAllByRole("row").length).toBeGreaterThan(1));
    expect(screen.getByText("reserva-1")).toBeInTheDocument();
    expect(screen.getByText("reserva-3")).toBeInTheDocument();
  });

  it("filtra por estado con el select", async () => {
    render(<ReservasSection />);
    await waitFor(() => expect(screen.getByText("reserva-3")).toBeInTheDocument());

    await userEvent.selectOptions(screen.getByLabelText("Estado"), "confirmada");

    await waitFor(() => expect(screen.getByText("reserva-1")).toBeInTheDocument());
    expect(screen.queryByText("reserva-2")).not.toBeInTheDocument();
    expect(screen.getByText(/1 de 3 reservas/)).toBeInTheDocument();
  });

  it("busca por nombre de usuario", async () => {
    render(<ReservasSection />);
    await waitFor(() => expect(screen.getByText("reserva-2")).toBeInTheDocument());

    await userEvent.type(screen.getByLabelText("Buscar"), "lucia");

    await waitFor(() => expect(screen.getByText("reserva-2")).toBeInTheDocument());
    expect(screen.queryByText("reserva-1")).not.toBeInTheDocument();
  });

  it("muestra estado vacío por filtros y permite limpiar", async () => {
    render(<ReservasSection />);
    await waitFor(() => expect(screen.getByText("reserva-1")).toBeInTheDocument());

    await userEvent.type(screen.getByLabelText("Buscar"), "no-existe-zzz");

    expect(await screen.findByText("No hay reservas que coincidan")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    await waitFor(() => expect(screen.getByText("reserva-1")).toBeInTheDocument());
  });

  it("filtra por fecha y cancha", async () => {
    render(<ReservasSection />);
    await waitFor(() => expect(screen.getByText("reserva-1")).toBeInTheDocument());

    await userEvent.selectOptions(screen.getByLabelText("Fecha"), "2026-11-02");
    await waitFor(() => expect(screen.queryByText("reserva-1")).not.toBeInTheDocument());
    expect(screen.getByText("reserva-2")).toBeInTheDocument();
    expect(screen.getByText("reserva-3")).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText("Cancha"), "cancha-2");
    await waitFor(() => expect(screen.queryByText("reserva-3")).not.toBeInTheDocument());
    expect(screen.getByText("reserva-2")).toBeInTheDocument();
  });
});
