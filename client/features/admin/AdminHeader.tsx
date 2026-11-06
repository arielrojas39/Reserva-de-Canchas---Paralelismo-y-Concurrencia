"use client";

import { useRouter } from "next/navigation";
import { LogOut, Menu, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { useSession } from "@/contexts/SessionContext";
import { apiHabilitada } from "@/lib/api/config";
import type { Usuario } from "@/types";
import styles from "./AdminHeader.module.scss";

export interface AdminHeaderProps {
  usuario: Usuario;
  menuAbierto: boolean;
  onAlternarMenu: () => void;
}

/** Barra superior del panel: menú móvil, identidad y cierre de sesión. */
export function AdminHeader({ usuario, menuAbierto, onAlternarMenu }: AdminHeaderProps) {
  const router = useRouter();
  const { cerrarSesion } = useSession();

  const handleCerrarSesion = () => {
    cerrarSesion();
    toast.success(`Sesión cerrada${apiHabilitada() ? "" : " (demo)"}`);
    router.push("/");
  };

  return (
    <header className={styles.header}>
      <button
        type="button"
        className={styles.menuButton}
        aria-expanded={menuAbierto}
        aria-controls="admin-sidebar"
        aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
        onClick={onAlternarMenu}
      >
        <Menu size={22} />
      </button>

      <span className={styles.titulo}>Panel de administración</span>

      <div className={styles.usuario}>
        <span className={styles.avatar} aria-hidden="true">
          <User size={18} />
        </span>
        <span className={styles.datos}>
          <span className={styles.nombre}>{usuario.nombre}</span>
          <span className={styles.rol}>
            <ShieldCheck size={12} aria-hidden="true" />
            administrador{apiHabilitada() ? "" : " (demo)"}
          </span>
        </span>
        <Button variant="outline" size="sm" onClick={handleCerrarSesion}>
          <LogOut size={16} aria-hidden="true" />
          Cerrar sesión
        </Button>
      </div>
    </header>
  );
}
