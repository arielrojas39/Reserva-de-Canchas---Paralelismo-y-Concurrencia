"use client";

import type { ReactNode } from "react";
import { ShieldCheck, User } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";
import { Container } from "@/components/layout/Container/Container";
import { useSession } from "@/contexts/SessionContext";
import { apiHabilitada } from "@/lib/api/config";
import styles from "./SessionGate.module.scss";

export interface SessionGateProps {
  /** Título (h1) de la página. */
  heading: string;
  /** Restringe la sección al perfil administrador. */
  requiereAdmin?: boolean;
  children: ReactNode;
}

/**
 * Guardia de navegación SOLO de demostración para rutas privadas:
 * decide qué mostrar según el estado de sesión simulado. No es una
 * medida de seguridad — la protección real llega con la autenticación.
 */
export function SessionGate({ heading, requiereAdmin = false, children }: SessionGateProps) {
  const { usuario, estado, isRestoring } = useSession();

  return (
    <div className={styles.page}>
      <Container>
        <h1 className={styles.title}>{heading}</h1>

        {isRestoring ? (
          <p role="status" aria-live="polite">
            Restaurando sesión…
          </p>
        ) : !usuario ? (
          <EmptyState
            icon={<User size={32} />}
            title="Iniciá sesión para continuar"
            description={
              apiHabilitada()
                ? "Iniciá sesión con tu cuenta para continuar."
                : "Esta es una ruta protegida de demostración. Ingresá con una cuenta de prueba: la protección real llegará con la integración de autenticación."
            }
            action={
              <Button href="/login" size="lg">
                Iniciar sesión
              </Button>
            }
          />
        ) : requiereAdmin && estado !== "admin" ? (
          <EmptyState
            icon={<ShieldCheck size={32} />}
            title="Sección solo para administradores"
            description={
              apiHabilitada()
                ? "Tu cuenta no tiene permisos de administración."
                : "Tu cuenta de demostración no tiene permisos de administración."
            }
            action={
              <Button href="/" variant="outline">
                Volver al inicio
              </Button>
            }
          />
        ) : (
          children
        )}
      </Container>
    </div>
  );
}
