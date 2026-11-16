"use client";

import Link from "next/link";
import { ClipboardList, Goal, LayoutDashboard } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import styles from "./AdminSidebar.module.scss";

interface Seccion {
  href: string;
  etiqueta: string;
  icono: LucideIcon;
  exacta?: boolean;
}

const SECCIONES: Seccion[] = [
  { href: "/admin", etiqueta: "Dashboard", icono: LayoutDashboard, exacta: true },
  { href: "/admin/canchas", etiqueta: "Canchas y horarios", icono: Goal },
  { href: "/admin/reservas", etiqueta: "Reservas", icono: ClipboardList },
];

export interface AdminSidebarProps {
  /** En móvil, si el cajón está abierto. */
  abierto: boolean;
  /** Ruta activa (usePathname). */
  pathname: string;
  /** Se ejecuta al navegar (cierra el cajón móvil). */
  onNavigate: () => void;
}

/** Sidebar oscuro de administración; cajón deslizante en móvil. */
export function AdminSidebar({ abierto, pathname, onNavigate }: AdminSidebarProps) {
  return (
    <aside
      id="admin-sidebar"
      aria-label="Secciones de administración"
      className={cn(styles.sidebar, abierto && styles.abierto)}
    >
      <nav className={styles.nav}>
        {SECCIONES.map((seccion) => {
          const activa = seccion.exacta
            ? pathname === seccion.href
            : pathname.startsWith(seccion.href);

          return (
            <Link
              key={seccion.href}
              href={seccion.href}
              aria-current={activa ? "page" : undefined}
              className={cn(styles.item, activa && styles.itemActivo)}
              onClick={onNavigate}
            >
              <seccion.icono size={18} aria-hidden="true" />
              <span>{seccion.etiqueta}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
