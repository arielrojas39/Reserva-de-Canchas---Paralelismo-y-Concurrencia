import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminReservationsTable } from "@/features/admin/AdminReservationsTable";
import { ReservationStatusBadge } from "@/features/reservas/ReservationStatusBadge";
import { ConfirmDeleteModal } from "@/features/admin/ConfirmDeleteModal";
import type { ReservaAdmin } from "@/lib/services/reservas.service";
import type { EstadoReserva } from "@/types";

const RESERVA: ReservaAdmin = {
  reserva: {
    id: "reserva-9",
    usuarioId: "usuario-1",
    canchaId: "cancha-1",
    horarioId: "h-1",
    fecha: "2026-11-05",
    inicio: "19:00",
    fin: "20:00",
    montoTotal: 18000,
    estado: "confirmada",
    creadaEn: "2026-10-20T10:00:00.000Z",
  },
  cancha: null,
  usuario: null,
};

describe("AdminReservationsTable (estados)", () => {
  it("muestra skeleton con reservas=null (cargando)", () => {
    const { container } = render(<AdminReservationsTable reservas={null} />);
    expect(container.querySelector("[aria-busy='true']")).toBeInTheDocument();
  });

  it("muestra el error simulado con role alert", () => {
    render(<AdminReservationsTable reservas={null} error />);
    expect(screen.getByRole("alert")).toHaveTextContent(/No pudimos cargar las reservas/);
  });

  it("distingue el vacío total del vacío por filtros", () => {
    const { rerender } = render(<AdminReservationsTable reservas={[]} />);
    expect(screen.getByText("No hay reservas")).toBeInTheDocument();

    rerender(<AdminReservationsTable reservas={[]} vacioPorFiltros />);
    expect(screen.getByText("No hay reservas que coincidan")).toBeInTheDocument();
  });

  it("renderiza la tabla con columnas semánticas y datos", () => {
    render(<AdminReservationsTable reservas={[RESERVA]} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Correo" })).toBeInTheDocument();
    expect(screen.getByText("reserva-9")).toBeInTheDocument();
    expect(screen.getByText("19:00 – 20:00")).toBeInTheDocument();
  });
});

describe("ReservationStatusBadge (todos los estados)", () => {
  const estados: Array<[EstadoReserva, string]> = [
    ["pendiente", "Pendiente de pago"],
    ["pagando", "Pagando"],
    ["confirmada", "Confirmada"],
    ["completada", "Completada"],
    ["cancelada", "Cancelada"],
    ["expirada", "Expirada"],
  ];

  it.each(estados)("el estado %s muestra el texto %s", (estado, texto) => {
    render(<ReservationStatusBadge estado={estado} />);
    expect(screen.getByText(texto)).toBeInTheDocument();
  });
});

describe("ConfirmDeleteModal (confirmación destructiva)", () => {
  it("confirma la eliminación y notifica el éxito", async () => {
    const onConfirmar = vi.fn().mockResolvedValue({ ok: true });
    const onEliminado = vi.fn();
    render(
      <ConfirmDeleteModal
        titulo="Eliminar horario"
        mensaje="Se quitará el horario 18:00."
        onConfirmar={onConfirmar}
        onEliminado={onEliminado}
        onCerrar={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /Eliminar/ }));
    expect(onConfirmar).toHaveBeenCalledOnce();
    expect(onEliminado).toHaveBeenCalled();
  });

  it("muestra el error del servicio y no cierra", async () => {
    const onConfirmar = vi.fn().mockResolvedValue({ ok: false, error: "No se pudo eliminar." });
    const onEliminado = vi.fn();
    render(
      <ConfirmDeleteModal
        titulo="Eliminar horario"
        mensaje="Se quitará el horario 18:00."
        onConfirmar={onConfirmar}
        onEliminado={onEliminado}
        onCerrar={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /Eliminar/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo eliminar.");
    expect(onEliminado).not.toHaveBeenCalled();
  });

  it("cancelar cierra sin confirmar", async () => {
    const onConfirmar = vi.fn();
    const onCerrar = vi.fn();
    render(
      <ConfirmDeleteModal
        titulo="Eliminar horario"
        mensaje="Se quitará el horario 18:00."
        onConfirmar={onConfirmar}
        onEliminado={vi.fn()}
        onCerrar={onCerrar}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCerrar).toHaveBeenCalled();
    expect(onConfirmar).not.toHaveBeenCalled();
  });
});
