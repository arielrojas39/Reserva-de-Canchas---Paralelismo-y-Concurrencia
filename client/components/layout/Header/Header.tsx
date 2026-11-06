"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogOut, Menu, User, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { BrandMark } from "@/components/layout/BrandMark/BrandMark";
import { Container } from "@/components/layout/Container/Container";
import { UserMenu } from "@/components/layout/UserMenu/UserMenu";
import { useSession } from "@/contexts/SessionContext";
import { apiHabilitada } from "@/lib/api/config";
import { useScrolled } from "@/hooks/useScrolled";
import styles from "./Header.module.scss";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/#canchas", label: "Canchas" },
  { href: "/mis-reservas", label: "Mis reservas" },
];

const ADMIN_LINK = { href: "/admin", label: "Administración" };

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const scrolled = useScrolled();
  const { usuario, estado, cerrarSesion, isRestoring } = useSession();

  const esAdmin = estado === "admin";
  const navLinks = esAdmin ? [...NAV_LINKS, ADMIN_LINK] : NAV_LINKS;

  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    cerrarSesion();
    toast.success(`Sesión cerrada${apiHabilitada() ? "" : " (demo)"}`);
  };

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`.trim()}>
      <Container>
        <div className={styles.inner}>
          <Link
            href="/"
            className={styles.brand}
            aria-label="CanchasPlay, ir al inicio"
            onClick={() => setMenuOpen(false)}
          >
            <BrandMark />
          </Link>

          <nav className={styles.nav} aria-label="Navegación principal">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={styles.navLink}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className={styles.actions}>
            {isRestoring ? (
              <span role="status" aria-live="polite">
                Restaurando sesión…
              </span>
            ) : usuario ? (
              <UserMenu />
            ) : (
              <>
                <Button href="/login" variant="ghost" size="sm">
                  Iniciar sesión
                </Button>
                <Button href="/registro" variant="primary" size="sm">
                  Registrarse
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            className={styles.menuButton}
            aria-expanded={menuOpen}
            aria-controls="menu-movil"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </Container>

      {menuOpen && (
        <div id="menu-movil" className={styles.mobilePanel}>
          <Container>
            <nav className={styles.mobileNav} aria-label="Navegación móvil">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={styles.mobileNavLink}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              {isRestoring ? (
                <p role="status" aria-live="polite">
                  Restaurando sesión…
                </p>
              ) : usuario ? (
                <>
                  <div className={styles.mobileUser}>
                    <span className={styles.mobileUserIcon} aria-hidden="true">
                      <User size={18} />
                    </span>
                    <span>
                      <span className={styles.mobileUserName}>{usuario.nombre}</span>
                      <span className={styles.mobileUserEmail}>{usuario.email}</span>
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={handleLogout}
                    className={styles.mobileLogout}
                  >
                    <LogOut size={16} aria-hidden="true" />
                    Cerrar sesión
                  </Button>
                </>
              ) : (
                <div className={styles.mobileActions}>
                  <Button
                    href="/login"
                    variant="outline"
                    fullWidth
                    onClick={() => setMenuOpen(false)}
                  >
                    Iniciar sesión
                  </Button>
                  <Button
                    href="/registro"
                    variant="primary"
                    fullWidth
                    onClick={() => setMenuOpen(false)}
                  >
                    Registrarse
                  </Button>
                </div>
              )}
            </nav>
          </Container>
        </div>
      )}
    </header>
  );
}
