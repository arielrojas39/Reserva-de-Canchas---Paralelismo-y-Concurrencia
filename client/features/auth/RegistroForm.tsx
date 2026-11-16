"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { toast } from "sonner";
import { Alert, Button, Input } from "@/components/ui";
import { registrarse } from "@/lib/services/auth.service";
import { apiHabilitada } from "@/lib/api/config";
import { AuthForm } from "@/features/auth/components/AuthForm";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { FormField } from "@/features/auth/components/FormField";
import { PasswordInput } from "@/features/auth/components/PasswordInput";
import { registroSchema, type RegistroValues } from "@/features/auth/auth.schemas";
import styles from "./RegistroForm.module.scss";

export function RegistroForm() {
  const [errorServidor, setErrorServidor] = useState<string | undefined>();
  const [exito, setExito] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegistroValues>({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      nombre: "",
      email: "",
      password: "",
      confirmarPassword: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setErrorServidor(undefined);
    const resultado = await registrarse({
      nombre: values.nombre,
      email: values.email,
      password: values.password,
    });

    if (!resultado.ok) {
      setErrorServidor(resultado.error);
      return;
    }

    setExito(true);
    toast.success(apiHabilitada() ? "Cuenta creada" : "Cuenta creada (demo)", {
      description: apiHabilitada()
        ? "Ya podés iniciar sesión con tu cuenta."
        : "La cuenta no se persiste: es solo una demostración.",
    });
  });

  return (
    <AuthLayout
      title="Crear cuenta"
      subtitle={
        apiHabilitada()
          ? "Completá tus datos para crear tu cuenta."
          : "Completá tus datos para probar la plataforma con una sesión de demostración."
      }
      footer={
        <>
          ¿Ya tenés cuenta? <Link href="/login">Iniciá sesión</Link>
        </>
      }
    >
      {exito ? (
        <div className={styles.success}>
          <Alert
            variant="success"
            title={apiHabilitada() ? "Cuenta creada" : "Cuenta creada (demo)"}
          >
            {apiHabilitada()
              ? "Tu cuenta se registró correctamente. Iniciá sesión para continuar."
              : "El registro fue simulado y no se guardó en ningún servicio. Para probar el inicio de sesión, volvé al formulario con tus mismos datos o usá las cuentas de prueba."}
          </Alert>
          <Button href="/login" size="lg" fullWidth>
            <CircleCheck size={18} aria-hidden="true" />
            Ir a iniciar sesión
          </Button>
        </div>
      ) : (
        <AuthForm
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          error={errorServidor}
          errorTitle="No pudimos crear la cuenta"
          submitLabel="Crear cuenta"
        >
          <FormField
            label="Nombre y apellido"
            htmlFor="nombre"
            required
            error={errors.nombre?.message}
          >
            <Input
              id="nombre"
              autoComplete="name"
              placeholder="Martín Gómez"
              invalid={Boolean(errors.nombre)}
              aria-describedby={errors.nombre ? "nombre-error" : undefined}
              {...register("nombre")}
            />
          </FormField>

          <FormField
            label="Correo electrónico"
            htmlFor="email"
            required
            error={errors.email?.message}
          >
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="nombre@correo.com"
              invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
          </FormField>

          <FormField
            label="Contraseña"
            htmlFor="password"
            required
            hint="Mínimo 8 caracteres."
            error={errors.password?.message}
          >
            <PasswordInput
              id="password"
              autoComplete="new-password"
              placeholder="••••••••"
              invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
          </FormField>

          <FormField
            label="Confirmar contraseña"
            htmlFor="confirmarPassword"
            required
            error={errors.confirmarPassword?.message}
          >
            <PasswordInput
              id="confirmarPassword"
              autoComplete="new-password"
              placeholder="••••••••"
              invalid={Boolean(errors.confirmarPassword)}
              aria-describedby={errors.confirmarPassword ? "confirmarPassword-error" : undefined}
              {...register("confirmarPassword")}
            />
          </FormField>
        </AuthForm>
      )}
    </AuthLayout>
  );
}
