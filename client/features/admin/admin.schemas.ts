import { z } from "zod";

/** Esquemas de validación del panel administrativo (demo). */

export const courtSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, "Ingresá un nombre de al menos 3 caracteres.")
    .max(60, "El nombre puede tener hasta 60 caracteres."),
  descripcion: z
    .string()
    .trim()
    .min(10, "Describí la cancha en al menos 10 caracteres.")
    .max(200, "La descripción puede tener hasta 200 caracteres."),
  estado: z.enum(["activo", "inactivo"], "Elegí un estado."),
  precioPorHora: z
    .number("Ingresá un precio válido.")
    .positive("El precio debe ser mayor a cero.")
    .max(99999999.99)
    .optional(),
});

export type CourtFormValues = z.infer<typeof courtSchema>;

export const horarioSchema = z.object({
  inicio: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Ingresá una hora válida en formato HH:MM (ej.: 18:00)."),
});

export type HorarioFormValues = z.infer<typeof horarioSchema>;

export const demoConfigSchema = z.object({
  semaforos: z.boolean(),
  latenciaSimuladaMs: z
    .number("Ingresá un valor numérico.")
    .int("Usá un número entero (milisegundos).")
    .min(0, "Mínimo 0 ms (0 = retardos por defecto de cada flujo).")
    .max(10_000, "Máximo 10.000 ms."),
  retencionReservaMin: z
    .number("Ingresá un valor numérico.")
    .int("Usá un número entero (minutos).")
    .min(1, "Mínimo 1 minuto.")
    .max(120, "Máximo 120 minutos."),
});

export type DemoConfigValues = z.infer<typeof demoConfigSchema>;
