"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui";
import { useSession } from "@/contexts/SessionContext";
import { AuthForm } from "@/features/auth/components/AuthForm";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { FormField } from "@/features/auth/components/FormField";
import { PasswordInput } from "@/features/auth/components/PasswordInput";
import { DemoAccountsHint } from "@/features/auth/DemoAccountsHint";
import { loginSchema, type LoginValues } from "@/features/auth/auth.schemas";
import styles from "./LoginForm.module.scss";
import { apiHabilitada } from "@/lib/api/config";

export function LoginForm() {
  const router = useRouter();
  const { usuario, iniciarSesion, isRestoring } = useSession();
  const [errorServidor, setErrorServidor] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Con sesión activa no tiene sentido mostrar el formulario.
  useEffect(() => {
    if (usuario) router.replace("/");
  }, [usuario, router]);

  if (isRestoring) {
    return (
      <AuthLayout title="Iniciar sesión" subtitle="Estamos verificando tu sesión.">
        <p role="status" aria-live="polite">
          Restaurando sesión…
        </p>
      </AuthLayout>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    setErrorServidor(undefined);
    const resultado = await iniciarSesion(values.email, values.password);

    if (!resultado.ok) {
      setErrorServidor(resultado.error);
      return;
    }

    toast.success(apiHabilitada() ? "Sesión iniciada" : "Sesión iniciada (demo)", {
      description: apiHabilitada()
        ? "Ya podés usar tu cuenta en CanchasPlay."
        : "Navegá como cliente o administrador según la cuenta.",
    });
    router.replace("/");
  });

  return (
    <AuthLayout
      title="Iniciar sesión"
      subtitle={
        apiHabilitada()
          ? "Ingresá con tu cuenta de CanchasPlay."
          : "Accedé con una cuenta de prueba para probar la navegación por roles."
      }
      footer={
        <>
          ¿No tenés cuenta? <Link href="/registro">Registrate</Link>
        </>
      }
    >
      <AuthForm
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        error={errorServidor}
        errorTitle="No pudimos iniciar sesión"
        submitLabel="Iniciar sesión"
      >
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

        <FormField label="Contraseña" htmlFor="password" required error={errors.password?.message}>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="••••••••"
            invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
        </FormField>

        {!apiHabilitada() && (
          <div className={styles.demoWrap}>
            <DemoAccountsHint onSelect={(email) => setValue("email", email)} />
          </div>
        )}
      </AuthForm>
    </AuthLayout>
  );
}
