import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CourtForm } from "@/features/admin/CourtForm";
import type { DatosCanchaForm, ResultadoCreacionCancha } from "@/lib/services/canchas.service";

describe("CourtForm (alta de cancha, demo)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("valida los campos antes de enviar", async () => {
    const onCrear = vi.fn();
    render(<CourtForm onCrear={onCrear} onCreada={vi.fn()} onCancelar={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Crear cancha" }));

    expect(await screen.findByText(/al menos 3 caracteres/)).toBeInTheDocument();
    expect(onCrear).not.toHaveBeenCalled();
  });

  it("crea la cancha y notifica el éxito", async () => {
    const canchaCreada: ResultadoCreacionCancha = {
      ok: true,
      cancha: {
        id: "cancha-nueva",
        nombre: "Cancha Test",
        descripcion: "Descripción válida para el formulario.",
        formato: "futbol5",
        superficie: "sintetico",
        direccion: "—",
        precioPorHora: 15000,
        iluminacion: false,
        activa: true,
      },
    };
    const onCrear = vi.fn().mockResolvedValue(canchaCreada);
    const onCreada = vi.fn();
    render(<CourtForm onCrear={onCrear} onCreada={onCreada} onCancelar={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/Nombre/), "Cancha Test");
    await userEvent.type(
      screen.getByLabelText(/Descripción/),
      "Descripción válida para el formulario.",
    );
    await userEvent.click(screen.getByRole("button", { name: "Crear cancha" }));

    expect(await onCreada).toHaveBeenCalled();
    expect(onCrear).toHaveBeenCalledWith({
      nombre: "Cancha Test",
      descripcion: "Descripción válida para el formulario.",
      activa: true,
    });
  });

  it("muestra el error del servicio (nombre duplicado) sin cerrar", async () => {
    const onCrear = vi.fn().mockResolvedValue({
      ok: false,
      error: "Ya existe una cancha con ese nombre en la demostración.",
    } satisfies Extract<ResultadoCreacionCancha, { ok: false }>);
    const onCreada = vi.fn();
    render(<CourtForm onCrear={onCrear} onCreada={onCreada} onCancelar={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/Nombre/), "Cancha Duplicada");
    await userEvent.type(
      screen.getByLabelText(/Descripción/),
      "Descripción válida para el formulario.",
    );
    await userEvent.click(screen.getByRole("button", { name: "Crear cancha" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Ya existe una cancha/);
    expect(onCreada).not.toHaveBeenCalled();
  });

  it("permite elegir el estado inactivo (select → booleano)", async () => {
    const onCrear = vi.fn().mockResolvedValue({ ok: false, error: "stop" });
    render(
      <CourtForm
        onCrear={onCrear as (d: DatosCanchaForm) => Promise<ResultadoCreacionCancha>}
        onCreada={vi.fn()}
        onCancelar={vi.fn()}
      />,
    );

    await userEvent.selectOptions(screen.getByLabelText(/Estado/), "inactivo");
    await userEvent.type(screen.getByLabelText(/Nombre/), "Cancha Inactiva");
    await userEvent.type(
      screen.getByLabelText(/Descripción/),
      "Descripción válida para el formulario.",
    );
    await userEvent.click(screen.getByRole("button", { name: "Crear cancha" }));

    expect(onCrear).toHaveBeenCalledWith(expect.objectContaining({ activa: false }));
  });
});
