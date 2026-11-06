import { Suspense } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/layout/BrandMark/BrandMark";
import { Container } from "@/components/layout/Container/Container";
import { CurrentYear } from "@/components/layout/Footer/CurrentYear";
import styles from "./Footer.module.scss";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/#canchas", label: "Canchas" },
  { href: "/mis-reservas", label: "Mis reservas" },
];

const ACCOUNT_LINKS = [
  { href: "/login", label: "Iniciar sesión" },
  { href: "/registro", label: "Registrarse" },
];

/** Pie de página global. */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.grid}>
          <div className={styles.brandBlock}>
            <Link href="/" className={styles.brand} aria-label="CanchasPlay, ir al inicio">
              <BrandMark />
            </Link>
            <p className={styles.description}>
              Reservá canchas de fútbol 5, 7 y 11 en pocos pasos, a cualquier hora del día.
            </p>
          </div>

          <nav className={styles.linkGroup} aria-label="Navegación del pie">
            <h2 className={styles.linkTitle}>Navegación</h2>
            <ul className={styles.linkList}>
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={styles.link}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className={styles.linkGroup} aria-label="Cuenta">
            <h2 className={styles.linkTitle}>Cuenta</h2>
            <ul className={styles.linkList}>
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={styles.link}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className={styles.bottom}>
          <p>
            ©{" "}
            <Suspense fallback={"…"}>
              <CurrentYear />
            </Suspense>{" "}
            CanchasPlay — Reservas de canchas de fútbol
          </p>
          <p className={styles.stage}>Plataforma en desarrollo</p>
        </div>
      </Container>
    </footer>
  );
}
