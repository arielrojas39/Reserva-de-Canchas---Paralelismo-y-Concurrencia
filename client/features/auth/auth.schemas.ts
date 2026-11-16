import { z } from "zod";

/** Validación del formulario de inicio de sesión (demo). */
export const loginSchema = z.object({
  email: z.email("Ingresá un correo electrónico válido."),
  password: z.string().min(1, "Ingresá tu contraseña."),
});

export type LoginValues = z.infer<typeof loginSchema>;

/** Validación del formulario de registro (demo). */
export const registroSchema = z
  .object({
    nombre: z.string().min(2, "Ingresá tu nombre y apellido (mínimo 2 caracteres)."),
    email: z.email("Ingresá un correo electrónico válido."),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
    confirmarPassword: z.string().min(8, "Confirmá tu contraseña."),
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.confirmarPassword) {
      ctx.issues.push({
        code: "custom",
        input: values.confirmarPassword,
        path: ["confirmarPassword"],
        message: "Las contraseñas no coinciden.",
      });
    }
  });

export type RegistroValues = z.infer<typeof registroSchema>;
