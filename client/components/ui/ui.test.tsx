import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Alert } from "@/components/ui/Alert/Alert";
import { Badge } from "@/components/ui/Badge/Badge";
import { Button } from "@/components/ui/Button/Button";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Input } from "@/components/ui/Input/Input";
import { Switch } from "@/components/ui/Switch/Switch";

describe("Button", () => {
  it("renderiza como botón y ejecuta onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Reservar</Button>);
    const boton = screen.getByRole("button", { name: "Reservar" });
    expect(boton).toBeEnabled();
    await userEvent.click(boton);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("isLoading deshabilita el botón y marca aria-busy", () => {
    render(<Button isLoading>Guardando</Button>);
    const boton = screen.getByRole("button", { name: "Guardando" });
    expect(boton).toBeDisabled();
    expect(boton).toHaveAttribute("aria-busy", "true");
  });

  it("con href renderiza un enlace (navegación, no acción)", () => {
    render(<Button href="/canchas">Ver canchas</Button>);
    const enlace = screen.getByRole("link", { name: "Ver canchas" });
    expect(enlace).toHaveAttribute("href", "/canchas");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("Input", () => {
  it("asocia label, error y hint accesiblemente", () => {
    render(<Input label="Correo" hint="Usá tu email de prueba." error="Email inválido." />);
    const input = screen.getByLabelText(/Correo/);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Email inválido.");
  });

  it("sin error muestra el hint como descripción", () => {
    render(<Input label="Nombre" hint="Mínimo 3 caracteres." />);
    const input = screen.getByLabelText(/Nombre/);
    expect(input).toHaveAccessibleDescription("Mínimo 3 caracteres.");
  });
});

describe("Switch", () => {
  it("expone role switch y notifica cambios", async () => {
    const onChange = vi.fn();
    render(<Switch label="Semáforos" checked={false} onChange={onChange} />);
    const control = screen.getByRole("switch", { name: /Semáforos/ });
    expect(control).not.toBeChecked();
    await userEvent.click(control);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("refleja el estado controlado", () => {
    render(<Switch label="Latencia" checked onChange={() => {}} />);
    expect(screen.getByRole("switch", { name: /Latencia/ })).toBeChecked();
  });
});

describe("Alert", () => {
  it("la variante error usa role alert; la info usa status", () => {
    const { rerender } = render(
      <Alert variant="error" title="Fallo">
        Algo salió mal.
      </Alert>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Algo salió mal.");

    rerender(
      <Alert variant="info" title="Demo">
        Solo datos ficticios.
      </Alert>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Solo datos ficticios.");
  });
});

describe("Badge / EmptyState", () => {
  it("Badge muestra su texto y EmptyState es un status accesible", () => {
    render(
      <>
        <Badge variant="success">Confirmada</Badge>
        <EmptyState title="Sin resultados" description="Probá con otros filtros." />
      </>,
    );
    expect(screen.getByText("Confirmada")).toBeInTheDocument();
    const estado = screen.getByRole("status");
    expect(estado).toHaveTextContent("Sin resultados");
    expect(estado).toHaveTextContent("Probá con otros filtros.");
  });
});
