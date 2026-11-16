import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/layout/BrandMark/BrandMark";
import { Container } from "@/components/layout/Container/Container";
import styles from "./AuthLayout.module.scss";

export interface AuthLayoutProps {
  /** Título de la página (h1). */
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Contenido secundario al pie de la tarjeta (ej.: enlace a registro). */
  footer?: ReactNode;
}

/** Estructura compartida de las pantallas de autenticación. */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className={styles.page}>
      <Container className={styles.container}>
        <Link href="/" className={styles.brand} aria-label="CanchasPlay, ir al inicio">
          <BrandMark size="lg" />
        </Link>

        <div className={styles.card}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          {children}
        </div>

        {footer && <p className={styles.footer}>{footer}</p>}
      </Container>
    </div>
  );
}
