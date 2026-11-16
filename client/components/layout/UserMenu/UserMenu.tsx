"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronDown, LogOut, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/contexts/SessionContext";
import { apiHabilitada } from "@/lib/api/config";
import { cn } from "@/lib/utils/cn";
import styles from "./UserMenu.module.scss";

/**
 * Menú de usuario (sesión de demostración). Muestra el nombre, las
 * rutas según rol y el cierre de sesión.
 */
export function UserMenu() {
  const { usuario, estado, cerrarSesion } = useSession();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!usuario) return null;

  const handleLogout = () => {
    setOpen(false);
    cerrarSesion();
    toast.success(`Sesión cerrada${apiHabilitada() ? "" : " (demo)"}`);
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.avatar} aria-hidden="true">
          <User size={16} />
        </span>
        <span className={styles.triggerName}>{usuario.nombre}</span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={cn(styles.chevron, open && styles.chevronOpen)}
        />
      </button>

      {open && (
        <div className={styles.menu}>
          <div className={styles.menuHeader}>
            <span className={styles.menuName}>{usuario.nombre}</span>
            <span className={styles.menuEmail}>{usuario.email}</span>
            <span className={styles.menuRole}>
              {estado === "admin" ? "administrador" : "cliente"}
            </span>
          </div>

          <Link href="/mis-reservas" className={styles.item} onClick={() => setOpen(false)}>
            <CalendarDays size={16} aria-hidden="true" />
            Mis reservas
          </Link>

          {estado === "admin" && (
            <Link href="/admin" className={styles.item} onClick={() => setOpen(false)}>
              <ShieldCheck size={16} aria-hidden="true" />
              Administración
            </Link>
          )}

          <button type="button" className={cn(styles.item, styles.danger)} onClick={handleLogout}>
            <LogOut size={16} aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
