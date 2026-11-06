import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AvailabilityGrid } from "@/features/canchas/AvailabilityGrid";
import { ReservationModal } from "@/features/reservas/ReservationModal";
import type { DatosReservaDemo } from "@/lib/services/reservas.service";
import type { Horario } from "@/types";

const HORARIO: Horario = {
  id: "cancha-1-2026-11-10-18:00",
  canchaId: "cancha-1",
  fecha: "2026-11-10",
  inicio: "18:00",
  fin: "19:00",
  disponible: true,
};

describe("AvailabilityGrid (estados de la grilla)", () => {
  it("muestra skeletons mientras carga", () => {
    const { container } = render(
      <AvailabilityGrid
        cargando
        horarios={null}
        fecha="2026-11-10"
        canchaNombre="Cancha Test"
        seleccionado={null}
        onSelect={vi.fn()}
      />,
    );
    expect(container.querySelector("[aria-busy='true']")).toBeInTheDocument();
  });

  it("muestra el aviso de sin disponibilidad", () => {
    render(
      <AvailabilityGrid
        cargando={false}
        horarios={[{ ...HORARIO, disponible: false }]}
        fecha="2026-11-10"
        canchaNombre="Cancha Test"
        seleccionado={null}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText(/Sin disponibilidad para esta fecha/)).toBeInTheDocument();
  });

  it("muestra el aviso de sin horarios habilitados con grilla vacía", () => {
    render(
      <AvailabilityGrid
        cargando={false}
        horarios={[]}
        fecha="2026-11-10"
        canchaNombre="Cancha Test"
        seleccionado={null}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText(/Sin horarios habilitados/)).toBeInTheDocument();
  });

  it("permite seleccionar un horario libre", async () => {
    const onSelect = vi.fn();
    render(
      <AvailabilityGrid
        cargando={false}
        horarios={[HORARIO]}
        fecha="2026-11-10"
        canchaNombre="Cancha Test"
        seleccionado={null}
        onSelect={onSelect}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /18:00/ }));
    expect(onSelect).toHaveBeenCalledWith(HORARIO);
  });
});

const DATOS: DatosReservaDemo = {
  canchaId: "cancha-1",
  canchaNombre: "Fútbol 5 Los Álamos",
  horarioId: "cancha-1-2026-11-10-18:00",
  fecha: "2026-11-10",
  inicio: "18:00",
  fin: "19:00",
  montoTotal: 18000,
  usuarioId: "usuario-1",
};

describe("ReservationModal (flujo de reserva simulada)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(
      "canchasplay:config-demo",
      JSON.stringify({
        semaforos: true,
        latenciaSimuladaMs: 1,
        retencionReservaMin: 15,
        escenarioReserva: "auto",
        escenarioPago: "auto",
      }),
    );
  });

  it("confirma la reserva y muestra el resultado201", async () => {
    const onResultado = vi.fn();
    render(<ReservationModal datos={DATOS} onResultado={onResultado} onCerrar={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Confirmar reserva" }));

    await waitFor(() => expect(onResultado).toHaveBeenCalledWith(201));
    expect(await screen.findByText(/Reserva confirmada/)).toBeInTheDocument();
  });

  it("con el escenario de conflicto preseleccionado devuelve409", async () => {
    window.localStorage.setItem(
      "canchasplay:config-demo",
      JSON.stringify({
        semaforos: true,
        latenciaSimuladaMs: 1,
        retencionReservaMin: 15,
        escenarioReserva: "conflicto",
        escenarioPago: "auto",
      }),
    );

    const onResultado = vi.fn();
    render(<ReservationModal datos={DATOS} onResultado={onResultado} onCerrar={vi.fn()} />);

    // El selector de simulación arranca en409 (escenario predefinido).
    expect(screen.getByDisplayValue("409 — Conflicto")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Confirmar reserva" }));
    await waitFor(() => expect(onResultado).toHaveBeenCalledWith(409));
  });
});
