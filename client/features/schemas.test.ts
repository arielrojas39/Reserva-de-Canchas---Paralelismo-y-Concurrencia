import { describe, expect, it } from "vitest";
import { loginSchema, registroSchema } from "@/features/auth/auth.schemas";
import { courtSchema, demoConfigSchema, horarioSchema } from "@/features/admin/admin.schemas";

describe("loginSchema", () => {
  it("acepta credenciales válidas", () => {
    const resultado = loginSchema.safeParse({
      email: "martin.gomez@example.com",
      password: "demo1234",
    });
    expect(resultado.success).toBe(true);
  });

  it("rechaza un email inválido con mensaje en español", () => {
    const resultado = loginSchema.safeParse({ email: "no-es-email", password: "x" });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0].message).toBe("Ingresá un correo electrónico válido.");
    }
  });

  it("rechaza la contraseña vacía", () => {
    const resultado = loginSchema.safeParse({ email: "a@b.com", password: "" });
    expect(resultado.success).toBe(false);
  });
});

describe("registroSchema", () => {
  it("acepta un registro válido", () => {
    const resultado = registroSchema.safeParse({
      nombre: "Martín Gómez",
      email: "nuevo@example.com",
      password: "secreta123",
      confirmarPassword: "secreta123",
    });
    expect(resultado.success).toBe(true);
  });

  it("rechaza contraseñas que no coinciden", () => {
    const resultado = registroSchema.safeParse({
      nombre: "Martín Gómez",
      email: "nuevo@example.com",
      password: "secreta123",
      confirmarPassword: "otra12345",
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0].message).toBe("Las contraseñas no coinciden.");
    }
  });

  it("exige8 caracteres mínimos en la contraseña", () => {
    const resultado = registroSchema.safeParse({
      nombre: "Ana",
      email: "ana@example.com",
      password: "corta",
      confirmarPassword: "corta",
    });
    expect(resultado.success).toBe(false);
  });
});

describe("courtSchema", () => {
  it("acepta una cancha válida", () => {
    expect(
      courtSchema.safeParse({
        nombre: "Fútbol 5 Centro",
        descripcion: "Cancha de barrio con iluminación.",
        estado: "activo",
      }).success,
    ).toBe(true);
  });

  it("rechaza nombre corto y descripción corta", () => {
    const resultado = courtSchema.safeParse({
      nombre: "ab",
      descripcion: "corta",
      estado: "activo",
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("rechaza un estado fuera del enum", () => {
    expect(
      courtSchema.safeParse({
        nombre: "Cancha Válida",
        descripcion: "Descripción suficientemente larga.",
        estado: "archivada",
      }).success,
    ).toBe(false);
  });
});

describe("horarioSchema", () => {
  it("acepta una hora HH:MM válida", () => {
    expect(horarioSchema.safeParse({ inicio: "18:00" }).success).toBe(true);
    expect(horarioSchema.safeParse({ inicio: "09:30" }).success).toBe(true);
  });

  it("rechaza horas inválidas", () => {
    expect(horarioSchema.safeParse({ inicio: "25:00" }).success).toBe(false);
    expect(horarioSchema.safeParse({ inicio: "18h00" }).success).toBe(false);
    expect(horarioSchema.safeParse({ inicio: "" }).success).toBe(false);
  });
});

describe("demoConfigSchema", () => {
  it("acepta una configuración válida", () => {
    expect(
      demoConfigSchema.safeParse({
        semaforos: false,
        latenciaSimuladaMs: 1500,
        retencionReservaMin: 30,
      }).success,
    ).toBe(true);
  });

  it("acota los rangos numéricos", () => {
    expect(
      demoConfigSchema.safeParse({
        semaforos: true,
        latenciaSimuladaMs: -1,
        retencionReservaMin: 15,
      }).success,
    ).toBe(false);
    expect(
      demoConfigSchema.safeParse({
        semaforos: true,
        latenciaSimuladaMs: 0,
        retencionReservaMin: 999,
      }).success,
    ).toBe(false);
  });

  it("rechaza números no enteros", () => {
    expect(
      demoConfigSchema.safeParse({
        semaforos: true,
        latenciaSimuladaMs: 12.5,
        retencionReservaMin: 15,
      }).success,
    ).toBe(false);
  });
});
