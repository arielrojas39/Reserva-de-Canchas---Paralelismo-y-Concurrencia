import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CanchasSection } from "./CanchasSection";

const api = vi.hoisted(() => ({ listar: vi.fn(), editar: vi.fn(), eliminar: vi.fn() }));
vi.mock("@/lib/services/canchas.service", () => ({
  obtenerCanchasAdmin: api.listar,
  actualizarCancha: api.editar,
  eliminarCancha: api.eliminar,
  crearCancha: vi.fn(),
}));
vi.mock("@/lib/services/horarios.service", () => ({ obtenerHorariosPorCancha: async () => ({}) }));
vi.mock("@/lib/api/config", () => ({ apiHabilitada: () => true }));

const cancha = {
  id: "4",
  nombre: "Cancha Norte",
  descripcion: "Cancha con iluminación",
  formato: "futbol5",
  superficie: "sintetico",
  direccion: "Club",
  precioPorHora: 15000,
  iluminacion: true,
  activa: true,
};

describe("acciones del administrador de canchas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.listar.mockResolvedValue([{ ...cancha }]);
    api.eliminar.mockResolvedValue(undefined);
  });

  it("precarga la cancha y refresca el listado al guardar nombre y precio", async () => {
    render(<CanchasSection />);
    await userEvent.click(await screen.findByRole("button", { name: "Editar" }));
    const dialog = within(screen.getByRole("dialog", { name: "Editar cancha" }));
    expect(dialog.getByLabelText(/Nombre/)).toHaveValue("Cancha Norte");
    await userEvent.clear(dialog.getByLabelText(/Nombre/));
    await userEvent.type(dialog.getByLabelText(/Nombre/), "Cancha Sur");
    await userEvent.clear(dialog.getByLabelText(/Precio por hora/));
    await userEvent.type(dialog.getByLabelText(/Precio por hora/), "18000");
    api.editar.mockResolvedValue({
      ok: true,
      cancha: { ...cancha, nombre: "Cancha Sur", precioPorHora: 18000 },
    });
    api.listar.mockResolvedValue([{ ...cancha, nombre: "Cancha Sur", precioPorHora: 18000 }]);
    await userEvent.click(dialog.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByRole("heading", { name: "Cancha Sur" })).toBeInTheDocument();
    expect(api.editar).toHaveBeenCalledWith(
      "4",
      expect.objectContaining({ nombre: "Cancha Sur", precioPorHora: 18000 }),
    );
  });

  it("cancelar no elimina; confirmar elimina la cancha del listado", async () => {
    render(<CanchasSection />);
    await userEvent.click(await screen.findByRole("button", { name: "Eliminar" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(api.eliminar).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    await userEvent.click(screen.getByRole("button", { name: "Eliminar cancha" }));
    expect(await screen.findByText("No hay canchas cargadas")).toBeInTheDocument();
    expect(api.eliminar).toHaveBeenCalledWith("4");
  });

  it("conserva la cancha y el diálogo si falla la baja", async () => {
    api.eliminar.mockRejectedValue(new Error("Sin permisos"));
    render(<CanchasSection />);
    await userEvent.click(await screen.findByRole("button", { name: "Eliminar" }));
    await userEvent.click(screen.getByRole("button", { name: "Eliminar cancha" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Eliminar cancha" })).toBeEnabled(),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cancha Norte" })).toBeInTheDocument();
  });
});
