import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "@/components/ui/Modal/Modal";

describe("Modal", () => {
  it("renderiza el diálogo con título accesible y lo cierra con Escape", async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Confirmar reserva">
        <p>Contenido del modal.</p>
      </Modal>,
    );

    const dialogo = screen.getByRole("dialog", { name: "Confirmar reserva" });
    expect(dialogo).toHaveAttribute("aria-modal", "true");
    expect(dialogo).toHaveFocus();

    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("el botón de cierre (X) invoca onClose", async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Pago de la reserva">
        <p>Datos.</p>
      </Modal>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Cerrar diálogo" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("no renderiza nada con open=false", () => {
    render(
      <Modal open={false} onClose={vi.fn()} title="Oculto">
        <p>No debería verse.</p>
      </Modal>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renderiza las acciones del pie cuando se proveen", () => {
    render(
      <Modal
        open
        onClose={vi.fn()}
        title="Eliminar horario"
        footer={<button type="button">Eliminar</button>}
      >
        <p>¿Seguro?</p>
      </Modal>,
    );
    expect(screen.getByRole("button", { name: "Eliminar" })).toBeInTheDocument();
  });
});
